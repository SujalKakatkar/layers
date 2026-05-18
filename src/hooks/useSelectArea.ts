import React, {useRef, useState} from "react";
import type {HandleType, Point, SelectionArea, Shape, Guide} from "../types/types";
import {getWorldPoint} from "../canvas/transform";
import {isRectInside} from "../helpers/Rectinside";
import {isCircleInside} from "../helpers/circleinside";
import {isStrokeInside} from "../helpers/strokeinside";
import {getSelectionBounds} from "../canvas/selectArea";
import {getShapeAtPoint} from "../helpers/getShapeAtPoint";
import {getHandleAtPoint} from "../helpers/getHandleAtPoint";
import {isTextInside} from "../helpers/isTextInside";

function getRotationCursor(handle: string) {
    if (typeof document === "undefined") return "auto";
    const isDark = document.documentElement.classList.contains("dark");
    const color = isDark ? "white" : "black";
    const shadowColor = isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)";
    
    let angle = 0;
    if (handle === "rotate-tr") angle = 90;
    else if (handle === "rotate-br") angle = 180;
    else if (handle === "rotate-bl") angle = 270;
    
    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>
  <g transform='rotate(${angle} 12 12)'>
    <path d='M19 12a7 7 0 1 1-7-7c2.0 0 3.8 0.8 5.2 2.2L19 9' stroke='${shadowColor}' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/>
    <polyline points='19 4 19 9 14 9' stroke='${shadowColor}' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/>
    <path d='M19 12a7 7 0 1 1-7-7c2.0 0 3.8 0.8 5.2 2.2L19 9' stroke='${color}' stroke-width='2.0' stroke-linecap='round' stroke-linejoin='round'/>
    <polyline points='19 4 19 9 14 9' stroke='${color}' stroke-width='2.0' stroke-linecap='round' stroke-linejoin='round'/>
  </g>
</svg>
`.trim().replace(/\s+/g, ' ');

    return `url('data:image/svg+xml;base64,${btoa(svg)}') 12 12, auto`;
}

export function useSelectArea (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    scale: number,
    offset: {x: number; y: number},
    shapes: Shape[],
    moveShapes: (
        ids: string[],
        dx: number,
        dy: number,
        options?: {skipHistory?: boolean}
    ) => void,
    selectedIds: string[],
    onSelect: (ids: string[]) => void,
    resizeShapes: (ids: string[], handle: HandleType, dx: number, dy: number, initialMap: Map<string, Shape>, options?: {skipHistory?: boolean}) => void,
    rotateShapes: (ids: string[], angleDelta: number, cx: number, cy: number, initialMap: Map<string, Shape>, options?: {skipHistory?: boolean}) => void,
    spacePressedRef: React.RefObject<boolean>,
    justFinishedRef: React.RefObject<boolean>,
    updateShapes: (updater: (prevShapes: Shape[]) => Shape[]) => void,
    duplicateShapes: (ids: string[], options?: {offset?: number; skipHistory?: boolean}) => string[]
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

    // Track total accumulated snapped delta to compute incremental dx/dy for moveShapes
    const lastSnappedDxRef = useRef(0);
    const lastSnappedDyRef = useRef(0);

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
        lastSnappedDxRef.current = 0;
        lastSnappedDyRef.current = 0;
        setGuides([])
        setSelectArea(null)
    }

    const [guides, setGuides] = useState<Guide[]>([]);



    function startSelect (p: Point, isAltKey: boolean = false) {
        isDraggingRef.current = true;

        if(selectedIds.length > 0) {
            const bounds = getSelectionBounds(shapes, selectedIds);
            if(bounds) {
                const handle = getHandleAtPoint(p, bounds);
                const isTextOnly = selectedIds.length === 1 && shapes.find(s => s.id === selectedIds[0])?.type === "text";

                if(handle && !isTextOnly) {
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

                const angle = bounds.rotation || 0;
                const cx = bounds.x + bounds.width / 2;
                const cy = bounds.y + bounds.height / 2;
                const dx = p.x - cx;
                const dy = p.y - cy;
                const cosA = Math.cos(-angle);
                const sinA = Math.sin(-angle);
                const rx = cx + dx * cosA - dy * sinA;
                const ry = cy + dx * sinA + dy * cosA;

                // If clicked inside the bounding box completely, drag the whole group
                if(
                    rx >= bounds.x &&
                    rx <= bounds.x + bounds.width &&
                    ry >= bounds.y &&
                    ry <= bounds.y + bounds.height
                ) {
                    if(isAltKey) {
                        const newIds = duplicateShapes(selectedIds, {offset: 0, skipHistory: false});
                        onSelect(newIds);
                    }
                    clickedSelectedRef.current = true;
                    moveStartRef.current = p;
                    hasSavedMoveHistoryRef.current = isAltKey;

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

            let idsToMove = selectedIds;
            if(!selectedIds.includes(hitId)) {
                onSelect([hitId])
                idsToMove = [hitId];
            }

            if(isAltKey) {
                const newIds = duplicateShapes(idsToMove, {offset: 0, skipHistory: false});
                onSelect(newIds);
            }

            moveStartRef.current = p;
            hasSavedMoveHistoryRef.current = isAltKey;

            const map = new Map<string, Shape>();
            idsToMove.forEach(id => {
                const s = shapes.find(s => s.id === id);
                if(s) map.set(id, structuredClone(s));
            });
            initialShapesRef.current = map;

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

        const isTextOnly = selectedIds.length === 1 && shapes.find(s => s.id === selectedIds[0])?.type === "text";

        const handle = getHandleAtPoint(p, bounds);

        if(handle && !isTextOnly) {
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

                case "rotate":
                case "rotate-tl":
                case "rotate-tr":
                case "rotate-bl":
                case "rotate-br":
                    canvas.style.cursor = getRotationCursor(handle);
                    return;
            }
        }

        const angle = bounds.rotation || 0;
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const cosA = Math.cos(-angle);
        const sinA = Math.sin(-angle);
        const rx = cx + dx * cosA - dy * sinA;
        const ry = cy + dx * sinA + dy * cosA;

        // Inside bounding box -> Move cursor
        if(
            rx >= bounds.x &&
            rx <= bounds.x + bounds.width &&
            ry >= bounds.y &&
            ry <= bounds.y + bounds.height
        ) {
            canvas.style.cursor = "move";
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

            // 🔥 Snap current past history before resize so undo reverts accurately!
            if(!hasSavedMoveHistoryRef.current) {
                updateShapes(prev => structuredClone(prev)); // Pushes an exact copy as current block
                hasSavedMoveHistoryRef.current = true;
            }

            if(resizeHandleRef.current.startsWith("rotate")) {
                canvas.style.cursor = getRotationCursor(resizeHandleRef.current);
                const initialBounds = getSelectionBounds(Array.from(initialShapesRef.current.values()), selectedIds);
                if(initialBounds) {
                    const cx = initialBounds.x + initialBounds.width / 2;
                    const cy = initialBounds.y + initialBounds.height / 2;

                    const startAngle = Math.atan2(start.y - cy, start.x - cx);
                    const currAngle = Math.atan2(curr.y - cy, curr.x - cx);
                    const angleDelta = currAngle - startAngle;

                    rotateShapes(selectedIds, angleDelta, cx, cy, initialShapesRef.current, {skipHistory: true});
                }
            } else {
                resizeShapes(selectedIds, resizeHandleRef.current, dx, dy, initialShapesRef.current, {skipHistory: true});
            }

            return;
        }

        if(clickedSelectedRef.current && moveStartRef.current) {
            const start = moveStartRef.current;
            const rawTotalDx = curr.x - start.x;
            const rawTotalDy = curr.y - start.y;

            if(Math.abs(rawTotalDx) > 2 || Math.abs(rawTotalDy) > 2) {
                hasMovedRef.current = true;

                if(!hasSavedMoveHistoryRef.current) {
                    updateShapes(prev => structuredClone(prev)); // 🔥 KEY FIX
                    hasSavedMoveHistoryRef.current = true;
                }

                const initialBounds = getSelectionBounds(Array.from(initialShapesRef.current.values()), selectedIds);
                let snappedTotalDx = rawTotalDx;
                let snappedTotalDy = rawTotalDy;
                const activeGuides: Guide[] = [];

                if(initialBounds) {
                    const movingCenterX = initialBounds.x + rawTotalDx + initialBounds.width / 2;
                    const movingCenterY = initialBounds.y + rawTotalDy + initialBounds.height / 2;
                    const SNAP_THRESHOLD = 5;

                    let minDiffX = Infinity;
                    let minDiffY = Infinity;

                    shapes.forEach(shape => {
                        if(selectedIds.includes(shape.id)) return;

                        const otherBounds = getSelectionBounds([shape], [shape.id]);
                        if(!otherBounds) return;

                        const otherCenterX = otherBounds.x + otherBounds.width / 2;
                        const otherCenterY = otherBounds.y + otherBounds.height / 2;

                        const diffX = Math.abs(movingCenterX - otherCenterX);
                        const diffY = Math.abs(movingCenterY - otherCenterY);

                        if(diffX < SNAP_THRESHOLD && diffX < minDiffX) {
                            minDiffX = diffX;
                            snappedTotalDx = otherCenterX - initialBounds.x - initialBounds.width / 2;
                        }

                        if(diffY < SNAP_THRESHOLD && diffY < minDiffY) {
                            minDiffY = diffY;
                            snappedTotalDy = otherCenterY - initialBounds.y - initialBounds.height / 2;
                        }
                    });

                    if(minDiffX < SNAP_THRESHOLD) {
                        activeGuides.push({type: "vertical", position: initialBounds.x + snappedTotalDx + initialBounds.width / 2});
                    }
                    if(minDiffY < SNAP_THRESHOLD) {
                        activeGuides.push({type: "horizontal", position: initialBounds.y + snappedTotalDy + initialBounds.height / 2});
                    }
                }

                setGuides(activeGuides);

                const incrementalDx = snappedTotalDx - lastSnappedDxRef.current;
                const incrementalDy = snappedTotalDy - lastSnappedDyRef.current;

                if(incrementalDx !== 0 || incrementalDy !== 0) {
                    moveShapes(selectedIds, incrementalDx, incrementalDy, {skipHistory: true});
                    lastSnappedDxRef.current = snappedTotalDx;
                    lastSnappedDyRef.current = snappedTotalDy;
                }
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
        guides,
    };
}
