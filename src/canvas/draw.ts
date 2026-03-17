import {drawCircle} from "./shapes/drawCircle";
import type {EditingText, SelectionArea, Shape} from "../types/types";
import {drawRect} from "./shapes/drawRect";
import {getSelectionBounds} from "./selectArea";
import {drawStroke} from "./shapes/drawStroke";
import {drawText} from "./shapes/drawText";
import { measureTextSize} from "../helpers/measureTextSize";

export function drawScene (
    canvas: HTMLCanvasElement,
    currentShape: Shape | null,
    shapes: Shape[],
    scale: number,
    offset: {x: number; y: number},
    selectArea: SelectionArea,
    selectedIds: string[],
    editingText?: EditingText | null
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
    let bounds = getSelectionBounds(shapes, selectedIds);

    if(editingText) {
        

        const {width, height} = measureTextSize(
            editingText.text,
            editingText.fontSize
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

        ctx.strokeStyle = "#3b82f6";
        const pad = 10;
        ctx.lineWidth = 1 / scale;

        ctx.strokeRect(
            bounds.x - pad,
            bounds.y - pad,
            bounds.width + pad * 2,
            bounds.height + pad * 2
        );

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
