import {useRef, } from "react"
import type {Point, Shape} from "../types/types"

export function useRectangleDraw (
    currentShape:Shape | null,
    setCurrentShape: (shape: Shape | null) => void,
    addShape: (shape: Shape) => void
) {

    const isDrawingRef = useRef(false)
    const rectRef = useRef<string | null>(null)
    const startPointRef = useRef<Point>({x: 0, y: 0})

    function startDraw (p: Point) {
        isDrawingRef.current = true
        startPointRef.current = p

        const id = crypto.randomUUID()

        setCurrentShape({
            id,
            type: "rectangle",
            x: p.x,
            y: p.y,
            width: 0,
            height: 0
        })
    }

    function draw (p: Point) {
        if(!isDrawingRef.current || !currentShape) return
        if(currentShape.type !== "rectangle") return

        const start = startPointRef.current

        setCurrentShape({
            ...currentShape,
            type: "rectangle",
            x: start.x,
            y: start.y,
            width: p.x - start.x,
            height: p.y - start.y
        })
    }

    function endDraw () {
        if(!currentShape || currentShape.type !== "rectangle") return

        let finalShape = currentShape;
        
        // Feature 2: Click to Create Default Shape
        if(Math.abs(currentShape.width) < 5 && Math.abs(currentShape.height) < 5) {
            finalShape = {
                ...currentShape,
                width: 120,
                height: 80
            };
        }

        addShape(finalShape)

        const created = finalShape;

        setCurrentShape(null)
        rectRef.current = null
        isDrawingRef.current = false

        return created
    }

    return {
        
        startDraw,
        draw,
        endDraw,
        isDrawingRef
    }
}