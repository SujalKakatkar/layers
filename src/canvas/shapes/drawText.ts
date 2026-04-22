import {measureTextSize} from "../../helpers/measureTextSize"
import type {Text} from "../../types/types"

export function drawText (
    ctx: CanvasRenderingContext2D,
    shape: Text
) {

    const weight = shape.fontWeight || "normal";
    ctx.font = `${weight} ${shape.fontSize}px sans-serif`;
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";
    ctx.textAlign = shape.textAlign || "left";

    const {lines,lineHeight} = measureTextSize(
        shape.text,
        shape.fontSize,
        weight
    );
    
    // x position changes depending on text align
    let xOffset = shape.x;
    if (shape.textAlign === "center") xOffset = shape.x + shape.width / 2;
    if (shape.textAlign === "right") xOffset = shape.x + shape.width;

    lines.forEach((line, i) => {
        ctx.fillText(line, xOffset, shape.y + i * lineHeight);
    });
}