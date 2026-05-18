import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useOutletContext, useParams } from "react-router";
import { getThemeColor, setActiveTheme } from "../../lib/utils";
import { useTheme } from "../ThemeProvider";
import { useCamera, useCameraSync } from "../../hooks/useCamera";
import { useRectangleDraw } from "../../hooks/useRectangle";
import { drawShapesLayer, drawConnectorsLayer, drawOverlayLayer } from "../../canvas/draw";
import { getWorldPoint } from "../../canvas/transform";
import { useCanvasResize } from "../../hooks/useResizeCanvas";
import { useSpaceKey } from "../../hooks/UseSapcekey";
import { useSelectArea } from "../../hooks/useSelectArea";
import { useCircleDraw } from "../../hooks/useCircle";
import { usePenDraw } from "../../hooks/usePen";
import type { CanvasTool, HistoryActions, Tools, Shape, Connector } from "../../types/types";
import { useShapes } from "../../hooks/useShapes";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useText } from "../../hooks/useText";
import { useKeyboard } from "../../hooks/useKeyboard";
import TextToolbar from "./TextToolbar";
import { useConnector } from "../../hooks/useConnector";
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut
} from "../ui/context-menu";

type MenuItem = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    shortcut?: string;
};

type OutletContextType = {
    tool: Tools;
    setTool: (tool: Tools) => void,
    setUndoRedo: React.Dispatch<React.SetStateAction<HistoryActions>>
};


import { expandSelectionByGroup } from "../../helpers/selectionTools";
import {
    getDistanceToBezier,
    getConnectionPoint,
    getClosestSidePair,
    getBezierControl
} from "../../helpers/connectorHelpers";

interface WhiteBoardProps {
    initialElements?: Shape[];
    initialConnectors?: Connector[];
    initialCamera?: { scale: number; offset: { x: number; y: number } };
}

export interface WhiteBoardRef {
    getShapes: () => { elements: Shape[]; connectors: Connector[] };
    getCamera: () => { scale: number; offset: { x: number; y: number } };
    setCamera: (camera: { scale: number; offset: { x: number; y: number } }) => void;
}

const Whiteboard = forwardRef<WhiteBoardRef, WhiteBoardProps>(({ initialElements, initialConnectors, initialCamera }: WhiteBoardProps, ref) => {
    const [selectedIdsState, setSelectedIdsState] = useState<string[]>([])
    const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
    const [ghostPreview, setGhostPreview] = useState<{
        type: "rectangle" | "circle" | "text";
        x: number;
        y: number;
        width?: number;
        height?: number;
    } | null>(null);

    const textRef = useRef<HTMLDivElement | null>(null)
    const justFinishedRef = useRef<boolean>(false);
    const rafIdRef = useRef<number | null>(null);

    const [redrawCount, setRedrawCount] = useState(0);
    const requestRedraw = useCallback(() => setRedrawCount(c => c + 1), []);

    const { tool: activeTool, setTool, setUndoRedo } = useOutletContext<OutletContextType>();
    const { theme } = useTheme();


    const shapesCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const connectorsCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
    useCanvasResize(shapesCanvasRef, connectorsCanvasRef, overlayCanvasRef);

    // Global hooks (always active)
    const { scale, offset, setScale, setOffset, startPan, pan, endPan, zoom } = useCamera();
    useCameraSync(scale);

    useEffect(() => {
        const handleZoomIn = () => {
            if (overlayCanvasRef.current) zoom(-100, overlayCanvasRef.current);
        };
        const handleZoomOut = () => {
            if (overlayCanvasRef.current) zoom(100, overlayCanvasRef.current);
        };
        window.addEventListener('trigger-zoom-in', handleZoomIn);
        window.addEventListener('trigger-zoom-out', handleZoomOut);
        return () => {
            window.removeEventListener('trigger-zoom-in', handleZoomIn);
            window.removeEventListener('trigger-zoom-out', handleZoomOut);
        };
    }, [zoom]);
    const { pressedRef: spacePressedRef, pressed } = useSpaceKey();

    const { id } = useParams<{ id: string }>();
    const canvasId = id || "default";

    const {
        shapes,
        currentShape,
        addCurrentShape,
        addShape,
        updateShape,
        updateShapes,
        removeShapes,
        moveShapes,
        rotateShapes,
        resizeShapes,
        getShapeById,
        copyShapes,
        pasteShapes,
        duplicateShapes,
        bringToFront,
        sendToBack,
        groupShapes,
        ungroupShapes,
        clipboard,
        undo,
        redo,
        connectors,
        addConnector,
        addShapeWithConnector,
        removeConnector,
        setHistoryFromData
    } = useShapes(canvasId)

    const { isReadOnly } = useCanvasStore();

    useImperativeHandle(ref, () => ({
        getShapes: () => ({ elements: shapes, connectors }),
        getCamera: () => ({ scale, offset }),
        setCamera: (cam) => {
            if (cam) {
                if (cam.scale) setScale(cam.scale);
                if (cam.offset) setOffset(cam.offset);
            }
        }
    }));

    useEffect(() => {
        if (initialCamera) {
            if (initialCamera.scale) setScale(initialCamera.scale);
            if (initialCamera.offset) setOffset(initialCamera.offset);
        }
    }, [initialCamera, setScale, setOffset]);

    useEffect(() => {
        if (initialElements && initialConnectors) {
            setHistoryFromData(initialElements, initialConnectors);
        }
    }, [initialElements, initialConnectors, setHistoryFromData]);

    const {
        connectionState,
        dotShapeId: connectorDotShapeId,
        onPointerDown: onConnectorPointerDown,
        onPointerMove: onConnectorPointerMove,
        onPointerUp: onConnectorPointerUp,
    } = useConnector();

    const {
        generatedElements,
        generatedConnectors,
        setGeneratedElements,
        setGeneratedConnectors,
        generatedGroupOffset,
        setGeneratedGroupOffset,
        selectedNodeId,
        setSelectedNodeId,
        setHighlightedRange,
    } = useDiagramStore();

    // ── Group drag state ──────────────────────────────────────────────────────
    const groupDragRef = useRef<{
        active: boolean;
        componentId: string | null;
        startX: number;
        startY: number;
        originX: number;
        originY: number;
    }>({ active: false, componentId: null, startX: 0, startY: 0, originX: 0, originY: 0 });

    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

    // ── Offset-shifted elements (per-component offsets) ──────────────────────
    const shiftedGeneratedElements = useMemo(() => {
        const offset = generatedGroupOffset || { x: 0, y: 0 };
        return generatedElements.map(el => {
            if (el.type === "circle") {
                return { ...el, cx: el.cx + offset.x, cy: el.cy + offset.y };
            }
            if (el.type === "stroke") {
                return {
                    ...el,
                    points: el.points.map(p => ({ x: p.x + offset.x, y: p.y + offset.y }))
                };
            }
            // Rectangle or Text
            return { ...el, x: el.x + offset.x, y: el.y + offset.y };
        });
    }, [generatedElements, generatedGroupOffset]);

    // ── Helper: hit-test a single shifted element ─────────────────────────────
    function hitTestElement(el: Shape, p: { x: number; y: number }): boolean {
        if (el.type === "circle") {
            const dx = p.x - el.cx;
            const dy = p.y - el.cy;
            return Math.sqrt(dx * dx + dy * dy) <= el.r;
        }
        if (el.type === "rectangle" || el.type === "text") {
            return p.x >= el.x && p.x <= el.x + el.width && p.y >= el.y && p.y <= el.y + el.height;
        }
        return false;
    }

    // ── Helper: get bounding box of a specific shifted component ─────────────
    const getGroupBounds = useMemo(() => (componentId: string | null) => {
        if (!componentId) return null;
        const componentElements = shiftedGeneratedElements.filter((el) => (el.componentId || "default") === componentId);
        if (componentElements.length === 0) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        componentElements.forEach((el) => {
            let x: number, y: number, w: number, h: number;
            if (el.type === "circle") {
                x = el.cx - el.r; y = el.cy - el.r; w = el.r * 2; h = el.r * 2;
            } else if (el.type === "rectangle" || el.type === "text") {
                x = el.x; y = el.y; w = el.width; h = el.height;
            } else {
                return;
            }
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }, [shiftedGeneratedElements]);

    const shapesRef = useRef(shapes);
    useEffect(() => { shapesRef.current = shapes; }, [shapes]);

    const setSelectedIds = useCallback((idsOrUpdater: React.SetStateAction<string[]>) => {
        setSelectedIdsState(prev => {
            const nextIds = typeof idsOrUpdater === "function" ? idsOrUpdater(prev) : idsOrUpdater;
            return expandSelectionByGroup(nextIds, shapesRef.current);
        });
    }, []);

    const selectedIds = selectedIdsState;

    useEffect(() => {
        setUndoRedo(prev => {
            // 🧠 prevent infinite loop
            if (prev?.undo === undo && prev?.redo === redo) {
                return prev
            }

            return { undo, redo }
        })
    }, [undo, redo, setUndoRedo])
    // Circle tool hook
    const {
        draw: circleDraw,
        endDraw: circleEndDraw,
        startDraw: circleStartDraw,
        isDrawingRef: isCircleDrawingRef
    } = useCircleDraw(currentShape, addCurrentShape, addShape)

    // Rectangle tool hook
    const {
        draw,
        startDraw,
        endDraw,
        isDrawingRef,
    } = useRectangleDraw(currentShape, addCurrentShape, addShape);

    const {
        startPenDraw,
        penDraw,
        endPenDraw,
        isPenDrawingRef
    } = usePenDraw(currentShape, addCurrentShape, addShape)

    //Text tool hook
    const { editingText, setEditingText, startText, updateText, finishText } = useText(addShape, updateShape)

    const allElements = useMemo(() => [...shiftedGeneratedElements, ...shapes], [shiftedGeneratedElements, shapes]);
    const allConnectors = useMemo(() => [...generatedConnectors, ...connectors], [generatedConnectors, connectors]);

    //Select tool hook
    const {
        selectArea,
        startSelect,
        onPointerMove: updateSelect,
        onPointerUp: endSelect,
        resetSelection,
        guides
    } = useSelectArea(overlayCanvasRef, scale, offset, shapes, moveShapes, selectedIds, setSelectedIds, resizeShapes, rotateShapes, spacePressedRef, justFinishedRef, updateShapes, duplicateShapes);

    // ── Phase 1: Keyboard Accessibility ─────────────────────────────────
    const clearSelection = useCallback(() => setSelectedIds([]), []);

    const selectAll = useCallback(() => {
        setSelectedIds(shapes.map(s => s.id));
    }, [shapes]);

    const combinedRemoveShapes = useCallback((ids: string[]) => {
        removeShapes(ids);
        setGeneratedElements(prev => prev.filter(el => !ids.includes(el.id)));
        setGeneratedConnectors(prev => prev.filter(conn => !ids.includes(conn.fromShapeId) && !ids.includes(conn.toShapeId)));
    }, [removeShapes, setGeneratedElements, setGeneratedConnectors]);

    useKeyboard({
        selectedIds,
        isEditingText: editingText !== null,
        removeShapes: combinedRemoveShapes,
        undo,
        redo,
        moveShapes,
        updateShapes,
        clearSelection,
        finishText,
        copyShapes,
        pasteShapes,
        duplicateShapes,
        groupShapes,
        ungroupShapes,
        selectAll,
        setSelectedIds,
        setTool
    });





    useEffect(() => {
        if (activeTool != "select") {
            setSelectedIds([]);
            setSelectedConnectorId(null);
            resetSelection();
        }
        setGhostPreview(null);
    }, [activeTool])

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (isReadOnly) return;
            // Prevent interference with input fields
            if (e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;

            if ((e.code === "Delete" || e.code === "Backspace") && !editingText) {
                if (selectedConnectorId) {
                    e.preventDefault();
                    removeConnector(selectedConnectorId);
                    setSelectedConnectorId(null);
                }
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedConnectorId, editingText, removeConnector, isReadOnly]);

    // TOOL ADAPTERS
    const selectTool: CanvasTool = {
        onPointerDown: (e) => {
            const canvas = overlayCanvasRef.current;
            if (!canvas) return;

            const p = getWorldPoint(e, canvas, scale, offset);

            // ── Generated group: intercept before anything else ────────────
            if (activeTool === "select" && e.isPrimary) {
                const hitElement = [...shiftedGeneratedElements].reverse().find((el) => hitTestElement(el, p));
                if (hitElement) {
                    const componentId = hitElement.componentId || "default";
                    setSelectedComponentId(componentId);
                    setSelectedNodeId(hitElement.id);
                    if (hitElement.source) {
                        setHighlightedRange(hitElement.source);
                    }

                    setSelectedIds([]);
                    setSelectedConnectorId(null);

                    const currentOffset = generatedGroupOffset || { x: 0, y: 0 };
                    groupDragRef.current = {
                        active: true,
                        componentId,
                        startX: p.x,
                        startY: p.y,
                        originX: currentOffset.x,
                        originY: currentOffset.y,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                    return; // skip normal selection
                }
                // Clicked outside any diagram element → deselect diagram
                setSelectedComponentId(null);
                setSelectedNodeId(null);
                setHighlightedRange(null);
            }

            if (activeTool === "select" && e.isPrimary) {
                const consumed = onConnectorPointerDown(p, allElements);
                if (consumed) return; // skip normal selection logic if starting a connector

                // Check connector hit
                let hitConnectorId: string | null = null;
                for (const conn of connectors) {
                    const fromShape = getShapeById(conn.fromShapeId);
                    const toShape = getShapeById(conn.toShapeId);
                    if (!fromShape || !toShape) continue;

                    const { fromSide, toSide } = getClosestSidePair(fromShape, toShape);
                    const p1 = getConnectionPoint(fromShape, fromSide);
                    const p2 = getConnectionPoint(toShape, toSide);
                    const cp1 = getBezierControl(p1, p2, 0.35);
                    const cp2 = getBezierControl(p2, p1, 0.35);

                    const dist = getDistanceToBezier(p, p1, cp1, cp2, p2);
                    if (dist < 10 / scale) {
                        hitConnectorId = conn.id;
                        break;
                    }
                }

                if (hitConnectorId) {
                    setSelectedConnectorId(hitConnectorId);
                    setSelectedIds([]);
                    return; // skip normal selection logic
                }

                // If not hit a connector, clear connector selection
                setSelectedConnectorId(null);
            }

            if (editingText) {
                const current = finishText()
                if (current) {
                    justFinishedRef.current = true;
                    setSelectedIds([current])
                }
                return
            }

            startSelect(p, e.altKey)
        },
        onPointerMove: (e) => {
            const canvas = overlayCanvasRef.current;
            if (!canvas) return;
            const p = getWorldPoint(e, canvas, scale, offset);

            // ── Group drag 
            if (groupDragRef.current.active) {
                const { startX, startY, originX, originY, componentId } = groupDragRef.current;
                if (componentId) {
                    setGeneratedGroupOffset({
                        x: originX + (p.x - startX),
                        y: originY + (p.y - startY),
                    });
                }
                return;
            }

            if (activeTool === "select") {
                onConnectorPointerMove(p, allElements);
            }

            updateSelect(e);
        },
        onPointerUp: (e) => {
            // ── End group drag 
            if (groupDragRef.current.active) {
                groupDragRef.current.active = false;
                return;
            }

            if (activeTool === "select") {
                const canvas = overlayCanvasRef.current;
                if (canvas) {
                    const p = getWorldPoint(e, canvas, scale, offset);
                    const intent = onConnectorPointerUp(p, allElements);
                    if (intent) {
                        if (intent.type === "connect") {
                            addConnector(
                                intent.fromShapeId,
                                intent.fromSide,
                                intent.toShapeId,
                                intent.toSide
                            );
                        } else if (intent.type === "create") {
                            const newConnector: import("../../types/types").Connector = {
                                id: crypto.randomUUID(),
                                fromShapeId: intent.sourceId,
                                fromSide: intent.side,
                                toShapeId: intent.newShape.id,
                                toSide: (
                                    intent.side === "top" ? "bottom" :
                                        intent.side === "bottom" ? "top" :
                                            intent.side === "left" ? "right" : "left"
                                )
                            };
                            addShapeWithConnector(intent.newShape, newConnector);
                            setSelectedIds([intent.newShape.id]);
                        }
                    }
                }
            }
            endSelect();
        },
        cursor: "default",
    };


    //circle tool
    const circleTool: CanvasTool = {
        onPointerDown: (e) => {
            if (!overlayCanvasRef.current) return;
            const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset);
            circleStartDraw(p);
        },
        onPointerMove: (e) => {
            if (!overlayCanvasRef.current || !isCircleDrawingRef.current) return;
            const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset);
            circleDraw(p);
        },
        onPointerUp: () => {
            setGhostPreview(null);
            const current = circleEndDraw()

            if (!current) return

            setSelectedIds([current.id]);
            setTool("select")
        },
        cursor: "crosshair",
    };

    const rectangleTool: CanvasTool = {
        onPointerDown: (e) => {
            if (!overlayCanvasRef.current) return;
            const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset);
            startDraw(p);
        },
        onPointerMove: (e) => {
            if (!overlayCanvasRef.current || !isDrawingRef.current) return;
            const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset);
            draw(p);
        },
        onPointerUp: () => {
            setGhostPreview(null);
            const created = endDraw();

            if (!created) return

            setSelectedIds([created.id])
            setTool("select")
        },
        cursor: "crosshair",
    };

    //Pen tool
    const penTool: CanvasTool = {
        onPointerDown: (e) => {
            if (!overlayCanvasRef.current) return
            const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset)
            startPenDraw(p)
        },
        onPointerMove: (e) => {
            if (!overlayCanvasRef.current || !isPenDrawingRef.current) return
            const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset)
            penDraw(p)
        },
        onPointerUp: () => {
            const current = endPenDraw()

            if (!current) return

            setSelectedIds([current.id]);
            setTool("select")
        },
        cursor: "crosshair"
    }

    const textTool: CanvasTool = {
        onPointerDown: (e) => {
            if (!overlayCanvasRef.current) return
            const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset)
            startText(p)
            setGhostPreview(null);
            setTool("select")
        },
        cursor: 'text'
    }


    const tools: Record<Tools, CanvasTool> = useMemo(() => ({
        select: selectTool,
        rectangle: rectangleTool,
        circle: circleTool,
        pen: penTool,
        text: textTool
    }), [selectTool, rectangleTool, circleTool, penTool, textTool]);

    const cursor = useMemo(() => {
        if (pressed) return "grab";
        const cursors: Record<Tools, string> = {
            select: "default",
            rectangle: "crosshair",
            circle: "crosshair",
            pen: "crosshair",
            text: "text"
        };
        return cursors[activeTool] ?? "default";
    }, [activeTool, pressed]);

    // LAYER 1 — Connectors: Bottom layer (so lines appear behind shapes)
    useLayoutEffect(() => {
        if (!shapesCanvasRef.current || !connectorsCanvasRef.current || !overlayCanvasRef.current) return;
        setActiveTheme(theme);
        drawConnectorsLayer(connectorsCanvasRef.current, allConnectors, allElements, scale, offset, selectedConnectorId, requestRedraw);

    }, [allConnectors, allElements, scale, offset, selectedConnectorId, redrawCount, theme]);

    // LAYER 2 — Shapes: Middle layer
    useLayoutEffect(() => {
        if (!shapesCanvasRef.current || !connectorsCanvasRef.current || !overlayCanvasRef.current) return;
        setActiveTheme(theme);
        drawShapesLayer(shapesCanvasRef.current, currentShape, allElements, scale, offset, editingText);

    }, [currentShape, allElements, scale, offset, editingText, theme]);

    // LAYER 3 — Overlay: Top layer (Selection, dots, interactive UI)
    useLayoutEffect(() => {
        if (!shapesCanvasRef.current || !connectorsCanvasRef.current || !overlayCanvasRef.current) return;
        setActiveTheme(theme);
        drawOverlayLayer(
            overlayCanvasRef.current,
            allElements, scale, offset,
            selectArea, selectedIds,
            editingText, guides,
            connectionState, connectorDotShapeId,
            ghostPreview,
            selectedComponentId, selectedNodeId,
            shiftedGeneratedElements,
            getGroupBounds
        );

    }, [selectArea, selectedIds, editingText, guides, connectionState,
        connectorDotShapeId, ghostPreview, selectedConnectorId,
        selectedComponentId, selectedNodeId, scale, offset, allElements, theme]);




    function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        if (isReadOnly && !spacePressedRef.current) return;

        if (!e.isPrimary) return;

        if (spacePressedRef.current) {
            startPan(e.clientX, e.clientY);
            return;
        }

        e.currentTarget.setPointerCapture(e.pointerId);

        tools[activeTool]?.onPointerDown?.(
            e);
    }

    function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        if (rafIdRef.current !== null) {

            return;
        }
        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            pan(e.clientX, e.clientY);

            if (isReadOnly) return;

            if (overlayCanvasRef.current && activeTool !== "select" && activeTool !== "pen") {
                const isDrawing = isDrawingRef?.current || isCircleDrawingRef?.current || isPenDrawingRef?.current;
                if (e.buttons === 0 && !spacePressedRef.current && !isDrawing) {
                    const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset);
                    if (activeTool === "rectangle") {
                        setGhostPreview({ type: "rectangle", x: p.x - 60, y: p.y - 40, width: 120, height: 80 });
                    } else if (activeTool === "circle") {
                        setGhostPreview({ type: "circle", x: p.x - 50, y: p.y - 50 });
                    } else if (activeTool === "text") {
                        setGhostPreview({ type: "text", x: p.x, y: p.y });
                    } else {
                        setGhostPreview(null);
                    }
                } else {
                    setGhostPreview(null);
                }
            } else {
                setGhostPreview(null);
            }

            tools[activeTool]?.onPointerMove?.(
                e
            );
        });
    }

    function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {

        endPan();

        if (isReadOnly) return;

        e.currentTarget.releasePointerCapture(e.pointerId);

        tools[activeTool]?.onPointerUp?.(e);
    }

    function onDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
        if (isReadOnly) return;
        if (!overlayCanvasRef.current) return;

        const p = getWorldPoint(e, overlayCanvasRef.current, scale, offset);

        const hitId = allElements
            .slice()
            .reverse()
            .find(shape => {
                if (shape.type !== "text") return false;

                return (
                    p.x >= shape.x &&
                    p.x <= shape.x + shape.width &&
                    p.y >= shape.y &&
                    p.y <= shape.y + shape.height
                );
            })?.id;

        if (!hitId) return;

        const shape = getShapeById(hitId);

        if (shape?.type === "text") {
            startText({ x: shape.x, y: shape.y }, shape);
        }
    }



    useEffect(() => {
        if (!editingText) return

        requestAnimationFrame(() => {
            const el = textRef.current
            if (!el) return

            el.focus()
            el.innerText = editingText.text

            const range = document.createRange();
            range.selectNodeContents(el);

            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

        })

    }, [editingText?.id])

    const handleCopy = useCallback(() => copyShapes(selectedIds), [copyShapes, selectedIds]);
    const handlePaste = useCallback(() => {
        const newIds = pasteShapes();
        if (newIds.length > 0) setSelectedIds(newIds);
    }, [pasteShapes, setSelectedIds]);
    const handleDuplicate = useCallback(() => {
        const newIds = duplicateShapes(selectedIds);
        if (newIds.length > 0) setSelectedIds(newIds);
    }, [selectedIds, duplicateShapes, setSelectedIds]);
    const handleDelete = useCallback(() => {
        removeShapes(selectedIds);
        setSelectedIds([]);
    }, [selectedIds, removeShapes, setSelectedIds]);
    const handleGroup = useCallback(() => groupShapes(selectedIds), [selectedIds, groupShapes]);
    const handleUngroup = useCallback(() => ungroupShapes(selectedIds), [selectedIds, ungroupShapes]);

    const menuItems: MenuItem[] = useMemo(() => {
        if (selectedIds.length === 0) {
            return [
                { label: "Undo", onClick: undo, shortcut: "Ctrl+Z" },
                { label: "Redo", onClick: redo, shortcut: "Ctrl+Y" },
                { label: "Paste", onClick: handlePaste, shortcut: "Ctrl+V", disabled: clipboard.length === 0 },
                { label: "Select All", onClick: selectAll, shortcut: "Ctrl+A" }
            ];
        } else {
            return [
                { label: "Copy", onClick: handleCopy, shortcut: "Ctrl+C" },
                { label: "Paste", onClick: handlePaste, shortcut: "Ctrl+V", disabled: clipboard.length === 0 },
                { label: "Duplicate", onClick: handleDuplicate, shortcut: "Ctrl+D" },
                ...(selectedIds.length > 1 ? [{ label: "Group", onClick: handleGroup, shortcut: "Ctrl+G" }] : []),
                ...(selectedIds.some(id => shapes.find(s => s.id === id)?.groupId) ? [{ label: "Ungroup", onClick: handleUngroup, shortcut: "Ctrl+Shift+G" }] : []),
                { label: "Select All", onClick: selectAll, shortcut: "Ctrl+A" },
                { label: "Delete", onClick: handleDelete, shortcut: "Del" },
                { label: "Bring to Front", onClick: () => bringToFront(selectedIds) },
                { label: "Send to Back", onClick: () => sendToBack(selectedIds) }
            ];
        }
    }, [selectedIds, clipboard, handleCopy, handlePaste, selectAll, handleDuplicate, shapes, undo, redo, handleGroup, handleUngroup, handleDelete, bringToFront, sendToBack]);

    const code = useDiagramStore(s => s.code);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {selectedIds.length === 1 && getShapeById(selectedIds[0])?.type === "text" && !isReadOnly && (
                <TextToolbar
                    shape={getShapeById(selectedIds[0])! as import("../../types/types").Text}
                    updateShape={updateShape}
                    editingText={editingText}
                    setEditingText={setEditingText}
                />
            )}
            <ContextMenu>
                <ContextMenuTrigger disabled={isReadOnly} className="block w-full h-full">

                    {editingText && (
                        <div
                            ref={textRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => {
                                const text = e.currentTarget.innerText;
                                updateText(text);
                            }}
                            style={{
                                position: "absolute",
                                left: editingText.x * scale + offset.x,
                                top: editingText.y * scale + offset.y,
                                outline: "none",
                                color: getThemeColor(),
                                lineHeight: "1.2",
                                padding: 0,
                                margin: 0,
                                display: "block",
                                minWidth: 40,
                                whiteSpace: "pre-wrap",
                                fontSize: `${editingText.fontSize * scale}px`,
                                fontFamily: "'Patrick Hand', sans-serif"
                            }}
                        />
                    )}
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <canvas ref={connectorsCanvasRef}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                width: '100%', height: '100%', pointerEvents: 'none'
                            }} />
                        <canvas ref={shapesCanvasRef}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                width: '100%', height: '100%', pointerEvents: 'none'
                            }} />
                        <canvas ref={overlayCanvasRef}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                width: '100%', height: '100%',
                                cursor,
                                touchAction: 'none', userSelect: 'none'
                            }}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            onDoubleClick={onDoubleClick}
                            onWheel={(e) => zoom(e.deltaY, overlayCanvasRef.current!)} />
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    {/* eslint-disable-next-line react-hooks/refs */}
                    {menuItems.map((item, idx) => (
                        <ContextMenuItem key={idx} onClick={item.onClick} disabled={item.disabled}>
                            {item.label}
                            {item.shortcut && <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>}
                        </ContextMenuItem>
                    ))}
                </ContextMenuContent>
            </ContextMenu>
            {/* ─── Welcome Message Overlay ─────────────────────────────────────── */}
            {shapes.length === 0 && connectors.length === 0 && code === "" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-center z-10 animate-in fade-in duration-700">
                    <div className="max-w-md px-6">
                        <h2 className="text-2xl font-bold text-foreground/50 mb-2">Start building your diagram...</h2>
                        <p className="text-foreground/20 text-sm">Use shapes or write LayerScript to begin</p>
                    </div>
                </div>
            )}
        </div>
    );
})

export default Whiteboard;
