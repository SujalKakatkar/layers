import React, {useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle} from "react";
import {useOutletContext, useParams} from "react-router";
import {useCamera} from "../../hooks/useCamera";
import {useRectangleDraw} from "../../hooks/useRectangle";
import {drawScene} from "../../canvas/draw";
import {getWorldPoint} from "../../canvas/transform";
import {useCanvasResize} from "../../hooks/useResizeCanvas";
import {useSpaceKey} from "../../hooks/UseSapcekey";
import {useSelectArea} from "../../hooks/useSelectArea";
import {useCircleDraw} from "../../hooks/useCircle";
import {usePenDraw} from "../../hooks/usePen";
import type {CanvasTool, HistoryActions, Tools, Shape, Connector} from "../../types/types";
import {useShapes} from "../../hooks/useShapes";
import {useDiagramStore} from "../../store/useDiagramStore";
import {useText} from "../../hooks/useText";
import {useKeyboard} from "../../hooks/useKeyboard";
import TextToolbar from "./TextToolbar";
import {useConnector} from "../../hooks/useConnector";
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


import {expandSelectionByGroup} from "../../helpers/selectionTools";
import {
    getDistanceToBezier,
    getConnectionPoint,
    getClosestSidePair,
    getBezierControl
} from "../../helpers/connectorHelpers";

interface WhiteBoardProps {
    initialElements?: Shape[];
    initialConnectors?: Connector[];
}

export interface WhiteBoardRef {
    getShapes: () => { elements: Shape[]; connectors: Connector[] };
}

const Whiteboard = forwardRef<WhiteBoardRef, WhiteBoardProps>(({initialElements, initialConnectors}: WhiteBoardProps, ref) => {
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

    const {tool: activeTool, setTool, setUndoRedo} = useOutletContext<OutletContextType>();


    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useCanvasResize(canvasRef);

    // Global hooks (always active)
    const {scale, offset, startPan, pan, endPan, zoom} = useCamera();
    const {pressedRef: spacePressedRef, pressed} = useSpaceKey();

    const {id} = useParams<{id: string}>();
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

    useImperativeHandle(ref, () => ({
        getShapes: () => ({ elements: shapes, connectors })
    }));

    useEffect(() => {
        if(initialElements && initialConnectors) {
            setHistoryFromData(initialElements, initialConnectors);
        }
    }, [initialElements, initialConnectors, setHistoryFromData]);

    const {
        connectionState,
        dotShapeId: connectorDotShapeId,
        onPointerDown: onConnectorPointerDown,
        onPointerMove: onConnectorPointerMove,
        onPointerUp: onConnectorPointerUp,
        cancelDrag: cancelConnectorDrag,
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
    // We track dragging in a ref (not state) to avoid re-renders mid-drag.
    const groupDragRef = useRef<{
        active: boolean;
        startX: number;  // world coords where drag began
        startY: number;
        originX: number; // offset at drag start
        originY: number;
    }>({active: false, startX: 0, startY: 0, originX: 0, originY: 0});

    const [groupSelected, setGroupSelected] = useState(false);

    // ── Offset-shifted elements (cheap memo, no layout changes) ───────────────
    const shiftedGeneratedElements = useMemo(() => {
        const {x: ox, y: oy} = generatedGroupOffset;
        if(ox === 0 && oy === 0) return generatedElements;
        return generatedElements.map((el: any) => {
            if(el.type === "circle") {
                return {...el, cx: el.cx + ox, cy: el.cy + oy};
            }
            return {...el, x: el.x + ox, y: el.y + oy};
        });
    }, [generatedElements, generatedGroupOffset]);

    // ── Helper: hit-test a single shifted element ─────────────────────────────
    function hitTestElement (el: any, p: {x: number; y: number}): boolean {
        if(el.type === "circle") {
            const dx = p.x - el.cx;
            const dy = p.y - el.cy;
            return Math.sqrt(dx * dx + dy * dy) <= el.r;
        }
        // rectangle / text
        return p.x >= el.x && p.x <= el.x + el.width && p.y >= el.y && p.y <= el.y + el.height;
    }

    // ── Helper: get bounding box of entire shifted group ──────────────────────
    function getGroupBounds () {
        if(shiftedGeneratedElements.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shiftedGeneratedElements.forEach((el: any) => {
            let x: number, y: number, w: number, h: number;
            if(el.type === "circle") {
                x = el.cx - el.r; y = el.cy - el.r; w = el.r * 2; h = el.r * 2;
            } else {
                x = el.x; y = el.y; w = el.width; h = el.height;
            }
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
        });
        return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
    }

    const shapesRef = useRef(shapes);
    useEffect(() => {shapesRef.current = shapes;}, [shapes]);

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
            if(prev?.undo === undo && prev?.redo === redo) {
                return prev
            }

            return {undo, redo}
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
    const {editingText, startText, updateText, finishText} = useText(addShape, updateShape)

    const allElements = [...shiftedGeneratedElements, ...shapes];

    //Select tool hook
    const {
        selectArea,
        startSelect,
        onPointerMove: updateSelect,
        onPointerUp: endSelect,
        resetSelection,
        guides
    } = useSelectArea(canvasRef, scale, offset, allElements, moveShapes, selectedIds, setSelectedIds, resizeShapes, rotateShapes, spacePressedRef, justFinishedRef, updateShapes, duplicateShapes);

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
        if(activeTool != "select") {
            setSelectedIds([]);
            setSelectedConnectorId(null);
            resetSelection();
        }
        setGhostPreview(null);
    }, [activeTool])

    useEffect(() => {
        function onKeyDown (e: KeyboardEvent) {
            // Prevent interference with input fields
            if(e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;

            if((e.code === "Delete" || e.code === "Backspace") && !editingText) {
                if(selectedConnectorId) {
                    e.preventDefault();
                    removeConnector(selectedConnectorId);
                    setSelectedConnectorId(null);
                }
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedConnectorId, editingText, removeConnector]);

    // TOOL ADAPTERS
    const selectTool: CanvasTool = {
        onPointerDown: (e) => {
            const canvas = canvasRef.current;
            if(!canvas) return;

            const p = getWorldPoint(e, canvas, scale, offset);

            // ── Generated group: intercept before anything else ────────────
            if(activeTool === "select" && e.isPrimary) {
                const hitElement = [...shiftedGeneratedElements].reverse().find((el: any) => hitTestElement(el, p));
                if(hitElement) {
                    setGroupSelected(true);
                    setSelectedNodeId(hitElement.id);
                    if(hitElement.source) {
                        setHighlightedRange(hitElement.source);
                    }

                    setSelectedIds([]);
                    setSelectedConnectorId(null);
                    groupDragRef.current = {
                        active: true,
                        startX: p.x,
                        startY: p.y,
                        originX: generatedGroupOffset.x,
                        originY: generatedGroupOffset.y,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                    return; // skip normal selection
                }
                // Clicked outside group → deselect group
                setGroupSelected(false);
                setSelectedNodeId(null);
                setHighlightedRange(null);
            }

            if(activeTool === "select" && e.isPrimary) {
                const consumed = onConnectorPointerDown(p, allElements);
                if(consumed) return; // skip normal selection logic if starting a connector

                // Check connector hit
                let hitConnectorId: string | null = null;
                for(const conn of connectors) {
                    const fromShape = getShapeById(conn.fromShapeId);
                    const toShape = getShapeById(conn.toShapeId);
                    if(!fromShape || !toShape) continue;

                    const {fromSide, toSide} = getClosestSidePair(fromShape, toShape);
                    const p1 = getConnectionPoint(fromShape, fromSide);
                    const p2 = getConnectionPoint(toShape, toSide);
                    const cp1 = getBezierControl(p1, p2, 0.35);
                    const cp2 = getBezierControl(p2, p1, 0.35);

                    const dist = getDistanceToBezier(p, p1, cp1, cp2, p2);
                    if(dist < 10 / scale) {
                        hitConnectorId = conn.id;
                        break;
                    }
                }

                if(hitConnectorId) {
                    setSelectedConnectorId(hitConnectorId);
                    setSelectedIds([]);
                    return; // skip normal selection logic
                }

                // If not hit a connector, clear connector selection
                setSelectedConnectorId(null);
            }

            if(editingText) {
                const current = finishText()
                if(current) {
                    justFinishedRef.current = true;
                    setSelectedIds([current])
                }
                return
            }

            startSelect(p, e.altKey)
        },
        onPointerMove: (e) => {
            const canvas = canvasRef.current;
            if(!canvas) return;
            const p = getWorldPoint(e, canvas, scale, offset);

            // ── Group drag ────────────────────────────────────────────────
            if(groupDragRef.current.active) {
                const {startX, startY, originX, originY} = groupDragRef.current;
                setGeneratedGroupOffset({
                    x: originX + (p.x - startX),
                    y: originY + (p.y - startY),
                });
                return;
            }

            if(activeTool === "select") {
                onConnectorPointerMove(p, allElements);
            }

            updateSelect(e);
        },
        onPointerUp: (e) => {
            // ── End group drag ────────────────────────────────────────────
            if(groupDragRef.current.active) {
                groupDragRef.current.active = false;
                return;
            }

            if(activeTool === "select") {
                const canvas = canvasRef.current;
                if(canvas) {
                    const p = getWorldPoint(e, canvas, scale, offset);
                    const intent = onConnectorPointerUp(p, allElements);
                    if(intent) {
                        if(intent.type === "connect") {
                            addConnector(
                                intent.fromShapeId,
                                intent.fromSide,
                                intent.toShapeId,
                                intent.toSide
                            );
                        } else if(intent.type === "create") {
                            const newConnector = {
                                id: crypto.randomUUID(),
                                fromShapeId: intent.sourceId,
                                fromSide: intent.side,
                                toShapeId: intent.newShape.id,
                                toSide: (
                                    intent.side === "top" ? "bottom" :
                                        intent.side === "bottom" ? "top" :
                                            intent.side === "left" ? "right" : "left"
                                ) as any
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
            if(!canvasRef.current) return;
            const p = getWorldPoint(e, canvasRef.current, scale, offset);
            circleStartDraw(p);
        },
        onPointerMove: (e) => {
            if(!canvasRef.current || !isCircleDrawingRef.current) return;
            const p = getWorldPoint(e, canvasRef.current, scale, offset);
            circleDraw(p);
        },
        onPointerUp: () => {
            setGhostPreview(null);
            const current = circleEndDraw()

            if(!current) return

            setSelectedIds([current.id]);
            setTool("select")
        },
        cursor: "crosshair",
    };

    const rectangleTool: CanvasTool = {
        onPointerDown: (e) => {
            if(!canvasRef.current) return;
            const p = getWorldPoint(e, canvasRef.current, scale, offset);
            startDraw(p);
        },
        onPointerMove: (e) => {
            if(!canvasRef.current || !isDrawingRef.current) return;
            const p = getWorldPoint(e, canvasRef.current, scale, offset);
            draw(p);
        },
        onPointerUp: () => {
            setGhostPreview(null);
            const created = endDraw();

            if(!created) return

            setSelectedIds([created.id])
            setTool("select")
        },
        cursor: "crosshair",
    };

    //Pen tool
    const penTool: CanvasTool = {
        onPointerDown: (e) => {
            if(!canvasRef.current) return
            const p = getWorldPoint(e, canvasRef.current, scale, offset)
            startPenDraw(p)
        },
        onPointerMove: (e) => {
            if(!canvasRef.current || !isPenDrawingRef.current) return
            const p = getWorldPoint(e, canvasRef.current, scale, offset)
            penDraw(p)
        },
        onPointerUp: () => {
            const current = endPenDraw()

            if(!current) return

            setSelectedIds([current.id]);
            setTool("select")
        },
        cursor: "crosshair"
    }

    const textTool: CanvasTool = {
        onPointerDown: (e) => {
            if(!canvasRef.current) return
            const p = getWorldPoint(e, canvasRef.current, scale, offset)
            startText(p)
            setGhostPreview(null);
            setTool("select")
        },
        cursor: 'text'
    }


    const tools: Record<Tools, CanvasTool> = {
        select: selectTool,
        rectangle: rectangleTool,
        circle: circleTool,
        pen: penTool,
        text: textTool
    };

    // CURSOR
    useEffect(() => {
        if(!canvasRef.current) return
        canvasRef.current.style.cursor = spacePressedRef.current
            ? "grab"
            : tools[activeTool]?.cursor ?? "default";
    }, [activeTool, pressed]);

    // DRAW SCENE
    useEffect(() => {
        if(!canvasRef.current) return;

        const allElements = [...shiftedGeneratedElements, ...shapes];
        const allConnectors = [...generatedConnectors, ...connectors];

        drawScene(
            canvasRef.current,
            currentShape,
            allElements,
            scale,
            offset,
            selectArea,
            selectedIds,
            editingText,
            guides,
            allConnectors,
            connectionState,
            connectorDotShapeId,
            ghostPreview,
            selectedConnectorId
        );

        // ── Draw generated-group selection bounding box ──────────────────
        if(groupSelected && shiftedGeneratedElements.length > 0) {
            const ctx = canvasRef.current.getContext("2d");
            if(ctx) {
                const dpr = window.devicePixelRatio || 1;
                const gb = getGroupBounds();
                if(gb) {
                    const pad = 14;
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.scale(dpr, dpr);
                    ctx.translate(offset.x, offset.y);
                    ctx.scale(scale, scale);

                    ctx.strokeStyle = "#10B981"; // Emerald
                    ctx.lineWidth = 1.5 / scale;
                    ctx.setLineDash([6 / scale, 3 / scale]);
                    ctx.strokeRect(gb.x - pad, gb.y - pad, gb.width + pad * 2, gb.height + pad * 2);

                    // ── Move hint label (Emerald Text) ───────────────────
                    ctx.setLineDash([]);
                    const labelText = "Drag to move group";
                    ctx.font = `bold ${Math.max(12, 12 / scale)}px sans-serif`;

                    // Draw text at top-left
                    ctx.fillStyle = "#10B981";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "bottom";
                    ctx.fillText(labelText, gb.x - pad, gb.y - pad - 6 / scale);

                    ctx.restore();
                }
            }
        }

        // ── Draw individual generated node highlight ────────────────────
        if(selectedNodeId) {
            const el = shiftedGeneratedElements.find((e: any) => e.id === selectedNodeId);
            if(el) {
                const ctx = canvasRef.current.getContext("2d");
                if(ctx) {
                    const dpr = window.devicePixelRatio || 1;
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.scale(dpr, dpr);
                    ctx.translate(offset.x, offset.y);
                    ctx.scale(scale, scale);

                    ctx.strokeStyle = "#10B981"; // Emerald
                    ctx.lineWidth = 3 / scale;
                    if(el.type === "circle") {
                        ctx.beginPath();
                        ctx.arc(el.cx, el.cy, el.r + 5 / scale, 0, Math.PI * 2);
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(el.x - 5 / scale, el.y - 5 / scale, el.width + 10 / scale, el.height + 10 / scale);
                    }
                    ctx.restore();
                }
            }
        }
    }, [currentShape, shapes, scale, offset, selectArea, selectedIds, editingText, guides, connectors, connectionState, connectorDotShapeId, ghostPreview, selectedConnectorId, shiftedGeneratedElements, generatedConnectors, groupSelected, selectedNodeId]);




    function onPointerDown (e: React.PointerEvent<HTMLCanvasElement>) {

        if(!e.isPrimary) return;

        if(spacePressedRef.current) {
            startPan(e.clientX, e.clientY);
            return;
        }

        e.currentTarget.setPointerCapture(e.pointerId);

        tools[activeTool]?.onPointerDown?.(
            e);
    }

    function onPointerMove (e: React.PointerEvent<HTMLCanvasElement>) {

        pan(e.clientX, e.clientY);

        if(canvasRef.current && activeTool !== "select" && activeTool !== "pen") {
            const isDrawing = isDrawingRef?.current || isCircleDrawingRef?.current || isPenDrawingRef?.current;
            if(e.buttons === 0 && !spacePressedRef.current && !isDrawing) {
                const p = getWorldPoint(e, canvasRef.current, scale, offset);
                if(activeTool === "rectangle") {
                    setGhostPreview({type: "rectangle", x: p.x - 60, y: p.y - 40, width: 120, height: 80});
                } else if(activeTool === "circle") {
                    setGhostPreview({type: "circle", x: p.x - 50, y: p.y - 50});
                } else if(activeTool === "text") {
                    setGhostPreview({type: "text", x: p.x, y: p.y});
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
    }

    function onPointerUp (e: React.PointerEvent<HTMLCanvasElement>) {

        endPan();

        e.currentTarget.releasePointerCapture(e.pointerId);

        tools[activeTool]?.onPointerUp?.(e);
    }

    function onDoubleClick (e: React.MouseEvent<HTMLCanvasElement>) {
        if(!canvasRef.current) return;

        const p = getWorldPoint(e, canvasRef.current, scale, offset);

        const hitId = allElements
            .slice()
            .reverse()
            .find(shape => {
                if(shape.type !== "text") return false;

                return (
                    p.x >= shape.x &&
                    p.x <= shape.x + shape.width &&
                    p.y >= shape.y &&
                    p.y <= shape.y + shape.height
                );
            })?.id;

        if(!hitId) return;

        const shape = getShapeById(hitId);

        if(shape?.type === "text") {
            startText({x: shape.x, y: shape.y}, shape);
        }
    }



    useEffect(() => {
        if(!editingText) return

        requestAnimationFrame(() => {
            const el = textRef.current
            if(!el) return

            el.focus()
            el.innerText = editingText.text

            const range = document.createRange();
            range.selectNodeContents(el);

            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

        })

    }, [editingText?.id])

    const handleCopy = () => copyShapes(selectedIds);
    const handlePaste = () => {
        const newIds = pasteShapes();
        if(newIds.length > 0) setSelectedIds(newIds);
    };
    const handleDuplicate = () => {
        const newIds = duplicateShapes(selectedIds);
        if(newIds.length > 0) setSelectedIds(newIds);
    };
    const handleDelete = () => {
        combinedRemoveShapes(selectedIds);
        setSelectedIds([]);
    };
    const handleGroup = () => groupShapes(selectedIds);
    const handleUngroup = () => ungroupShapes(selectedIds);

    let menuItems: MenuItem[] = [];

    if(selectedIds.length === 0) {
        menuItems = [
            {label: "Undo", onClick: undo, shortcut: "Ctrl+Z"},
            {label: "Redo", onClick: redo, shortcut: "Ctrl+Y"},
            {label: "Paste", onClick: handlePaste, shortcut: "Ctrl+V", disabled: clipboard.length === 0},
            {label: "Select All", onClick: selectAll, shortcut: "Ctrl+A"}
        ];
    } else {
        menuItems = [
            {label: "Copy", onClick: handleCopy, shortcut: "Ctrl+C"},
            {label: "Paste", onClick: handlePaste, shortcut: "Ctrl+V", disabled: clipboard.length === 0},
            {label: "Duplicate", onClick: handleDuplicate, shortcut: "Ctrl+D"},
            ...(selectedIds.length > 1 ? [{label: "Group", onClick: handleGroup, shortcut: "Ctrl+G"}] : []),
            ...(selectedIds.some(id => shapes.find(s => s.id === id)?.groupId) ? [{label: "Ungroup", onClick: handleUngroup, shortcut: "Ctrl+Shift+G"}] : []),
            {label: "Select All", onClick: selectAll, shortcut: "Ctrl+A"},
            {label: "Delete", onClick: handleDelete, shortcut: "Del"},
            {label: "Bring to Front", onClick: () => bringToFront(selectedIds)},
            {label: "Send to Back", onClick: () => sendToBack(selectedIds)}
        ];
    }

    const code = useDiagramStore(s => s.code);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {selectedIds.length === 1 && getShapeById(selectedIds[0])?.type === "text" && (
                <TextToolbar
                    shape={getShapeById(selectedIds[0])! as any}
                    updateShape={updateShape}
                />
            )}
            <ContextMenu>
                <ContextMenuTrigger className="block w-full h-full">

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
                    <canvas
                        ref={canvasRef}
                        // width={1000}
                        // height={1000}
                        className="w-full h-full"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onDoubleClick={onDoubleClick}
                        // style={{cursor: tools[activeTool]?.cursor}}
                        onWheel={(e) => zoom(e.deltaY, canvasRef.current!)}
                        style={{
                            cursor: tools[activeTool]?.cursor,
                            touchAction: "none",
                            userSelect: "none"
                        }}
                    />
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
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
                        <h2 className="text-2xl font-bold text-white/50 mb-2">Start building your diagram...</h2>
                        <p className="text-white/20 text-sm">Use shapes or write LayerScript to begin</p>
                    </div>
                </div>
            )}
        </div>
    );
})

export default Whiteboard;
