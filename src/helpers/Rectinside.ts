import type {Rectangle, SelectionArea} from "../types/types";

export function isRectInside (
    sel: NonNullable<SelectionArea>,
    r: Rectangle
) {
    return (
        r.x >= sel.x &&
        r.y >= sel.y &&
        r.x + r.width <= sel.x + sel.width &&
        r.y + r.height <= sel.y + sel.height
    );
}
