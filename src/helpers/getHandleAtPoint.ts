import type {HandleType, Point} from "../types/types";



export function getHandleAtPoint (
    p: Point,
    bounds: {x: number; y: number; width: number; height: number; rotation?: number},
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

    const angle = bounds.rotation || 0;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const getRotated = (x: number, y: number) => {
        const dx = x - cx;
        const dy = y - cy;
        return {
            x: cx + dx * cosA - dy * sinA,
            y: cy + dx * sinA + dy * cosA
        };
    };

    const handles: Partial<Record<HandleType, {x: number; y: number}>> = {
        nw: getRotated(bx, by),
        ne: getRotated(bx + bw, by),
        se: getRotated(bx + bw, by + bh),
        sw: getRotated(bx, by + bh),
    };

    const HANDLE_SIZE = 8;
    const ROTATE_OFFSET = 12;

    // Check for resize handles FIRST (Priority 1)
    for(const key in handles) {
        const handlePos = handles[key as HandleType];
        if(!handlePos) continue;

        if(
            p.x >= handlePos.x - half &&
            p.x <= handlePos.x + half &&
            p.y >= handlePos.y - half &&
            p.y <= handlePos.y + half
        ) {
            return key as HandleType;
        }
    }

    // Inverse rotate point to check if it's strictly outside the bounding box
    const pdx = p.x - cx;
    const pdy = p.y - cy;
    const rx = cx + pdx * Math.cos(-angle) - pdy * Math.sin(-angle);
    const ry = cy + pdx * Math.sin(-angle) + pdy * Math.cos(-angle);
    const isInsideBounds = rx >= bx && rx <= bx + bw && ry >= by && ry <= by + bh;

    // Check for rotation zones (Priority 2)
    for(const key in handles) {
        const handlePos = handles[key as HandleType];
        if(!handlePos) continue;

        const dist = Math.hypot(p.x - handlePos.x, p.y - handlePos.y);
        
        // Must be outside the shape and within the rotate offset radius
        if(dist > HANDLE_SIZE && dist <= HANDLE_SIZE + ROTATE_OFFSET && !isInsideBounds) {
            if (key === "nw") return "rotate-tl";
            if (key === "ne") return "rotate-tr";
            if (key === "se") return "rotate-br";
            if (key === "sw") return "rotate-bl";
        }
    }

    return null;
}
