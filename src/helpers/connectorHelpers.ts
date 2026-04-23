import type { ConnectorSide, Point, Shape } from "../types/types";
import { getStrokeBounds } from "../utils/getStrokeBounds";

/** Axis-aligned bounding box for any shape */
export function getShapeBounds(shape: Shape): {
    x: number;
    y: number;
    width: number;
    height: number;
} {
    switch (shape.type) {
        case "rectangle":
            return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        case "circle":
            return { x: shape.cx - shape.r, y: shape.cy - shape.r, width: shape.r * 2, height: shape.r * 2 };
        case "stroke": {
            const b = getStrokeBounds(shape);
            return b;
        }
        case "text":
            return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    }
}

/** Returns the world-space anchor Point for a given side of a shape */
export function getShapeAnchorPoint(shape: Shape, side: ConnectorSide): Point {
    let px: number, py: number;
    let cx: number, cy: number;

    if (shape.type === "circle") {
        cx = shape.cx;
        cy = shape.cy;
        const r = shape.r;
        switch (side) {
            case "top":    px = cx;     py = cy - r; break;
            case "bottom": px = cx;     py = cy + r; break;
            case "left":   px = cx - r; py = cy;     break;
            case "right":  px = cx + r; py = cy;     break;
        }
    } else {
        const b = getShapeBounds(shape);
        cx = b.x + b.width / 2;
        cy = b.y + b.height / 2;
        switch (side) {
            case "top":    px = cx;           py = b.y;          break;
            case "bottom": px = cx;           py = b.y + b.height; break;
            case "left":   px = b.x;          py = cy;           break;
            case "right":  px = b.x + b.width; py = cy;           break;
        }
    }

    if (!shape.rotation) {
        return { x: px, y: py };
    }

    const cosA = Math.cos(shape.rotation);
    const sinA = Math.sin(shape.rotation);
    const dx = px - cx;
    const dy = py - cy;

    return {
        x: cx + dx * cosA - dy * sinA,
        y: cy + dx * sinA + dy * cosA
    };
}

/** Shorthand for getConnectionPoint (maintains backward compatibility if needed) */
export const getConnectionPoint = getShapeAnchorPoint;

/**
 * Given two shapes, return the closest side pair so the connector
 * always attaches to geometrically nearest anchors.
 */
export function getClosestSidePair(
    from: Shape,
    to: Shape
): { fromSide: ConnectorSide; toSide: ConnectorSide } {
    const fromSides: ConnectorSide[] = ["top", "right", "bottom", "left"];
    const toSides:   ConnectorSide[] = ["top", "right", "bottom", "left"];

    let best = Infinity;
    let fromSide: ConnectorSide = "right";
    let toSide:   ConnectorSide = "left";

    for (const fs of fromSides) {
        for (const ts of toSides) {
            const p1 = getShapeAnchorPoint(from, fs);
            const p2 = getShapeAnchorPoint(to, ts);
            const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (d < best) {
                best     = d;
                fromSide = fs;
                toSide   = ts;
            }
        }
    }

    return { fromSide, toSide };
}

/**
 * All 4 connection dot positions for a shape (world coords).
 */
export function getConnectionDots(shape: Shape): { side: ConnectorSide; point: Point }[] {
    if (shape.type === "text" || shape.type === "stroke") {
        return [];
    }
    const sides: ConnectorSide[] = ["top", "right", "bottom", "left"];
    return sides.map(side => ({ side, point: getShapeAnchorPoint(shape, side) }));
}

/**
 * Returns the side whose dot is within `threshold` world-units of `point`.
 */
export function getHoveredDot(
    point: Point,
    shape: Shape,
    threshold = 10
): ConnectorSide | null {
    for (const { side, point: dp } of getConnectionDots(shape)) {
        const d = Math.hypot(point.x - dp.x, point.y - dp.y);
        if (d <= threshold) return side;
    }
    return null;
}
