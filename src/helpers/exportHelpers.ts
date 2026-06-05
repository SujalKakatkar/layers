import { getThemeBgColor, setActiveTheme } from "../lib/utils";
import type { Shape, Connector } from "../types/types";
import { getSelectionBounds } from "../canvas/selectArea";
import { drawShapesLayer, drawConnectorsLayer } from "../canvas/draw";

export function exportShapes(
    format: "png" | "jpg",
    shapesToExport: Shape[],
    connectorsToExport: Connector[],
    theme: "light" | "dark" | null,
    padding: number = 60
) {
    const bounds = getSelectionBounds(shapesToExport, shapesToExport.map(s => s._id));
    if (!bounds) return;

    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;
    
    const dpr = window.devicePixelRatio || 1;

    // Create main canvas
    const canvas = document.createElement("canvas");
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Create layer canvases for drawing (they use dpr internally in draw functions)
    const shapesCanvas = document.createElement("canvas");
    shapesCanvas.width = width * dpr;
    shapesCanvas.height = height * dpr;

    const connectorsCanvas = document.createElement("canvas");
    connectorsCanvas.width = width * dpr;
    connectorsCanvas.height = height * dpr;

    const offset = { x: -bounds.x + padding, y: -bounds.y + padding };

    // Set theme for proper text and shape colors
    setActiveTheme(theme);

    // Draw layers
    drawConnectorsLayer(connectorsCanvas, connectorsToExport, shapesToExport, 1, offset, null);
    drawShapesLayer(shapesCanvas, null, shapesToExport, 1, offset, null);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set background according to theme
    ctx.fillStyle = getThemeBgColor();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw layers onto main canvas
    ctx.drawImage(connectorsCanvas, 0, 0);
    ctx.drawImage(shapesCanvas, 0, 0);

    // Export and download
    const dataUrl = canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 1.0);
    const link = document.createElement("a");
    link.download = `export-${Date.now()}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
