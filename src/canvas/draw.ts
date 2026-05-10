import {drawCircle} from "./shapes/drawCircle";
import type {Connector, EditingText, SelectionArea, Shape, Guide, ConnectionState} from "../types/types";
import {drawRect} from "./shapes/drawRect";
import {getSelectionBounds} from "./selectArea";
import {drawStroke} from "./shapes/drawStroke";
import {drawText} from "./shapes/drawText";
import {measureTextSize} from "../helpers/measureTextSize";
import {drawConnectors, drawConnectorPreview, drawConnectionDots} from "./shapes/drawConnectors";

export function drawScene (
    canvas: HTMLCanvasElement,
    currentShape: Shape | null,
    shapes: Shape[],
    scale: number,
    offset: {x: number; y: number},
    selectArea: SelectionArea,
    selectedIds: string[],
    editingText?: EditingText | null,
    guides?: Guide[],
    // ── connector params ──
    connectors?: Connector[],
    connectionState?: ConnectionState,
    dotShapeId?: string | null,
    ghostPreview?: {type: "rectangle" | "circle" | "text"; x: number; y: number; width?: number; height?: number;} | null,
    selectedConnectorId?: string | null,
    requestRedraw?: () => void
) {

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.scale(dpr, dpr);
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const renderShape = (shape: Shape, opacity: number = 1) => {
        ctx.save();
        ctx.globalAlpha = opacity;

        if(shape.rotation) {
            let cx = 0, cy = 0;
            if(shape.type === "rectangle" || shape.type === "text") {
                cx = shape.x + shape.width / 2;
                cy = shape.y + shape.height / 2;
            } else if(shape.type === "circle") {
                cx = shape.cx;
                cy = shape.cy;
            }
            if(cx || cy) {
                ctx.translate(cx, cy);
                ctx.rotate(shape.rotation);
                ctx.translate(-cx, -cy);
            }
        }

        switch(shape.type) {
            case "rectangle": drawRect(ctx, shape, scale); break;
            case "circle": drawCircle(ctx, shape, scale); break;
            case "stroke": drawStroke(ctx, shape, scale); break;
            case "text": drawText(ctx, shape, scale); break;
        }

        if((shape as any).text && shape.type !== "text") {
            drawText(ctx, shape as any, scale);
        }

        ctx.restore();
    };

    shapes.forEach(shape => {
        if(editingText && shape.id === editingText.id) return;
        renderShape(shape);
    });

    if(currentShape && (!editingText || currentShape.id !== editingText.id)) {
        renderShape(currentShape);
    }

    if(connectors) {
        drawConnectors(ctx, connectors, shapes, scale, selectedConnectorId, requestRedraw);
    }

    // ── Unified Connection Rendering ──────────────────────────────────
    if(connectionState) {
        if(connectionState.mode === "hover") {
            renderShape(connectionState.ghostShape, 0.4);
            drawConnectorPreview(ctx, connectionState, shapes, scale);
        } else if(connectionState.mode === "drag") {
            drawConnectorPreview(ctx, connectionState, shapes, scale);
        }
    }

    if(dotShapeId || selectedIds.length > 0) {
        const visibleDotIds = new Set(selectedIds);
        if(dotShapeId) visibleDotIds.add(dotShapeId);

        drawConnectionDots(ctx, shapes, Array.from(visibleDotIds), scale, dotShapeId || null, selectedIds);
    }

    let bounds = getSelectionBounds(shapes, selectedIds);

    if(editingText) {
        const {width, height} = measureTextSize(
            editingText.text,
            editingText.fontSize,
            editingText.fontWeight
        );

        bounds = {
            x: editingText.x,
            y: editingText.y,
            width,
            height
        };
    }

    if(bounds) {
        ctx.save();

        const pad = 10;
        const bx = bounds.x - pad;
        const by = bounds.y - pad;
        const bw = bounds.width + pad * 2;
        const bh = bounds.height + pad * 2;

        const cx = bx + bw / 2;
        const cy = by + bh / 2;

        const angle = (bounds as any).rotation || 0;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const getRotated = (px: number, py: number) => {
            const dx = px - cx;
            const dy = py - cy;
            return {
                x: cx + dx * cosA - dy * sinA,
                y: cy + dx * sinA + dy * cosA
            };
        };

        const corners = [
            getRotated(bx, by),        // nw
            getRotated(bx + bw, by),   // ne
            getRotated(bx + bw, by + bh), // se
            getRotated(bx, by + bh),   // sw
        ];

        // ── Bounding box stroke ────────────────────────────────────────
        ctx.strokeStyle = "#10B981";
        ctx.lineWidth = 1 / scale;

        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[3].x, corners[3].y);
        ctx.closePath();
        ctx.stroke();

        // ── Resize handles ─────────────────────────────────────────────
        // Handle size stays at 8 CSS px regardless of zoom
        const hSize = 8 / scale;
        const half = hSize / 2;

        corners.forEach(({x, y}) => {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#10B981";
            ctx.lineWidth = 1.5 / scale;
            ctx.fillRect(x - half, y - half, hSize, hSize);
            ctx.strokeRect(x - half, y - half, hSize, hSize);
        });

        ctx.restore();
    }

    if(selectArea) {
        ctx.save();

        ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
        ctx.fillRect(
            selectArea.x,
            selectArea.y,
            selectArea.width,
            selectArea.height
        );

        ctx.strokeStyle = "#10B981";
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1;
        ctx.strokeRect(
            selectArea.x,
            selectArea.y,
            selectArea.width,
            selectArea.height
        );

        ctx.restore();
    }

    if(guides && guides.length > 0) {
        ctx.save();
        ctx.strokeStyle = "#a855f7"; // purple-500
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([4 / scale, 4 / scale]);

        // to draw infinite lines, we can just use a very large number or canvas boundaries
        // wait, we translated offset and scaled. The canvas boundaries in world coordinates are:
        const worldMinX = -offset.x / scale;
        const worldMinY = -offset.y / scale;
        const worldMaxX = (canvas.width / dpr - offset.x) / scale;
        const worldMaxY = (canvas.height / dpr - offset.y) / scale;

        guides.forEach(guide => {
            ctx.beginPath();
            if(guide.type === "vertical") {
                ctx.moveTo(guide.position, worldMinY - 1000);
                ctx.lineTo(guide.position, worldMaxY + 1000);
            } else {
                ctx.moveTo(worldMinX - 1000, guide.position);
                ctx.lineTo(worldMaxX + 1000, guide.position);
            }
            ctx.stroke();
        });

        ctx.restore();
    }

    // ── Ghost Preview ──────────────────────────────────────────────
    if(ghostPreview) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = "#10B981"; // emerald
        ctx.lineWidth = 1.5 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);

        ctx.beginPath();
        if(ghostPreview.type === "rectangle") {
            const {x, y, width = 120, height = 80} = ghostPreview;
            const r = 10;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + width - r, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + r);
            ctx.lineTo(x + width, y + height - r);
            ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
            ctx.lineTo(x + r, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
        } else if(ghostPreview.type === "circle") {
            const r = 50;
            const cx = ghostPreview.x + r;
            const cy = ghostPreview.y + r;
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
        } else if(ghostPreview.type === "text") {
            const {x, y, width = 100, height = 30} = ghostPreview;
            ctx.rect(x, y, width, height);
        }
        ctx.stroke();

        if(ghostPreview.type === "text") {
            ctx.fillStyle = "#10B981";
            ctx.font = `${24}px sans-serif`;
            ctx.textBaseline = "top";
            ctx.fillText("Text", ghostPreview.x + 5, ghostPreview.y + 5);
        }
        ctx.restore();
    }

}
