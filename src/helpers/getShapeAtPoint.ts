import type {Shape} from "../types/types"
import {getStrokeBounds} from "../utils/getStrokeBounds"

export function getShapeAtPoint (
    x: number,
    y: number,
    shapes: Shape[]
): string | null {

    for(let i = shapes.length - 1;i >= 0;i--) {
        const shape = shapes[i]

        const rotation = (shape as any).rotation || 0;
        let tx = x;
        let ty = y;

        if (rotation) {
            let cx = 0, cy = 0;
            if (shape.type === "rectangle" || shape.type === "text") {
                cx = shape.x + shape.width / 2;
                cy = shape.y + shape.height / 2;
            } else if (shape.type === "circle") {
                cx = shape.cx;
                cy = shape.cy;
            }

            if (cx || cy) {
                const dx = x - cx;
                const dy = y - cy;
                const cosA = Math.cos(-rotation);
                const sinA = Math.sin(-rotation);
                tx = cx + dx * cosA - dy * sinA;
                ty = cy + dx * sinA + dy * cosA;
            }
        }

        switch(shape.type) {
            case "rectangle":
                if(
                    tx >= shape.x &&
                    tx <= shape.x + shape.width &&
                    ty >= shape.y &&
                    ty <= shape.y + shape.height
                ) {
                    return shape.id
                }
                break

            case "circle":
                const ddx = tx - shape.cx
                const ddy = ty - shape.cy
                if(ddx * ddx + ddy * ddy <= shape.r * shape.r) {
                    return shape.id
                }
                break

            case "stroke":
                // For stroke, we still use bounds for now as point-in-path is more complex
                const b = getStrokeBounds(shape)
                if(
                    tx >= b.x &&
                    tx <= b.x + b.width &&
                    ty >= b.y &&
                    ty <= b.y + b.height
                ) {
                    return shape.id
                }
                break
            case "text":
                if(
                    tx >= shape.x &&
                    tx <= shape.x + shape.width &&
                    ty >= shape.y &&
                    ty <= shape.y + shape.height
                ) {
                    return shape.id
                }
                break
        }
    }

    return null
}