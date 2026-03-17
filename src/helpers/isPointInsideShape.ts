import type {Bounds} from "../types/types";

export function isPointInsideSelectionRect (
    x: number,
    y: number,
    sel: Bounds
) {
    return (
        x >= sel.x &&
        y >= sel.y &&
        x <= sel.x + sel.width &&
        y <= sel.y + sel.height
    );
}
