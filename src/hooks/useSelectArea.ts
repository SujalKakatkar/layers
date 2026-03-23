import React, {useRef, useState} from "react";
import type {HandleType, Point, SelectionArea, Shape} from "../types/types";
import {getWorldPoint} from "../canvas/transform";
import {isRectInside} from "../helpers/Rectinside";
import {isCircleInside} from "../helpers/circleinside";
import {isStrokeInside} from "../helpers/strokeinside";
import {getSelectionBounds} from "../canvas/selectArea";
import {getShapeAtPoint} from "../helpers/getShapeAtPoint";
import {getHandleAtPoint} from "../helpers/getHandleAtPoint";
import {isTextInside} from "../helpers/isTextInside";

export function useSelectArea (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    scale: number,
    offset: {x: number; y: number},
    shapes: Shape[],
    moveShapes: (
        ids: string[],
        dx: number,
        dy: number,
    ) => void,
    selectedIds: string[],
    onSelect: (ids: string[]) => void,
    resizeShapes: (ids: string[], handle: HandleType, dx: number, dy: number, initialMap: Map<string, Shape>) => void,
    spacePressedRef: React.RefObject<boolean>,
    justFinishedRef: React.RefObject<boolean>,
    updateShapes: (updater: (prevShapes: Shape[]) => Shape[]) => void
) {
    const isDraggingRef = useRef(false);

    const startRef = useRef<Point | null>(null);
    const areaRef = useRef<SelectionArea>(null);
    const initialShapesRef = useRef<Map<string, Shape>>(new Map());
    const hasSavedMoveHistoryRef = useRef(false);

    //movestartref is used to store the starting of the shape before moving it to another location
    const moveStartRef = useRef<Point | null>(null);

    //clickedselectionref used to mantain a state to check if use clicked inside selection area
    const clickedSelectedRef = useRef(false);
    //hasmovedRef is used to check if mouse clicked or draged
    const hasMovedRef = useRef(false);

    const [selectArea, setSelectArea] = useState<SelectionArea>(null);

    const resizeHandleRef = useRef<HandleType | null>(null)

    //clearing all the things once the mouse intraction is finished
    function clearInteraction () {
        isDraggingRef.current = false
        hasMovedRef.current = false
        clickedSelectedRef.current = false
        startRef.current = null
        moveStartRef.current = null
        areaRef.current = null
        resizeHandleRef.current = null
        setSelectArea(null)
    }



    function startSelect (p: Point) {
        isDraggingRef.current = true;

        if(selectedIds.length > 0) {
            const bounds = getSelectionBounds(shapes, selectedIds);
            if(bounds) {
                const handle = getHandleAtPoint(p, bounds);
                if(handle) {
                    resizeHandleRef.current = handle;
                    moveStartRef.current = p;

                    // 🔥 STORE ORIGINAL SHAPES HERE
                    const map = new Map<string, Shape>();
                    selectedIds.forEach(id => {
                        const s = shapes.find(s => s.id === id);
                        if(s) map.set(id, structuredClone(s));
                    });
                    initialShapesRef.current = map;

                    return;
                }
            }
        }


        const hitId = getShapeAtPoint(p.x, p.y, shapes);
        if(hitId) {
            clickedSelectedRef.current = true

            if(!selectedIds.includes(hitId)) {
                onSelect([hitId])
            }

            moveStartRef.current = p;

            hasSavedMoveHistoryRef.current = false

            return
        }

        startRef.current = p;

        setSelectArea({
            x: p.x,
            y: p.y,
            width: 0,
            height: 0,
        });
    }

    function updateCursor (p: Point) {

        const canvas = canvasRef.current;
        if(!canvas) return;


        if(spacePressedRef.current) return;

        if(selectedIds.length === 0) {
            canvas.style.cursor = "default";
            return;
        }

        const bounds = getSelectionBounds(shapes, selectedIds);
        if(!bounds) return;

        const handle = getHandleAtPoint(p, bounds);

        switch(handle) {
            case "nw":
            case "se":
                canvas.style.cursor = "nwse-resize";
                return;

            case "ne":
            case "sw":
                canvas.style.cursor = "nesw-resize";
                return;

            case "n":
            case "s":
                canvas.style.cursor = "ns-resize";
                return;

            case "e":
            case "w":
                canvas.style.cursor = "ew-resize";
                return;
        }

        canvas.style.cursor = "default";
    }

    function onPointerMove (e: React.PointerEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current;
        if(!canvas) return;

        const curr = getWorldPoint(e, canvas, scale, offset);

        if(!isDraggingRef.current) {
            updateCursor(curr);
        }

        // 🔹 Resize logic
        if(resizeHandleRef.current && moveStartRef.current) {
            const start = moveStartRef.current;
            const dx = curr.x - start.x;
            const dy = curr.y - start.y;

            resizeShapes(selectedIds, resizeHandleRef.current, dx, dy, initialShapesRef.current);

            return;
        }

        if(clickedSelectedRef.current && moveStartRef.current) {
            const prev = moveStartRef.current;
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;

            if(Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                hasMovedRef.current = true;

                if(!hasSavedMoveHistoryRef.current) {
                    updateShapes(prev => structuredClone(prev)); // 🔥 KEY FIX
                    hasSavedMoveHistoryRef.current = true;
                }


                moveShapes(selectedIds, dx, dy);
                moveStartRef.current = curr;
            }

            return;
        }

        if(!startRef.current || !isDraggingRef.current) return;

        const start = startRef.current;
        const dx = Math.abs(curr.x - start.x);
        const dy = Math.abs(curr.y - start.y);

        if(dx > 2 || dy > 2) {
            hasMovedRef.current = true;
        }

        const area = {
            x: Math.min(start.x, curr.x),
            y: Math.min(start.y, curr.y),
            width: dx,
            height: dy,
        };

        areaRef.current = area;
        setSelectArea(area);
    }

    function onPointerUp () {
        const canvas = canvasRef.current;
        if(!canvas) return;

        const wasDragging = hasMovedRef.current;
        const clickedSelected = clickedSelectedRef.current;


        //drag selection
        if(wasDragging && areaRef.current) {
            const area = areaRef.current;

            const ids = shapes
                .filter(shape => {
                    switch(shape.type) {
                        case "rectangle":
                            return isRectInside(area, shape);
                        case "circle":
                            return isCircleInside(area, shape);
                        case "stroke":
                            return isStrokeInside(area, shape);
                        case "text": return isTextInside(area, shape)
                        default:
                            return false;
                    }
                })
                .map(shape => shape.id);

            onSelect(ids);
        }
        //single click selection and text editing open
        else if(!clickedSelected && !justFinishedRef.current) {
            onSelect([]);
        }


        if(justFinishedRef.current) {
            justFinishedRef.current = false
        }
        clearInteraction()
    }

    return {
        selectArea,
        startSelect,
        onPointerMove,
        onPointerUp,
        resetSelection: clearInteraction,
    };
}
