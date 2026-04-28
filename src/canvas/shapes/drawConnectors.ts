import type { Connector, ConnectorSide, Point, Shape, ConnectionState } from "../../types/types";
import {
    getConnectionDots,
    getConnectionPoint,
    getClosestSidePair,
    getShapeBounds,
    getBezierControl,
} from "../../helpers/connectorHelpers";

// ─── Committed connectors ────────────────────────────────────────────────────

/**
 * Draw all committed connector lines.
 * Sides are recomputed each frame from shape geometry (auto-adjustment).
 */
export function drawConnectors(
    ctx: CanvasRenderingContext2D,
    connectors: Connector[],
    shapes: Shape[],
    scale: number,
    selectedConnectorId?: string | null
) {
    if (connectors.length === 0) return;

    const shapeMap = new Map<string, Shape>(shapes.map(s => [s.id, s]));

    ctx.save();

    for (const conn of connectors) {
        const fromShape = shapeMap.get(conn.fromShapeId);
        const toShape   = shapeMap.get(conn.toShapeId);
        if (!fromShape || !toShape) continue;

        // Dynamically recompute closest sides so the connector auto-adjusts
        const { fromSide, toSide } = getClosestSidePair(fromShape, toShape);

        const p1 = getConnectionPoint(fromShape, fromSide);
        const p2 = getConnectionPoint(toShape,   toSide);

        const isSelected = conn.id === selectedConnectorId;
        drawConnectorLine(ctx, p1, p2, scale, false, isSelected);

        // Arrow head at destination
        drawArrowHead(ctx, p1, p2, scale, isSelected);
    }

    ctx.restore();
}

// ─── Preview line while dragging ────────────────────────────────────────────

export function drawConnectorPreview(
    ctx: CanvasRenderingContext2D,
    state: ConnectionState,
    shapes: Shape[],
    scale: number
) {
    if (state.mode === "idle") return;

    const fromShape = shapes.find(s => s.id === state.sourceId);
    if (!fromShape) return;

    const p1 = getConnectionPoint(fromShape, state.side);
    let p2: Point;
    let targetShapeId: string | null = null;

    if (state.mode === "hover") {
        const ghost = state.ghostShape;
        const b = getShapeBounds(ghost);
        p2 = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    } else {
        p2 = { x: state.mouseX, y: state.mouseY };
        targetShapeId = state.targetShapeId;
    }

    ctx.save();
    drawConnectorLine(ctx, p1, p2, scale, true);

    // Highlight hovering target shape
    if (targetShapeId) {
        const target = shapes.find(s => s.id === targetShapeId);
        if (target) highlightShape(ctx, target, scale);
    }

    ctx.restore();
}

// ─── Connection dots (+) on hover / selection ────────────────────────────────

/**
 * Draw "+"-style connection dots on shapes that are hovered or selected.
 * `visibleShapeIds` = union of hovered + selected shape ids.
 */
export function drawConnectionDots(
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    visibleShapeIds: string[],
    scale: number,
    dotShapeId: string | null,
    selectedIds: string[]
) {
    if (visibleShapeIds.length === 0) return;

    const shapeSet = new Set(visibleShapeIds);

    ctx.save();

    for (const shape of shapes) {
        if (!shapeSet.has(shape.id) || (shape as any).isGenerated) continue;

        const dots = getConnectionDots(shape);
        for (const { point } of dots) {
            drawDot(ctx, point, scale);
        }
    }

    ctx.restore();
}

// ─── Internals ───────────────────────────────────────────────────────────────

function drawConnectorLine(
    ctx: CanvasRenderingContext2D,
    p1: Point,
    p2: Point,
    scale: number,
    isDraft: boolean,
    isSelected?: boolean
) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);

    // Bezier control points — offset perpendicular to the midpoint
    const cp1 = getBezierControl(p1, p2, 0.35);
    const cp2 = getBezierControl(p2, p1, 0.35);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);

    if (isDraft) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth   = 1.5 / scale;
        ctx.setLineDash([6 / scale, 4 / scale]);
        ctx.lineCap = "round";
        ctx.stroke();
    } else {
        // draw black/emerald line first (thicker)
        ctx.strokeStyle = isSelected ? "#10B981" : "black";
        ctx.lineWidth   = (isSelected ? 6 : 4) / scale;
        ctx.lineCap = "round";
        ctx.stroke();

        // then white line on top
        ctx.strokeStyle = "white";
        ctx.lineWidth   = 2 / scale;
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawArrowHead(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    scale: number,
    isSelected?: boolean
) {
    const angle  = Math.atan2(to.y - from.y, to.x - from.x);
    const size   = 10 / scale;

    ctx.save();
    ctx.translate(to.x, to.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.4);
    ctx.lineTo(-size,  size * 0.4);
    ctx.closePath();

    ctx.fillStyle = "white";
    ctx.fill();
    
    ctx.lineWidth = 1.5 / scale;
    ctx.strokeStyle = isSelected ? "#10B981" : "black";
    ctx.stroke();
    ctx.restore();
}

function drawDot(ctx: CanvasRenderingContext2D, point: Point, scale: number) {
    const r    = 5 / scale;
    const arm  = 4 / scale;
    const lw   = 1.5 / scale;

    // Outer white circle (border)
    ctx.beginPath();
    ctx.arc(point.x, point.y, r + lw, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();

    // Inner emerald fill
    ctx.beginPath();
    ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#10B981";
    ctx.fill();

    // "+" cross
    ctx.strokeStyle = "white";
    ctx.lineWidth   = lw;
    ctx.lineCap     = "round";

    ctx.beginPath();
    ctx.moveTo(point.x - arm, point.y);
    ctx.lineTo(point.x + arm, point.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(point.x, point.y - arm);
    ctx.lineTo(point.x, point.y + arm);
    ctx.stroke();
}

function highlightShape(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    scale: number
) {
    let x: number, y: number, w: number, h: number;

    switch (shape.type) {
        case "rectangle":
            x = shape.x; y = shape.y; w = shape.width; h = shape.height;
            break;
        case "circle":
            x = shape.cx - shape.r; y = shape.cy - shape.r;
            w = shape.r * 2; h = shape.r * 2;
            break;
        case "text":
            x = shape.x; y = shape.y; w = shape.width; h = shape.height;
            break;
        case "stroke":
            return; // skip stroke highlight
    }

    const pad = 6 / scale;
    ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
    ctx.lineWidth   = 2 / scale;
    ctx.setLineDash([5 / scale, 3 / scale]);
    ctx.strokeRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
    ctx.setLineDash([]);
}
