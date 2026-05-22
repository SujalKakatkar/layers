import type { Shape } from "../types/types";

export function hitTestElement(el: Shape, p: { x: number; y: number }): boolean {
    if (el.type === "circle") {
        const dx = p.x - el.cx;
        const dy = p.y - el.cy;
        return Math.sqrt(dx * dx + dy * dy) <= el.r;
    }
    if (el.type === "rectangle" || el.type === "text") {
        return p.x >= el.x && p.x <= el.x + el.width && p.y >= el.y && p.y <= el.y + el.height;
    }
    return false;
}

export function computeGroupBounds(
    componentId: string | null,
    elements: Shape[]
): { x: number; y: number; width: number; height: number } | null {
    if (!componentId) return null;
    const componentElements = elements.filter((el) => (el.componentId || "default") === componentId);
    if (componentElements.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    componentElements.forEach((el) => {
        let x: number, y: number, w: number, h: number;
        if (el.type === "circle") {
            x = el.cx - el.r; y = el.cy - el.r; w = el.r * 2; h = el.r * 2;
        } else if (el.type === "rectangle" || el.type === "text") {
            x = el.x; y = el.y; w = el.width; h = el.height;
        } else {
            return;
        }
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
