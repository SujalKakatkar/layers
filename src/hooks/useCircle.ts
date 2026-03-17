import {useRef} from "react";
import type {Point, Shape} from "../types/types";

export function useCircleDraw (
    currentShape: Shape | null,
    setCurrentShape: (shape: Shape | null) => void,
    addShape: (shape: Shape) => void
) {

    const isDrawingRef = useRef(false);
    const startPointRef = useRef<Point>({x: 0, y: 0});

    function startDraw (p: Point) {
        isDrawingRef.current = true;
        startPointRef.current = p;
        const id = crypto.randomUUID()
        setCurrentShape({
            id,
            type: "circle",
            cx: p.x,
            cy: p.y,
            r: 0,
        });
    }

    function draw (p: Point) {
        if(!isDrawingRef.current || !currentShape) return;
        if(currentShape.type !== "circle") return

        const start = startPointRef.current;

        const dx = p.x - start.x;
        const dy = p.y - start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        setCurrentShape({
            ...currentShape,
            cx: start.x,
            cy: start.y,
            r: radius,
        });
    }

    function endDraw () {
        if(!currentShape) return;

        //add the circle into global shape array
        addShape(currentShape)
        const created = currentShape

        setCurrentShape(null);
        isDrawingRef.current = false;
        return created

    }

    return {
        startDraw,
        draw,
        endDraw,
        isDrawingRef,
    };
}
