import type {Bounds, Shape} from "../types/types";
import {getStrokeBounds} from "../utils/getStrokeBounds";



export function getSelectionBounds (
    shapes: Shape[],
    selectedIds: string[]
): Bounds | null {
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id))


    if(selectedShapes.length === 0) {
        return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedShapes.forEach(shape => {
        switch(shape.type) {

            case "rectangle":
                minX = Math.min(minX, shape.x)
                minY = Math.min(minY, shape.y)
                maxX = Math.max(maxX, shape.x + shape.width)
                maxY = Math.max(maxY, shape.y + shape.height)
                break

            case "circle":
                minX = Math.min(minX, shape.cx - shape.r)
                minY = Math.min(minY, shape.cy - shape.r)
                maxX = Math.max(maxX, shape.cx + shape.r)
                maxY = Math.max(maxY, shape.cy + shape.r)
                break

            case "stroke":
                const b = getStrokeBounds(shape)
                minX = Math.min(minX, b.x)
                minY = Math.min(minY, b.y)
                maxX = Math.max(maxX, b.x + b.width)
                maxY = Math.max(maxY, b.y + b.height)
                break
            case "text":

                minX = Math.min(minX, shape.x);
                minY = Math.min(minY, shape.y);
                maxX = Math.max(maxX, shape.x + shape.width);
                maxY = Math.max(maxY, shape.y + shape.height);
                break;
        }
    })

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
