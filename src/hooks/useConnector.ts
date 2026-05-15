import {useRef, useState} from "react";
import type {ConnectionState, ConnectionIntent, ConnectorSide, Point, Shape} from "../types/types";
import {getHoveredDot, getShapeAnchorPoint} from "../helpers/connectorHelpers";
import {getShapeAtPoint} from "../helpers/getShapeAtPoint";

function getOppositeSide(side: ConnectorSide): ConnectorSide {
    switch (side) {
        case "top": return "bottom";
        case "bottom": return "top";
        case "left": return "right";
        case "right": return "left";
    }
}

export function useConnector () {
    const [connectionState, setConnectionState] = useState<ConnectionState>({ mode: "idle" });
    const [dotShapeId, setDotShapeId] = useState<string | null>(null);

    const downPointRef = useRef<Point | null>(null);

    function generateGhostShape(sourceShape: Shape, side: ConnectorSide): Shape {
        // Use the shared anchor logic to find the starting point for the ghost
        const anchor = getShapeAnchorPoint(sourceShape, side);
        
        const distance = 80;
        const width = 120;
        const height = 80;
        
        let gx = 0;
        let gy = 0;

        const finalWidth = width;
        const finalHeight = height;

        if (sourceShape.type === "circle") {
            const r = 50;
            switch (side) {
                case "top":    gx = anchor.x; gy = anchor.y - distance - r; break;
                case "right":  gx = anchor.x + distance + r; gy = anchor.y; break;
                case "bottom": gx = anchor.x; gy = anchor.y + distance + r; break;
                case "left":   gx = anchor.x - distance - r; gy = anchor.y; break;
            }
            return {
                id: crypto.randomUUID(),
                type: "circle",
                cx: gx,
                cy: gy,
                r
            };
        }

        switch (side) {
            case "top":
                gx = anchor.x - width / 2;
                gy = anchor.y - distance - height;
                break;
            case "right":
                gx = anchor.x + distance;
                gy = anchor.y - height / 2;
                break;
            case "bottom":
                gx = anchor.x - width / 2;
                gy = anchor.y + distance;
                break;
            case "left":
                gx = anchor.x - distance - width;
                gy = anchor.y - height / 2;
                break;
        }

        return {
            id: crypto.randomUUID(),
            type: "rectangle", // we default to rectangle for text/stroke if any
            x: gx,
            y: gy,
            width: finalWidth,
            height: finalHeight
        };
    }

    function onPointerDown (point: Point, shapes: Shape[]): boolean {
        for(let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            if(shape.isGenerated) continue;
            const side = getHoveredDot(point, shape, 12);
            if(side !== null) {
                downPointRef.current = point;
                const ghostShape = generateGhostShape(shape, side);
                setConnectionState({
                    mode: "hover",
                    sourceId: shape.id,
                    side,
                    ghostShape
                });
                return true; 
            }
        }
        return false;
    }

    function onPointerMove (point: Point, shapes: Shape[]) {
        if (downPointRef.current) {
            const dp = downPointRef.current;
            const dist = Math.hypot(point.x - dp.x, point.y - dp.y);

            setConnectionState(prev => {
                if (prev.mode === "hover" && dist > 5) {
                    const hitId = getShapeAtPoint(point.x, point.y, shapes);
                    const targetShape = hitId ? shapes.find(s => s.id === hitId) : null;
                    const isGenerated = targetShape?.isGenerated;

                    return {
                        mode: "drag",
                        sourceId: prev.sourceId,
                        side: prev.side,
                        mouseX: point.x,
                        mouseY: point.y,
                        targetShapeId: (hitId !== prev.sourceId && !isGenerated) ? hitId : null
                    };
                } else if (prev.mode === "drag") {
                    const hitId = getShapeAtPoint(point.x, point.y, shapes);
                    const targetShape = hitId ? shapes.find(s => s.id === hitId) : null;
                    const isGenerated = targetShape?.isGenerated;

                    return {
                        ...prev,
                        mouseX: point.x,
                        mouseY: point.y,
                        targetShapeId: (hitId !== prev.sourceId && !isGenerated) ? hitId : null
                    };
                }
                return prev;
            });
            return;
        }

        // Idle detection
        let foundHover = false;
        for(let i = shapes.length - 1; i >= 0; i--) {
            if(shapes[i].isGenerated) continue;
            const side = getHoveredDot(point, shapes[i], 14);
            if(side !== null) {
                setDotShapeId(shapes[i].id);
                setConnectionState({
                    mode: "hover",
                    sourceId: shapes[i].id,
                    side,
                    ghostShape: generateGhostShape(shapes[i], side)
                });
                foundHover = true;
                break;
            }
        }

        if (!foundHover) {
            setConnectionState({ mode: "idle" });
            const hitId = getShapeAtPoint(point.x, point.y, shapes);
            const targetShape = hitId ? shapes.find(s => s.id === hitId) : null;
            setDotShapeId(targetShape && !targetShape.isGenerated ? hitId : null);
        }
    }

    function onPointerUp (point: Point, shapes: Shape[]): ConnectionIntent {
        const state = connectionState;
        downPointRef.current = null;

        if (state.mode === "idle") return null;

        if (state.mode === "hover") {
            // Click without drag -> Quick Create
            setConnectionState({ mode: "idle" });
            return {
                type: "create",
                sourceId: state.sourceId,
                side: state.side,
                newShape: state.ghostShape
            };
        }

        if (state.mode === "drag") {
            setConnectionState({ mode: "idle" });

            if (shapes.length < 2) return null;

            let toShape: Shape | undefined;
            let toSide: ConnectorSide | undefined;

            for(let i = shapes.length - 1; i >= 0; i--) {
                if(shapes[i].id === state.sourceId || shapes[i].isGenerated) continue;
                const side = getHoveredDot(point, shapes[i], 14);
                if(side !== null) {
                    toShape = shapes[i];
                    toSide = side;
                    break;
                }
            }

            if(!toShape) {
                const hitId = getShapeAtPoint(point.x, point.y, shapes);
                if(hitId && hitId !== state.sourceId) {
                    const candidate = shapes.find(s => s.id === hitId);
                    if(candidate && candidate.type !== "text" && candidate.type !== "stroke" && !candidate.isGenerated) {
                        toShape = candidate;
                    }
                }
            }

            if(!toShape) return null;

            // Connect using the side logic: hovered side -> opposite side
            // or if dropping on a specific dot, use that side.
            return {
                type: "connect",
                fromShapeId: state.sourceId,
                fromSide: state.side,
                toShapeId: toShape.id,
                toSide: toSide || getOppositeSide(state.side),
            };
        }

        return null;
    }

    function cancelDrag () {
        downPointRef.current = null;
        setConnectionState({ mode: "idle" });
    }

    return {
        connectionState,
        dotShapeId,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        cancelDrag
    };
}
