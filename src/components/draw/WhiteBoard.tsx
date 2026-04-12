import React, {useCallback, useEffect, useRef, useState} from "react";
import {useOutletContext} from "react-router";
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
import {useText} from "../../hooks/useText";
import {useKeyboard} from "../../hooks/useKeyboard";

type OutletContextType = {
    tool: Tools;
    setTool: (tool: Tools) => void,
    setUndoRedo: React.Dispatch<React.SetStateAction<HistoryActions>>
};


export default function Whiteboard () {
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const textRef = useRef<HTMLDivElement | null>(null)
    const justFinishedRef = useRef<boolean>(false);

    const {tool: activeTool, setTool, setUndoRedo} = useOutletContext<OutletContextType>();
    

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useCanvasResize(canvasRef);

    // Global hooks (always active)
    const {scale, offset, startPan, pan, endPan, zoom} = useCamera();
    const {pressedRef: spacePressedRef, pressed} = useSpaceKey();

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
        resizeShapes,
        getShapeById,
        undo,
        redo,
    } = useShapes()

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

    //Select tool hook
    const {
        selectArea,
        startSelect,
        onPointerMove: updateSelect,
        onPointerUp: endSelect,
        resetSelection
    } = useSelectArea(canvasRef, scale, offset, shapes, moveShapes, selectedIds, setSelectedIds, resizeShapes, spacePressedRef, justFinishedRef, updateShapes);

    // ── Phase 1: Keyboard Accessibility ─────────────────────────────────
    const clearSelection = useCallback(() => setSelectedIds([]), []);

    useKeyboard({
        selectedIds,
        isEditingText: editingText !== null,
        removeShapes,
        undo,
        redo,
        moveShapes,
        updateShapes,
        clearSelection,
        finishText,
    });





    useEffect(() => {
        if(activeTool != "select") {
            setSelectedIds([]);
            resetSelection();
        }
    }, [activeTool])

    // TOOL ADAPTERS
    const selectTool: CanvasTool = {
        onPointerDown: (e) => {
            const canvas = canvasRef.current;
            if(!canvas) return;

            const p = getWorldPoint(e, canvas, scale, offset);
            if(editingText) {
                const current = finishText()
                if(current) {
                    justFinishedRef.current = true;
                    setSelectedIds([current])
                }
                return
            }

            startSelect(p)
        },
        onPointerMove: updateSelect,
        onPointerUp: endSelect,
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
        drawScene(
            canvasRef.current,
            currentShape,
            shapes,
            scale,
            offset,
            selectArea,
            selectedIds,
            editingText,
        );
    }, [currentShape, shapes, scale, offset, selectArea, selectedIds, editingText]);




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

        const hitId = shapes
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

    return (
        <div className="relative w-full h-full overflow-hidden">

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
                        fontFamily: "sans-serif"
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
        </div>
    );
}
