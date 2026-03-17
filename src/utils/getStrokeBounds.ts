import type {Stroke} from "../types/types"

export function getStrokeBounds (stroke: Stroke) {
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

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    }
}
