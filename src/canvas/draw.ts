import {drawCircle} from "./shapes/drawCircle";
import type {Connector, ConnectorDraft, EditingText, SelectionArea, Shape} from "../types/types";
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
    // ── connector params (all optional so existing call-sites don't break) ─
    connectors?: Connector[],
    draft?: ConnectorDraft | null,
    dotShapeId?: string | null,
    targetShapeId?: string | null,
) {

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.scale(dpr, dpr);
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    shapes.forEach(shape => {

        if(editingText && shape.id === editingText.id) return

        switch(shape.type) {
            case "rectangle":
                return drawRect(ctx, shape)
            case "circle":
                return drawCircle(ctx, shape)
            case "stroke":
                return drawStroke(ctx, shape)
            case "text":
                return drawText(ctx, shape)
            default:
                return false
        }
    })

    if(currentShape && (!editingText || currentShape.id !== editingText.id)) {
        switch(currentShape.type) {
            case "rectangle":
                drawRect(ctx, currentShape)
                break
            case "circle":
                drawCircle(ctx, currentShape)
                break
            case "stroke":
                drawStroke(ctx, currentShape)
                break
            case "text":
                drawText(ctx, currentShape)
                break
        }
    }

    if(connectors) {
        drawConnectors(ctx, connectors, shapes, scale);
    }

    if(draft && dotShapeId) {
        drawConnectorPreview(ctx, draft, shapes, dotShapeId, scale);
    } else if(draft && targetShapeId) { // Fallback if hovering but not near dot exactly
        drawConnectorPreview(ctx, draft, shapes, targetShapeId, scale);
    } else if(draft) {
        drawConnectorPreview(ctx, draft, shapes, null, scale);
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

        // ── Bounding box stroke ────────────────────────────────────────
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1 / scale;
        ctx.strokeRect(bx, by, bw, bh);

        // ── Resize handles ─────────────────────────────────────────────
        // Handle size stays at 8 CSS px regardless of zoom
        const hSize = 8 / scale;
        const half = hSize / 2;

        const cx = bx + bw / 2;
        const cy = by + bh / 2;

        const handlePositions = [
            {x: bx, y: by},        // nw
            {x: bx + bw, y: by},        // ne
            {x: bx + bw, y: by + bh},   // se
            {x: bx, y: by + bh},   // sw
        ];

        handlePositions.forEach(({x, y}) => {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 1.5 / scale;
            ctx.fillRect(x - half, y - half, hSize, hSize);
            ctx.strokeRect(x - half, y - half, hSize, hSize);
        });

        ctx.restore();
    }

    if(selectArea) {
        ctx.save();

        ctx.fillStyle = "rgba(59,130,246,0.2)";
        ctx.fillRect(
            selectArea.x,
            selectArea.y,
            selectArea.width,
            selectArea.height
        );

        ctx.strokeStyle = "#3b82f6";
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

}
