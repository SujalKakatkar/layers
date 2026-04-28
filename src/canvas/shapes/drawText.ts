import {measureTextSize} from "../../helpers/measureTextSize"
import type {Text} from "../../types/types"

export function drawText (
    ctx: CanvasRenderingContext2D,
    shape: Text | any
) {
    if (!shape.text) return;

    const weight = shape.fontWeight || "normal";
    const fontSize = shape.fontSize || 14;

    ctx.font = `${weight} ${fontSize}px 'Patrick Hand', sans-serif`;
    ctx.fillStyle = "white";

    // ── Center coordinates based on shape type ────────────────────────────
    let centerX: number;
    let centerY: number;

    if (shape.type === "circle") {
        // Generated circle: use cx/cy directly
        centerX = shape.cx;
        centerY = shape.cy;
    } else if (shape.type === "rectangle") {
        // Generated rectangle: center of bounding box
        centerX = shape.x + shape.width / 2;
        centerY = shape.y + shape.height / 2;
    } else {
        // Native Text shape: left-aligned or explicit alignment via textAlign
        const {lines, lineHeight} = measureTextSize(shape.text, fontSize, weight);

        ctx.textBaseline = "top";
        ctx.textAlign = shape.textAlign || "left";

        let xOffset = shape.x;
        if (shape.textAlign === "center") xOffset = shape.x + shape.width / 2;
        if (shape.textAlign === "right")  xOffset = shape.x + shape.width;

        lines.forEach((line, i) => {
            ctx.fillText(line, xOffset, shape.y + i * lineHeight);
        });
        return;
    }

    // ── Render centered text for rectangle/circle ─────────────────────────
    const {lines, lineHeight} = measureTextSize(shape.text, fontSize, weight);

    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    const totalHeight = lines.length * lineHeight;
    const topY = centerY - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
        ctx.fillText(line, centerX, topY + i * lineHeight);
    });
}