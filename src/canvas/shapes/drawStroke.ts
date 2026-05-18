import type {Stroke} from "../../types/types"
import { getThemeColor } from "../../lib/utils"

export function drawStroke (
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    scale: number
) {
    if(stroke.points.length < 2) return

    ctx.save()

    const isThemeColor = 
        stroke.color === "theme" || 
        stroke.color === "currentColor" || 
        stroke.color === "white" || 
        stroke.color === "#ffffff" || 
        stroke.color === "#0f172a";

    // --- draw the stroke ---
    ctx.beginPath()
    ctx.lineWidth = stroke.width / scale
    ctx.strokeStyle = isThemeColor ? getThemeColor() : stroke.color
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.setLineDash([])

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

    for(let i = 1;i < stroke.points.length;i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }

    ctx.stroke()
    ctx.restore()

}
