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
export function getConnectionPoint(shape: Shape, side: ConnectorSide): Point {
    const b = getShapeBounds(shape);
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;

    switch (side) {
        case "top":    return { x: cx, y: b.y };
        case "bottom": return { x: cx, y: b.y + b.height };
        case "left":   return { x: b.x, y: cy };
        case "right":  return { x: b.x + b.width, y: cy };
    }
}

/**
 * Given two shapes, return the closest side pair so the connector
 * always attaches to geometrically nearest anchors.
 * This is recomputed every frame allowing auto-adjustment.
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
            const p1 = getConnectionPoint(from, fs);
            const p2 = getConnectionPoint(to, ts);
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
 * Returns an array of { side, point }.
 */
export function getConnectionDots(shape: Shape): { side: ConnectorSide; point: Point }[] {
    if (shape.type === "text" || shape.type === "stroke") {
        return [];
    }
    const sides: ConnectorSide[] = ["top", "right", "bottom", "left"];
    return sides.map(side => ({ side, point: getConnectionPoint(shape, side) }));
}

/**
 * Returns the side whose dot is within `threshold` world-units of `point`,
 * or null if no dot is close enough.
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
