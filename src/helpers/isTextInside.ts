import type {SelectionArea, Text} from "../types/types";

export function isTextInside (
    sel: NonNullable<SelectionArea>,
    t: Text
) {
    const left = t.x;
    const right = t.x + t.width;
    const top = t.y;
    const bottom = t.y + t.height;

    
    return (
        left >= sel.x &&
        top >= sel.y &&
        right <= sel.x + sel.width &&
        bottom <= sel.y + sel.height
    );
}