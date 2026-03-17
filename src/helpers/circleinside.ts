import type {Circle, SelectionArea} from "../types/types";
export function isCircleInside (
    sel: NonNullable<SelectionArea>,
    c: Circle,
) {
    return (
        c.cx - c.r >= sel.x &&
        c.cy - c.r >= sel.y &&
        c.cx + c.r <= sel.x + sel.width &&
        c.cy + c.r <= sel.y + sel.height
    )
}