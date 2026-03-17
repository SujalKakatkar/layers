import type {Point} from "../types/types";

export function getWorldPoint (
    e: React.MouseEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
    scale: number,
    offset: {x: number; y: number}
): Point {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale,
    };
}
