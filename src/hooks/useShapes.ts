import {useState} from "react"
import type {HandleType, Shape} from "../types/types"
import {measureTextSize} from "../helpers/measureTextSize"

export function useShapes () {
    const [shapes, setShapes] = useState<Shape[]>([])

    const [currentShape, setCurrentShape] = useState<Shape | null>(null)

    // Add shape
    function addShape (shape: Shape) {
        setShapes(prev => [...prev, shape])
    }
    //current shapes
    function addCurrentShape (shape: Shape | null) {
        setCurrentShape(shape)
    }

    // Update single shape
    function updateShape (id: string, updater: (shape: Shape) => Shape) {
        setShapes(prev =>
            prev.map(shape =>
                shape.id === id ? updater(shape) : shape
            )
        )
    }

    // Remove shapes
    function removeShapes (ids: string[]) {
        setShapes(prev =>
            prev.filter(shape => !ids.includes(shape.id))
        )
    }

    // Move shapes
    function moveShapes (ids: string[], dx: number, dy: number) {
        setShapes(prev =>
            prev.map(shape => {
                if(!ids.includes(shape.id)) return shape

                switch(shape.type) {
                    case "rectangle":
                        return {
                            ...shape,
                            x: shape.x + dx,
                            y: shape.y + dy
                        }

                    case "circle":
                        return {
                            ...shape,
                            cx: shape.cx + dx,
                            cy: shape.cy + dy
                        }

                    case "stroke":
                        return {
                            ...shape,
                            points: shape.points.map(p => ({
                                x: p.x + dx,
                                y: p.y + dy
                            }))
                        }
                    case "text":
                        return {
                            ...shape,
                            x: shape.x + dx,
                            y: shape.y + dy
                        }

                    default:
                        return shape
                }
            })
        )
    }

    // Get shape
    function getShapeById (id: string) {
        return shapes.find(shape => shape.id === id)
    }

    //resize shapes
    function resizeShapes (
        ids: string[],
        handle: HandleType,
        dx: number,
        dy: number,
        initialMap: Map<string, Shape>
    ) {
        setShapes(prev =>
            prev.map(shape => {
                if(!ids.includes(shape.id)) return shape;

                switch(shape.type) {


                    case "rectangle": {
                        const original = initialMap.get(shape.id);
                        if(!original || original.type !== "rectangle") return shape;

                        let {x, y, width, height} = original;

                        switch(handle) {
                            case "se":
                                width += dx;
                                height += dy;
                                break;

                            case "sw":
                                x += dx;
                                width -= dx;
                                height += dy;
                                break;

                            case "ne":
                                y += dy;
                                height -= dy;
                                width += dx;
                                break;

                            case "nw":
                                x += dx;
                                y += dy;
                                width -= dx;
                                height -= dy;
                                break;
                        }

                        // 🔥 Handle flipping
                        if(width < 0) {
                            x += width;
                            width = Math.abs(width);
                        }

                        if(height < 0) {
                            y += height;
                            height = Math.abs(height);
                        }

                        return {...shape, x, y, width, height};
                    }


                    case "circle": {
                        const original = initialMap.get(shape.id)
                        if(!original || original.type !== "circle") return shape
                        let {cx, cy, r} = original;

                        let x = cx - r;
                        let y = cy - r;
                        let width = r * 2;
                        let height = r * 2;

                        switch(handle) {
                            case "se":
                                width += dx;
                                height += dy;
                                break;

                            case "sw":
                                x += dx;
                                width -= dx;
                                height += dy;
                                break;

                            case "ne":
                                y += dy;
                                height -= dy;
                                width += dx;
                                break;

                            case "nw":
                                x += dx;
                                y += dy;
                                width -= dx;
                                height -= dy;
                                break;
                        }

                        if(width < 0) {
                            x += width;
                            width = Math.abs(width);
                        }

                        if(height < 0) {
                            y += height;
                            height = Math.abs(height);
                        }

                        // Keep it proportional (true circle)
                        const newR = Math.max(width, height) / 2;

                        return {
                            ...shape,
                            cx: x + newR,
                            cy: y + newR,
                            r: newR
                        };
                    }

                    case "stroke": {
                        const original = initialMap.get(shape.id)

                        if(!original || original.type !== "stroke") return shape;
                        const points = original.points;

                        const minX = Math.min(...points.map(p => p.x));
                        const minY = Math.min(...points.map(p => p.y));
                        const maxX = Math.max(...points.map(p => p.x));
                        const maxY = Math.max(...points.map(p => p.y));

                        let x = minX;
                        let y = minY;
                        let width = maxX - minX;
                        let height = maxY - minY;

                        switch(handle) {
                            case "se":
                                width += dx;
                                height += dy;
                                break;

                            case "sw":
                                x += dx;
                                width -= dx;
                                height += dy;
                                break;

                            case "ne":
                                y += dy;
                                height -= dy;
                                width += dx;
                                break;

                            case "nw":
                                x += dx;
                                y += dy;
                                width -= dx;
                                height -= dy;
                                break;
                        }

                        if(width < 0) {
                            x += width;
                            width = Math.abs(width);
                        }

                        if(height < 0) {
                            y += height;
                            height = Math.abs(height);
                        }

                        const baseWidth = maxX - minX || 1;
                        const baseHeight = maxY - minY || 1;

                        const scaleX = width / baseWidth;
                        const scaleY = height / baseHeight;

                        const newPoints = points.map(p => ({
                            x: x + (p.x - minX) * scaleX,
                            y: y + (p.y - minY) * scaleY
                        }));

                        return {
                            ...shape,
                            points: newPoints
                        };
                    }

                    case "text": {
                        const original = initialMap.get(shape.id);
                        if(!original || original.type !== "text") return shape;

                        let {x, y, width} = original;

                        const MIN_W = 40;

                        switch(handle) {
                            case "se":
                                width = Math.max(MIN_W, width + dx);
                                break;

                            case "sw":
                                width = Math.max(MIN_W, width - dx);
                                x = original.x + (original.width - width);
                                break;

                            case "ne":
                                width = Math.max(MIN_W, width + dx);
                                break;

                            case "nw":
                                width = Math.max(MIN_W, width - dx);
                                x = original.x + (original.width - width);
                                break;
                        }

                        const scale = width / original.width;
                        const newFontSize = original.fontSize * scale;
                        const {height} = measureTextSize(original.text, newFontSize)

                        return {
                            ...shape,
                            x,
                            y,
                            width,
                            height,
                            fontSize: newFontSize
                        };
                    }


                    default:
                        return shape;
                }
            })
        );
    }

    return {
        shapes,
        currentShape,
        addShape,
        addCurrentShape,
        updateShape,
        removeShapes,
        moveShapes,
        resizeShapes,
        getShapeById
    }
}