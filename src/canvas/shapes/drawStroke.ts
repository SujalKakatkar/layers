import type {Stroke} from "../../types/types"

export function drawStroke (
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
) {
    if(stroke.points.length < 2) return

    ctx.save()

    // --- draw the stroke ---
    ctx.beginPath()
    ctx.lineWidth = stroke.width
    ctx.strokeStyle = stroke.color
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
