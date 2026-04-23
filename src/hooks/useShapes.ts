import {useCallback, useState, useEffect} from "react"
import type {Connector, ConnectorSide, HandleType, Shape, Rectangle, Circle, Stroke, Text} from "../types/types"
import {measureTextSize} from "../helpers/measureTextSize"
import {getSelectionBounds} from "../canvas/selectArea"

type LayerState = {
    elements: Shape[];
    connectors: Connector[];
}

type HistoryState = {
    past: LayerState[];
    present: LayerState;
    future: LayerState[];
}

export function useShapes (canvasId: string = "default") {
    const [history, setHistory] = useState<HistoryState>(() => {
        try {
            const savedAll = localStorage.getItem("layer-canvases");
            if(savedAll) {
                const parsedAll = JSON.parse(savedAll);
                if(parsedAll && typeof parsedAll === "object" && parsedAll[canvasId]) {
                    const parsed = parsedAll[canvasId];
                    return {
                        past: parsed.history || [],
                        present: {
                            elements: parsed.elements || [],
                            connectors: parsed.connectors || []
                        },
                        future: parsed.future || []
                    };
                }
            }
        } catch(error) {
            console.error("Failed to load shapes from localStorage", error);
        }

        return {
            past: [],
            present: {elements: [], connectors: []},
            future: []
        };
    });

    useEffect(() => {
        try {
            const savedAll = localStorage.getItem("layer-canvases");
            if(savedAll) {
                const parsedAll = JSON.parse(savedAll);
                if(parsedAll && typeof parsedAll === "object" && parsedAll[canvasId]) {
                    const parsed = parsedAll[canvasId];
                    setHistory({
                        past: parsed.history || [],
                        present: {
                            elements: parsed.elements || [],
                            connectors: parsed.connectors || []
                        },
                        future: parsed.future || []
                    });
                    return;
                }
            }
        } catch(error) {
            console.error("Failed to load shapes on canvas change", error);
        }

        setHistory({past: [], present: {elements: [], connectors: []}, future: []});
    }, [canvasId]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const fullState = {
                elements: history.present.elements,
                connectors: history.present.connectors,
                history: history.past,
                future: history.future
            };

            try {
                const savedAll = localStorage.getItem("layer-canvases");
                const parsedAll = savedAll ? JSON.parse(savedAll) : {};
                parsedAll[canvasId] = fullState;
                localStorage.setItem("layer-canvases", JSON.stringify(parsedAll));
            } catch(err) {
                console.error("Failed to sync persistence", err);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [history, canvasId]);

    const [currentShape, setCurrentShape] = useState<Shape | null>(null)
    const [clipboard, setClipboard] = useState<Shape[]>([])

    // --------------- SHAPES -------------

    function updateShapes (
        updater: (prevShapes: Shape[]) => Shape[],
        options?: {skipHistory?: boolean}
    ) {
        setHistory(prev => {
            const nextElements = updater(prev.present.elements);
            if(options?.skipHistory) {
                return {
                    ...prev,
                    present: {
                        ...prev.present,
                        elements: nextElements
                    }
                };
            }
            return {
                past: [...prev.past, structuredClone(prev.present)],
                present: {elements: nextElements, connectors: prev.present.connectors},
                future: []
            };
        });
    }

    // Add shape
    function addShape (shape: Shape, options?: {skipHistory?: boolean}) {
        updateShapes(prevShapes => [...prevShapes, shape], options)
    }

    function addCurrentShape (shape: Shape | null) {
        setCurrentShape(shape)
    }

    function updateShape (id: string, updater: (shape: Shape) => Shape, options?: {skipHistory?: boolean}) {
        updateShapes(prevShapes =>
            prevShapes.map(shape =>
                shape.id === id ? updater(shape) : shape
            ), options
        )
    }

    // Remove shapes
    function removeShapes (ids: string[], options?: {skipHistory?: boolean}) {
        setHistory(prev => {
            const nextElements = prev.present.elements.filter(shape => !ids.includes(shape.id));
            const nextConnectors = prev.present.connectors.filter(c => !ids.includes(c.fromShapeId) && !ids.includes(c.toShapeId));

            if(options?.skipHistory) {
                return {
                    ...prev,
                    present: {
                        elements: nextElements,
                        connectors: nextConnectors
                    }
                };
            }
            return {
                past: [...prev.past, structuredClone(prev.present)],
                present: {elements: nextElements, connectors: nextConnectors},
                future: []
            };
        });
    }

    // Move shapes
    function moveShapes (
        ids: string[],
        dx: number,
        dy: number,
        options?: {skipHistory?: boolean}
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

    // Copy shapes
    function copyShapes (ids: string[]) {
        const selected = history.present.elements.filter(s => ids.includes(s.id));
        setClipboard(structuredClone(selected));
    }

    // Paste shapes
    function pasteShapes () {
        if(clipboard.length === 0) return [];

        const offset = 20;
        const pasted: Shape[] = clipboard.map(shape => {
            const newId = crypto.randomUUID();
            switch(shape.type) {
                case "rectangle":
                case "text":
                    return {...shape, id: newId, x: shape.x + offset, y: shape.y + offset};
                case "circle":
                    return {...shape, id: newId, cx: shape.cx + offset, cy: shape.cy + offset};
                case "stroke":
                    return {
                        ...shape,
                        id: newId,
                        points: shape.points.map(p => ({x: p.x + offset, y: p.y + offset}))
                    };
                default:
                    return shape;
            }
        });

        setClipboard(pasted);
        updateShapes(prevShapes => [...prevShapes, ...pasted]);
        return pasted.map(s => s.id);
    }

    // Duplicate shapes
    function duplicateShapes (ids: string[], options?: {offset?: number; skipHistory?: boolean}) {
        const toDuplicate = history.present.elements.filter(s => ids.includes(s.id));
        if(toDuplicate.length === 0) return [];

        const offset = options?.offset ?? 20;
        const duplicated: Shape[] = toDuplicate.map(shape => {
            const newId = crypto.randomUUID();
            switch(shape.type) {
                case "rectangle":
                case "text":
                    return {...shape, id: newId, x: shape.x + offset, y: shape.y + offset};
                case "circle":
                    return {...shape, id: newId, cx: shape.cx + offset, cy: shape.cy + offset};
                case "stroke":
                    return {
                        ...shape,
                        id: newId,
                        points: shape.points.map(p => ({x: p.x + offset, y: p.y + offset}))
                    };
                default:
                    return shape;
            }
        });

        updateShapes(prevShapes => [...prevShapes, ...duplicated], {skipHistory: options?.skipHistory});
        return duplicated.map(s => s.id);
    }

    // Bring to front
    function bringToFront (ids: string[]) {
        updateShapes(prevShapes => {
            const affected = prevShapes.filter(s => ids.includes(s.id));
            const unaffected = prevShapes.filter(s => !ids.includes(s.id));
            return [...unaffected, ...affected];
        });
    }

    // Send to back
    function sendToBack (ids: string[]) {
        updateShapes(prevShapes => {
            const affected = prevShapes.filter(s => ids.includes(s.id));
            const unaffected = prevShapes.filter(s => !ids.includes(s.id));
            return [...affected, ...unaffected];
        });
    }

    // Get shape
    function getShapeById (id: string) {
        return history.present.elements.find(shape => shape.id === id)
    }

    //resize shapes
    function resizeShapes (
        ids: string[],
        handle: HandleType,
        dx: number,
        dy: number,
        initialMap: Map<string, Shape>,
        options?: {skipHistory?: boolean}
    ) {
        if(ids.length > 1) {
            const initialShapes = Array.from(initialMap.values());
            const initialBounds = getSelectionBounds(initialShapes, ids);

            if(initialBounds) {
                let {x: groupX, y: groupY, width: groupWidth, height: groupHeight} = initialBounds;

                switch(handle) {
                    case "se":
                        groupWidth += dx; groupHeight += dy; break;
                    case "sw":
                        groupX += dx; groupWidth -= dx; groupHeight += dy; break;
                    case "ne":
                        groupY += dy; groupHeight -= dy; groupWidth += dx; break;
                    case "nw":
                        groupX += dx; groupY += dy; groupWidth -= dx; groupHeight -= dy; break;
                }

                if(groupWidth < 0) {groupX += groupWidth; groupWidth = Math.abs(groupWidth);}
                if(groupHeight < 0) {groupY += groupHeight; groupHeight = Math.abs(groupHeight);}

                const initialW = initialBounds.width || 1;
                const initialH = initialBounds.height || 1;
                const scaleX = groupWidth / initialW;
                const scaleY = groupHeight / initialH;

                updateShapes(prevShapes =>
                    prevShapes.map(shape => {
                        if(!ids.includes(shape.id)) return shape;

                        const original = initialMap.get(shape.id);
                        if(!original) return shape;

                        switch(shape.type) {
                            case "rectangle":
                                if(original.type !== "rectangle") return shape;
                                return {
                                    ...shape,
                                    x: groupX + (original.x - initialBounds.x) * scaleX,
                                    y: groupY + (original.y - initialBounds.y) * scaleY,
                                    width: original.width * scaleX,
                                    height: original.height * scaleY
                                };
                            case "circle":
                                if(original.type !== "circle") return shape;
                                return {
                                    ...shape,
                                    cx: groupX + (original.cx - initialBounds.x) * scaleX,
                                    cy: groupY + (original.cy - initialBounds.y) * scaleY,
                                    r: original.r * Math.min(scaleX, scaleY)
                                };
                            case "stroke":
                                if(original.type !== "stroke") return shape;
                                return {
                                    ...shape,
                                    points: original.points.map(p => ({
                                        x: groupX + (p.x - initialBounds.x) * scaleX,
                                        y: groupY + (p.y - initialBounds.y) * scaleY
                                    }))
                                };
                            case "text": {
                                if(original.type !== "text") return shape;
                                return {
                                    ...shape,
                                    x: groupX + (original.x - initialBounds.x) * scaleX,
                                    y: groupY + (original.y - initialBounds.y) * scaleY,
                                    // text NO LONGER scales
                                };
                            }
                            default:
                                return shape;
                        }
                    }), options
                );
            }
            return;
        }

        updateShapes(prevShapes =>
            prevShapes.map(shape => {
                if(!ids.includes(shape.id)) return shape;

                switch(shape.type) {
                    case "rectangle": {
                        const original = initialMap.get(shape.id);
                        if(!original || original.type !== "rectangle") return shape;

                        let {x, y, width, height} = original;

                        switch(handle) {
                            case "se": width += dx; height += dy; break;
                            case "sw": x += dx; width -= dx; height += dy; break;
                            case "ne": y += dy; height -= dy; width += dx; break;
                            case "nw": x += dx; y += dy; width -= dx; height -= dy; break;
                        }

                        if(width < 0) {x += width; width = Math.abs(width);}
                        if(height < 0) {y += height; height = Math.abs(height);}

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
                            case "se": width += dx; height += dy; break;
                            case "sw": x += dx; width -= dx; height += dy; break;
                            case "ne": y += dy; height -= dy; width += dx; break;
                            case "nw": x += dx; y += dy; width -= dx; height -= dy; break;
                        }

                        if(width < 0) {x += width; width = Math.abs(width);}
                        if(height < 0) {y += height; height = Math.abs(height);}

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
                            case "se": width += dx; height += dy; break;
                            case "sw": x += dx; width -= dx; height += dy; break;
                            case "ne": y += dy; height -= dy; width += dx; break;
                            case "nw": x += dx; y += dy; width -= dx; height -= dy; break;
                        }

                        if(width < 0) {x += width; width = Math.abs(width);}
                        if(height < 0) {y += height; height = Math.abs(height);}

                        const baseWidth = maxX - minX || 1;
                        const baseHeight = maxY - minY || 1;

                        const scaleX = width / baseWidth;
                        const scaleY = height / baseHeight;

                        const newPoints = points.map(p => ({
                            x: x + (p.x - minX) * scaleX,
                            y: y + (p.y - minY) * scaleY
                        }));

                        return {...shape, points: newPoints};
                    }

                    case "text": {
                        const original = initialMap.get(shape.id);
                        if(!original || original.type !== "text") return shape;

                        // text resizing is disabled, handles don't appear.
                        // we return original shape dimensions intact.
                        return {...shape, x: original.x, y: original.y, width: original.width, height: original.height};
                    }

                    default:
                        return shape;
                }
            }), options
        )
    }

    function rotateShapes(
        ids: string[],
        angleDelta: number,
        groupCenterX: number,
        groupCenterY: number,
        initialMap: Map<string, Shape>,
        options?: {skipHistory?: boolean}
    ) {
        updateShapes(prevShapes => 
            prevShapes.map(shape => {
                if(!ids.includes(shape.id)) return shape;
                
                const original = initialMap.get(shape.id);
                if(!original) return shape;

                const cosA = Math.cos(angleDelta);
                const sinA = Math.sin(angleDelta);

                const rotatePoint = (px: number, py: number) => {
                    const dx = px - groupCenterX;
                    const dy = py - groupCenterY;
                    return {
                        x: groupCenterX + dx * cosA - dy * sinA,
                        y: groupCenterY + dx * sinA + dy * cosA
                    };
                };

                switch (shape.type) {
                    case "rectangle":
                    case "text": {
                        const orig = original as Rectangle | Text;
                        const cx = orig.x + orig.width / 2;
                        const cy = orig.y + orig.height / 2;
                        const newCenter = rotatePoint(cx, cy);
                        return {
                            ...shape,
                            x: newCenter.x - orig.width / 2,
                            y: newCenter.y - orig.height / 2,
                            rotation: (orig.rotation || 0) + angleDelta
                        };
                    }
                    case "circle": {
                        const orig = original as Circle;
                        const newCenter = rotatePoint(orig.cx, orig.cy);
                        return {
                            ...shape,
                            cx: newCenter.x,
                            cy: newCenter.y,
                            rotation: (orig.rotation || 0) + angleDelta
                        };
                    }
                    case "stroke": {
                        const orig = original as Stroke;
                        const newPoints = orig.points.map(p => {
                            const newP = rotatePoint(p.x, p.y);
                            return { x: newP.x, y: newP.y };
                        });
                        return {
                            ...shape,
                            points: newPoints
                        };
                    }
                    default:
                        return shape;
                }
            }), options
        );
    }

    function groupShapes (ids: string[]) {
        if(ids.length <= 1) return;
        const groupId = crypto.randomUUID();
        updateShapes(prevShapes =>
            prevShapes.map(shape =>
                ids.includes(shape.id) ? {...shape, groupId} : shape
            )
        );
    }

    function ungroupShapes (ids: string[]) {
        updateShapes(prevShapes =>
            prevShapes.map(shape =>
                ids.includes(shape.id) ? {...shape, groupId: undefined} : shape
            )
        );
    }


    // --------------- CONNECTORS -------------

    function addConnector (
        fromShapeId: string,
        fromSide: ConnectorSide,
        toShapeId: string,
        toSide: ConnectorSide
    ) {
        if(fromShapeId === toShapeId) return;
        const connector: Connector = {
            id: crypto.randomUUID(),
            fromShapeId,
            fromSide,
            toShapeId,
            toSide,
        };
        setHistory(prev => {
            return {
                past: [...prev.past, structuredClone(prev.present)],
                present: {
                    elements: prev.present.elements,
                    connectors: [...prev.present.connectors, connector]
                },
                future: []
            };
        });
    }

    function removeConnector (id: string) {
        setHistory(prev => {
            return {
                past: [...prev.past, structuredClone(prev.present)],
                present: {
                    elements: prev.present.elements,
                    connectors: prev.present.connectors.filter(c => c.id !== id)
                },
                future: []
            };
        });
    }

    function addShapeWithConnector(shape: Shape, connector: Connector) {
        setHistory(prev => {
            return {
                past: [...prev.past, structuredClone(prev.present)],
                present: {
                    elements: [...prev.present.elements, shape],
                    connectors: [...prev.present.connectors, connector]
                },
                future: []
            };
        });
    }

    // --------------- UNDO / REDO -------------

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
        shapes: history.present.elements,
        connectors: history.present.connectors,
        currentShape,
        clipboard,
        addShape,
        addCurrentShape,
        updateShape,
        updateShapes,
        removeShapes,
        moveShapes,
        resizeShapes,
        rotateShapes,
        getShapeById,
        copyShapes,
        pasteShapes,
        duplicateShapes,
        bringToFront,
        sendToBack,
        groupShapes,
        ungroupShapes,
        addConnector,
        removeConnector,
        addShapeWithConnector,
        undo,
        redo
    }
}