import type {Shape} from "../types/types"
import {getStrokeBounds} from "../utils/getStrokeBounds"

export function getShapeAtPoint (
    x: number,
    y: number,
    shapes: Shape[]
): string | null {

    for(let i = shapes.length - 1;i >= 0;i--) {
        const shape = shapes[i]

        switch(shape.type) {
            case "rectangle":
                if(
                    x >= shape.x &&
                    x <= shape.x + shape.width &&
                    y >= shape.y &&
                    y <= shape.y + shape.height
                ) {
                    return shape.id
                }
                break

            case "circle":
                const dx = x - shape.cx
                const dy = y - shape.cy
                if(dx * dx + dy * dy <= shape.r * shape.r) {
                    return shape.id
                }
                break

            case "stroke":
                const b = getStrokeBounds(shape)
                if(
                    x >= b.x &&
                    x <= b.x + b.width &&
                    y >= b.y &&
                    y <= b.y + b.height
                ) {
                    return shape.id
                }
                break
            case "text":
                if(
                    x >= shape.x &&
                    x <= shape.x + shape.width &&
                    y >= shape.y &&
                    y <= shape.y + shape.height
                ) {
                    return shape.id
                }
                break
        }
    }

    return null
}