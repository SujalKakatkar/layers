import type {HandleType, Point} from "../types/types";



export function getHandleAtPoint (
    p: Point,
    bounds: {x: number; y: number; width: number; height: number}
): HandleType | null {
    const size = 8;
    const half = size / 2;

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const handles: Record<HandleType, {x: number; y: number}> = {
        nw: {x: bounds.x, y: bounds.y},
        ne: {x: bounds.x + bounds.width, y: bounds.y},
        sw: {x: bounds.x, y: bounds.y + bounds.height},
        se: {x: bounds.x + bounds.width, y: bounds.y + bounds.height},

        n: {x: centerX, y: bounds.y},
        s: {x: centerX, y: bounds.y + bounds.height},
        w: {x: bounds.x, y: centerY},
        e: {x: bounds.x + bounds.width, y: centerY},
    };

    for(const key in handles) {
        const h = handles[key as HandleType];

        if(
            p.x >= h.x - half &&
            p.x <= h.x + half &&
            p.y >= h.y - half &&
            p.y <= h.y + half
        ) {
            return key as HandleType;
        }
    }

    return null;
}