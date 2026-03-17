import type {Stroke, SelectionArea} from "../types/types"

export function isStrokeInside (
    sel: NonNullable<SelectionArea>,
    stroke: Stroke
) {
    if(stroke.points.length === 0) return false

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    stroke.points.forEach(p => {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
    })

    return (
        minX >= sel.x &&
        minY >= sel.y &&
        maxX <= sel.x + sel.width &&
        maxY <= sel.y + sel.height
    )
}
