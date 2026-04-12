import type {HandleType, Point} from "../types/types";



export function getHandleAtPoint (
    p: Point,
    bounds: {x: number; y: number; width: number; height: number},
    pad = 10
): HandleType | null {
    const size = 8;
    const half = size / 2;

    // Use the same padded box that drawScene draws
    const bx = bounds.x - pad;
    const by = bounds.y - pad;
    const bw = bounds.width + pad * 2;
    const bh = bounds.height + pad * 2;

    const cx = bx + bw / 2;
    const cy = by + bh / 2;

    const handles: Partial<Record<HandleType, {x: number; y: number}>> = {
        nw: {x: bx,      y: by},
        ne: {x: bx + bw, y: by},
        se: {x: bx + bw, y: by + bh},
        sw: {x: bx,      y: by + bh},
    };

    for(const key in handles) {
        const handlePos = handles[key as HandleType];
        
        if (!handlePos) continue;

        if(
            p.x >= handlePos.x - half &&
            p.x <= handlePos.x + half &&
            p.y >= handlePos.y - half &&
            p.y <= handlePos.y + half
        ) {
            return key as HandleType;
        }
    }

    return null;
}