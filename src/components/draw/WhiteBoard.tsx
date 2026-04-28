import React, {useCallback, useEffect, useRef, useState} from "react";
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
import type {CanvasTool, HistoryActions, Tools} from "../../types/types";
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

export default function Whiteboard () {
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

    //shapes
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
        removeConnector
    } = useShapes(canvasId)

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
        setGeneratedConnectors
    } = useDiagramStore();

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

    const allElements = [...generatedElements, ...shapes];

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

            // Check if we hit a connector dot first
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

            if(activeTool === "select") {
                onConnectorPointerMove(p, allElements);
            }

            updateSelect(e);
        },
        onPointerUp: (e) => {
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

        const allElements = [...generatedElements, ...shapes];
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
    }, [currentShape, shapes, scale, offset, selectArea, selectedIds, editingText, guides, connectors, connectionState, connectorDotShapeId, ghostPreview, selectedConnectorId, generatedElements, generatedConnectors]);




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
        </div>
    );
}
