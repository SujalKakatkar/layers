import {measureTextSize} from "../../helpers/measureTextSize"
import type {Text} from "../../types/types"

export function drawText (
    ctx: CanvasRenderingContext2D,
    shape: Text
) {

    console.log("final shape",shape);
    
    ctx.font = `${shape.fontSize}px sans-serif`
    ctx.fillStyle = "white"
    ctx.textBaseline = "top"

    const {lines,lineHeight} = measureTextSize(
        shape.text,
        shape.fontSize,
    )
    

    lines.forEach((line, i) => {
        ctx.fillText(line, shape.x, shape.y + i * lineHeight)
    })
}