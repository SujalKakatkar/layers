import {useRef} from "react"
import type {Stroke, Point, Shape} from "../types/types"

export function usePenDraw (
    currentShape: Shape | null,
    setCurrentShape: (shape: Shape | null) => void,
    addShape: (shape: Shape) => void

) {

    const isPenDrawingRef = useRef(false)

    const startPenDraw = (point: Point) => {
        isPenDrawingRef.current = true

        const newStroke: Stroke = {
            id: crypto.randomUUID(),
            type: "stroke",
            points: [point],
            color: "white",
            width: 2
        }

        setCurrentShape(newStroke)
    }

    const penDraw = (point: Point) => {
        if(!isPenDrawingRef.current || !currentShape) return
        if(currentShape.type !== "stroke") return

        setCurrentShape({
            ...currentShape,
            points: [...currentShape.points, point]
        })
    }

    const endPenDraw = () => {
        if(!isPenDrawingRef.current || !currentShape) return

        addShape(currentShape)
        const created = currentShape;
        setCurrentShape(null)
        isPenDrawingRef.current = false

        return created
    }

    return {
        startPenDraw,
        penDraw,
        endPenDraw,
        isPenDrawingRef
    }
}
