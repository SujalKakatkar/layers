import type {Circle} from "../../types/types";

export function drawCircle (
    ctx: CanvasRenderingContext2D,
    circle: Circle,
) {
    const {cx, cy, r} = circle;
    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([])

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

}
