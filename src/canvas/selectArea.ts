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
        let b = { x: 0, y: 0, width: 0, height: 0 };
        
        switch(shape.type) {
            case "rectangle":
                b = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
                break;
            case "circle":
                b = { x: shape.cx - shape.r, y: shape.cy - shape.r, width: shape.r * 2, height: shape.r * 2 };
                break;
            case "stroke":
                b = getStrokeBounds(shape);
                break;
            case "text":
                b = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
                break;
        }

        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;

        const corners = [
            { x: b.x, y: b.y },
            { x: b.x + b.width, y: b.y },
            { x: b.x + b.width, y: b.y + b.height },
            { x: b.x, y: b.y + b.height },
        ];

        const rotation = (shape as any).rotation || 0;
        const cosA = Math.cos(rotation);
        const sinA = Math.sin(rotation);

        corners.forEach(p => {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const rotatedX = cx + dx * cosA - dy * sinA;
            const rotatedY = cy + dx * sinA + dy * cosA;

            minX = Math.min(minX, rotatedX);
            minY = Math.min(minY, rotatedY);
            maxX = Math.max(maxX, rotatedX);
            maxY = Math.max(maxY, rotatedY);
        });
    })

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
