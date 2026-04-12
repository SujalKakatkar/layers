import {useCallback, useState, useEffect} from "react"
import type {HandleType, Shape} from "../types/types"
import {measureTextSize} from "../helpers/measureTextSize"

type HistoryState = {
    past: Shape[][];
    present: Shape[];
    future: Shape[][];
}

export function useShapes () {
    const [history, setHistory] = useState<HistoryState>(() => {
        try {
            const saved = localStorage.getItem("layer-canvas");
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Load updated complete structure natively handling properties mapping seamlessly 
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    return {
                        past: parsed.history || [],
                        present: parsed.elements || [],
                        future: parsed.future || []
                    };
                }
                
                // Fallback catch seamlessly capturing the legacy structure
                if (Array.isArray(parsed)) {
                    return {
                        past: [],
                        present: parsed,
                        future: []
                    };
                }
            }
        } catch (error) {
            console.error("Failed to load shapes from localStorage", error);
        }

        return {
            past: [],
            present: [],
            future: []
        };
    });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const fullState = {
                elements: history.present,
                history: history.past,
                future: history.future
            };
            localStorage.setItem("layer-canvas", JSON.stringify(fullState));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [history]);

    // const shapes = history.present;

    const [currentShape, setCurrentShape] = useState<Shape | null>(null)

    function updateShapes (
        updater: (prevShapes: Shape[]) => Shape[],
        options?: { skipHistory?: boolean }
    ) {
        setHistory(prev => {
            const nextPresent = updater(prev.present);
            if (options?.skipHistory) {
                return {
                    ...prev,
                    present: nextPresent
                };
            }
            return {
                past: [...prev.past, structuredClone(prev.present)],
                present: nextPresent,
                future: []
            };
        });
    }

    // Add shape
    function addShape (shape: Shape, options?: { skipHistory?: boolean }) {
        updateShapes(prevShapes => [...prevShapes, shape], options)
    }
    //current shapes
    function addCurrentShape (shape: Shape | null) {
        setCurrentShape(shape)
    }

    function updateShape (id: string, updater: (shape: Shape) => Shape, options?: { skipHistory?: boolean }) {
        updateShapes(prevShapes =>
            prevShapes.map(shape =>
                shape.id === id ? updater(shape) : shape
            ), options
        )
    }

    // Remove shapes
    function removeShapes (ids: string[], options?: { skipHistory?: boolean }) {
        updateShapes(prevShapes =>
            prevShapes.filter(shape => !ids.includes(shape.id)), options
        )
    }

    // Move shapes
    function moveShapes (
        ids: string[],
        dx: number,
        dy: number,
        options?: { skipHistory?: boolean }
    ) {

        const updater = (prevShapes: Shape[]) =>
            prevShapes.map(shape => {
                if(!ids.includes(shape.id)) return shape;

                switch(shape.type) {
                    case "rectangle":
                        return {...shape, x: shape.x + dx, y: shape.y + dy};

                    case "circle":
                        return {...shape, cx: shape.cx + dx, cy: shape.cy + dy};

                    case "stroke":
                        return {
                            ...shape,
                            points: shape.points.map(p => ({
                                x: p.x + dx,
                                y: p.y + dy
                            }))
                        };

                    case "text":
                        return {...shape, x: shape.x + dx, y: shape.y + dy};

                    default:
                        return shape;
                }
            });

            updateShapes(updater, options);
    }
    // Get shape
    function getShapeById (id: string) {
        return history.present.find(shape => shape.id === id)
    }

    //resize shapes
    function resizeShapes (
        ids: string[],
        handle: HandleType,
        dx: number,
        dy: number,
        initialMap: Map<string, Shape>,
        options?: { skipHistory?: boolean }
    ) {
        updateShapes(prevShapes =>
            prevShapes.map(shape => {
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
            }), options
        )
    }

    //undo logic
    const undo = useCallback(() => {
        setHistory(prev => {
            if(prev.past.length === 0) return prev;

            const previous = prev.past[prev.past.length - 1];

            return {
                past: prev.past.slice(0, -1),
                present: structuredClone(previous),
                future: [structuredClone(prev.present), ...prev.future]
            };
        });
    }, []);
    //redo logic
    const redo = useCallback(() => {
        setHistory(prev => {
            if(prev.future.length === 0) return prev;

            const next = prev.future[0];

            return {
                past: [...prev.past, structuredClone(prev.present)],
                present: structuredClone(next),
                future: prev.future.slice(1)
            };
        });
    }, []);

    return {
        shapes: history.present,
        currentShape,
        addShape,
        addCurrentShape,
        updateShape,
        updateShapes,
        removeShapes,
        moveShapes,
        resizeShapes,
        getShapeById,
        undo,
        redo
    }
}