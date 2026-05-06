import type {Rectangle} from "../../types/types";

export function drawRect (
    ctx: CanvasRenderingContext2D,
    rect: Rectangle,
    scale: number,
    radius = 10,
) {
    ctx.save();
    let {x, y, width, height} = rect;

    if(width < 0) {x += width; width = Math.abs(width);}
    if(height < 0) {y += height; height = Math.abs(height);}

    const r = Math.min(radius, width / 2, height / 2);


    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([])

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    
}