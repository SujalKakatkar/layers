const measureCanvas = document.createElement("canvas");
const measureCtx = measureCanvas.getContext("2d")!;

export function measureTextSize (text: string, fontSize = 20) {

    measureCtx.font = `${fontSize}px sans-serif`;

    const lines = text.split("\n");

    //this while loop is removing the extra element added by the broswer for visibility
    while(lines.length > 1 && lines.at(-1) === "" && lines.at(-2) === "") {
        lines.pop();
    }
    

    let maxWidth = 0;

    lines.forEach((line) => {
        const metrics = measureCtx.measureText(line || '');
        maxWidth = Math.max(maxWidth, metrics.width);
    });

    const lineHeight = fontSize * 1.2;

    console.log(maxWidth);
    console.log(lines.length * lineHeight);
    
    
    return {
        width: maxWidth,
        height: lines.length * lineHeight,
        lines,
        lineHeight
    };
}