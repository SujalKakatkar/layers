import type {Connector, Point, Shape, ConnectionState} from "../../types/types";
import { getAStarPath } from "./astar.worker";
import {
    getConnectionDots,
    getConnectionPoint,
    getClosestSidePair,
    getShapeBounds,
    getBezierControl,
} from "../../helpers/connectorHelpers";

// Committed connectors 

let astarWorker: Worker | null = null;
if (typeof Worker !== 'undefined') {
    astarWorker = new Worker(new URL('./astar.worker.ts', import.meta.url), { type: 'module' });
}

let globalRequestRedraw: (() => void) | undefined;
const pathCache = new Map<string, { hash: string, path: Point[] }>();
const pendingWorkers = new Set<string>();

if (astarWorker) {
    astarWorker.onmessage = (e) => {
        const { id, path } = e.data;
        const [connId, hash] = id.split('||');
       
        pathCache.set(connId, { hash, path });
        pendingWorkers.delete(connId);
        if (globalRequestRedraw) globalRequestRedraw();
    };
}

/**
 * Draw all committed connector lines.
 * Sides are recomputed each frame from shape geometry (auto-adjustment).
 */
export function drawConnectors (
    ctx: CanvasRenderingContext2D,
    connectors: Connector[],
    shapes: Shape[],
    scale: number,
    selectedConnectorId?: string | null,
    requestRedraw?: () => void
) {
    globalRequestRedraw = requestRedraw;
    if(connectors.length === 0) return;

    const shapeMap = new Map<string, Shape>(shapes.map(s => [s.id, s]));

    ctx.save();
    
    const usageMap = new Map<string, number>();

    for(const conn of connectors) {
        const fromShape = shapeMap.get(conn.fromShapeId);
        const toShape = shapeMap.get(conn.toShapeId);
        if(!fromShape || !toShape) continue;

        const isSelected = conn.id === selectedConnectorId;

        if(conn.isGenerated) {
            // ── Smart routing for LayerScript connectors
            drawGeneratedConnector(ctx, conn.id, fromShape, toShape, shapes, scale, isSelected, usageMap);
        } else {
            // Manual connectors: use closest geometric side pair 
            const {fromSide, toSide} = getClosestSidePair(fromShape, toShape);
            const p1 = getConnectionPoint(fromShape, fromSide);
            const p2 = getConnectionPoint(toShape, toSide);
            const cp1 = getBezierControl(p1, p2, 0.35);
            const cp2 = getBezierControl(p2, p1, 0.35);
            drawBezierLine(ctx, p1, p2, cp1, cp2, scale, false, isSelected);
            drawArrowHead(ctx, cp2, p2, scale, isSelected);
        }
    }

    ctx.restore();
}

//Orthogonal Line Drawing 

function drawOrthogonalLine(
    ctx: CanvasRenderingContext2D,
    path: Point[],
    scale: number,
    isSelected?: boolean,
    color?: string
) {
    if (path.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    
    // Draw with rounded corners
    const radius = 8;
    for (let i = 1; i < path.length - 1; i++) {
        const p0 = path[i - 1];
        const p1 = path[i];
        const p2 = path[i + 1];
        
        const d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const r = Math.min(radius, d1 / 2, d2 / 2);
        
        ctx.arcTo(p1.x, p1.y, p2.x, p2.y, r);
    }
    ctx.lineTo(path[path.length - 1].x, path[path.length - 1].y);

    if (color) {
        ctx.strokeStyle = isSelected ? "#10B981" : color;
        ctx.lineWidth = (isSelected ? 5 : 3) / scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
    } else {
        ctx.strokeStyle = isSelected ? "#10B981" : "black";
        ctx.lineWidth = (isSelected ? 6 : 4) / scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 / scale;
        ctx.lineJoin = "round";
        ctx.stroke();
    }
}

function getColorForShape(id: string) {
    const colors = [
        "#ef4444", "#f97316", "#eab308", "#22c55e", 
        "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Smart connector routing for LayerScript-generated diagrams.
 * Uses A* pathfinding to find an orthogonal path that avoids all node rectangles.
 */
function drawGeneratedConnector (
    ctx: CanvasRenderingContext2D,
    connId: string,
    fromShape: Shape,
    toShape: Shape,
    shapes: Shape[],
    scale: number,
    isSelected: boolean,
    usageMap: Map<string, number>
) {
    const fromBounds = getShapeBounds(fromShape);
    const toBounds = getShapeBounds(toShape);

    const fromCX = fromBounds.x + fromBounds.width / 2;
    const toCX = toBounds.x + toBounds.width / 2;

    const isBackEdge = fromCX > toCX + 10;
    const isSameColumn = Math.abs(fromCX - toCX) < 10;

    let p1: Point, p2: Point;

    if(isBackEdge) {
        p1 = getConnectionPoint(fromShape, "bottom");
        p2 = getConnectionPoint(toShape, "bottom");
    } else if(isSameColumn) {
        p1 = getConnectionPoint(fromShape, "right");
        p2 = getConnectionPoint(toShape, "right");
    } else {
        p1 = getConnectionPoint(fromShape, "right");
        p2 = getConnectionPoint(toShape, "left");
    }

    // Cache hash needs to represent positions that affect pathfinding
    const hash = JSON.stringify(p1) + JSON.stringify(p2) + shapes.map(s => {
        if (s.type === 'stroke') return '';
        const b = getShapeBounds(s);
        return b.x + ',' + b.y + ',' + b.width + ',' + b.height;
    }).join(';') + usageMap.size;
    let path: Point[];
    const cached = pathCache.get(connId);

    if (cached && cached.hash === hash) {
        path = cached.path;
    } else {
        if (astarWorker) {
            if (!pendingWorkers.has(connId)) {
                pendingWorkers.add(connId);
                astarWorker.postMessage({
                    id: connId + '||' + hash,
                    start: p1,
                    end: p2,
                    shapes,
                    ignoreIds: [fromShape.id, toShape.id],
                    usageMap: [...usageMap.entries()]
                });
            }
            path = cached ? cached.path : [p1, p2];
        } else {
            path = getAStarPath(p1, p2, shapes, [fromShape.id, toShape.id], usageMap);
            pathCache.set(connId, { hash, path });
        }
    }
    const color = getColorForShape(fromShape.id);
    
    drawOrthogonalLine(ctx, path, scale, isSelected, color);
    
    if (path.length >= 2) {
        const last = path[path.length - 1];
        let prev = path[path.length - 2];
        for (let i = path.length - 2; i >= 0; i--) {
            if (Math.hypot(path[i].x - last.x, path[i].y - last.y) > 1) {
                prev = path[i];
                break;
            }
        }
        drawArrowHead(ctx, prev, last, scale, isSelected, color);
    }
}


// ─── Preview line while dragging ────────────────────────────────────────────

export function drawConnectorPreview (
    ctx: CanvasRenderingContext2D,
    state: ConnectionState,
    shapes: Shape[],
    scale: number
) {
    if(state.mode === "idle") return;

    const fromShape = shapes.find(s => s.id === state.sourceId);
    if(!fromShape) return;

    const p1 = getConnectionPoint(fromShape, state.side);
    let p2: Point;
    let targetShapeId: string | null = null;

    if(state.mode === "hover") {
        const ghost = state.ghostShape;
        const b = getShapeBounds(ghost);
        p2 = {x: b.x + b.width / 2, y: b.y + b.height / 2};
    } else {
        p2 = {x: state.mouseX, y: state.mouseY};
        targetShapeId = state.targetShapeId;
    }

    ctx.save();
    const cp1 = getBezierControl(p1, p2, 0.35);
    const cp2 = getBezierControl(p2, p1, 0.35);
    drawBezierLine(ctx, p1, p2, cp1, cp2, scale, true);

    // Highlight hovering target shape
    if(targetShapeId) {
        const target = shapes.find(s => s.id === targetShapeId);
        if(target) highlightShape(ctx, target, scale);
    }

    ctx.restore();
}

// ─── Connection dots (+) on hover / selection ────────────────────────────────

/**
 * Draw "+"-style connection dots on shapes that are hovered or selected.
 * `visibleShapeIds` = union of hovered + selected shape ids.
 */
export function drawConnectionDots (
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    visibleShapeIds: string[],
    scale: number
) {
    if(visibleShapeIds.length === 0) return;

    const shapeSet = new Set(visibleShapeIds);

    ctx.save();

    for(const shape of shapes) {
        if(!shapeSet.has(shape.id) || shape.isGenerated) continue;

        const dots = getConnectionDots(shape);
        for(const {point} of dots) {
            drawDot(ctx, point, scale);
        }
    }

    ctx.restore();
}

// ─── Internals ───────────────────────────────────────────────────────────────

function drawBezierLine (
    ctx: CanvasRenderingContext2D,
    p1: Point,
    p2: Point,
    cp1: Point,
    cp2: Point,
    scale: number,
    isDraft: boolean,
    isSelected?: boolean
) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);

    // Bezier control points — offset perpendicular to the midpoint
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);

    if(isDraft) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.5 / scale;
        ctx.setLineDash([6 / scale, 4 / scale]);
        ctx.lineCap = "round";
        ctx.stroke();
    } else {
        // draw black/emerald line first (thicker)
        ctx.strokeStyle = isSelected ? "#10B981" : "black";
        ctx.lineWidth = (isSelected ? 6 : 4) / scale;
        ctx.lineCap = "round";
        ctx.stroke();

        // then white line on top
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawArrowHead (
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    scale: number,
    isSelected?: boolean,
    color?: string
) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = (color ? 12 : 10) / scale;

    ctx.save();
    ctx.translate(to.x, to.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.4);
    ctx.lineTo(-size, size * 0.4);
    ctx.closePath();

    if (color) {
        ctx.fillStyle = isSelected ? "#10B981" : color;
        ctx.fill();
    } else {
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.lineWidth = 1.5 / scale;
        ctx.strokeStyle = isSelected ? "#10B981" : "black";
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawDot (ctx: CanvasRenderingContext2D, point: Point, scale: number) {
    const r = 5 / scale;
    const arm = 4 / scale;
    const lw = 1.5 / scale;

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
    ctx.lineWidth = lw;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(point.x - arm, point.y);
    ctx.lineTo(point.x + arm, point.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(point.x, point.y - arm);
    ctx.lineTo(point.x, point.y + arm);
    ctx.stroke();
}

function highlightShape (
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    scale: number
) {
    let x: number, y: number, w: number, h: number;

    switch(shape.type) {
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
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([5 / scale, 3 / scale]);
    ctx.strokeRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
    ctx.setLineDash([]);
}
