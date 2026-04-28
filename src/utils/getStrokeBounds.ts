import type {Stroke} from "../types/types"

export function getStrokeBounds(stroke: Stroke) {
    if (!stroke.rotation) {
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        stroke.points.forEach(p => {
            minX = Math.min(minX, p.x)
            minY = Math.min(minY, p.y)
            maxX = Math.max(maxX, p.x)
            maxY = Math.max(maxY, p.y)
        })

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        }
    }

    // Step 1: Find center of stroke
    let sumX = 0;
    let sumY = 0;
    for (const p of stroke.points) {
        sumX += p.x;
        sumY += p.y;
    }
    const cx = sumX / stroke.points.length;
    const cy = sumY / stroke.points.length;

    // Step 2: Inverse rotate each point by -angle to find the "unrotated" shape
    const angle = -stroke.rotation;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    stroke.points.forEach(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const rx = cx + dx * cosA - dy * sinA;
        const ry = cy + dx * sinA + dy * cosA;

        minX = Math.min(minX, rx);
        minY = Math.min(minY, ry);
        maxX = Math.max(maxX, rx);
        maxY = Math.max(maxY, ry);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: stroke.rotation
    };
}
