import { useRef, useState } from "react";
import type { ConnectorDraft, ConnectorSide, Point, Shape } from "../types/types";
import { getHoveredDot, getClosestSidePair, getConnectionPoint } from "../helpers/connectorHelpers";
import { getShapeAtPoint } from "../helpers/getShapeAtPoint";

export function useConnector() {
    const [draft, setDraft] = useState<ConnectorDraft | null>(null);
    /** Shape currently being hovered while dragging to show as target */
    const [targetShapeId, setTargetShapeId] = useState<string | null>(null);
    /** Shape whose connection dots should be shown (hover without dragging) */
    const [dotShapeId, setDotShapeId] = useState<string | null>(null);

    const isDraggingRef = useRef(false);

    /**
     * Called at the top of selectTool.onPointerDown BEFORE normal select logic.
     * Returns true if it consumed the event (user clicked a connection dot).
     */
    function onPointerDown(point: Point, shapes: Shape[]): boolean {
        // Look through all shapes for a hovered connection dot
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            const side = getHoveredDot(point, shape, 12);
            if (side !== null) {
                isDraggingRef.current = true;
                setDraft({
                    fromShapeId: shape.id,
                    fromSide: side,
                    toWorldPoint: point,
                });
                setTargetShapeId(null);
                return true; // consumed — skip selection/move logic
            }
        }
        return false;
    }

    /**
     * Always call from onPointerMove.
     * When dragging: updates preview line endpoint + detects target shape.
     * When idle: updates which shape's dots are shown.
     */
    function onPointerMove(point: Point, shapes: Shape[]) {
        if (isDraggingRef.current && draft) {
            setDraft(prev => prev ? { ...prev, toWorldPoint: point } : null);

            // Detect target shape (exclude source)
            const hitId = getShapeAtPoint(point.x, point.y, shapes);
            setTargetShapeId(hitId !== draft.fromShapeId ? hitId : null);
            return;
        }

        // Idle hover — detect if near any dot to show indicators
        for (let i = shapes.length - 1; i >= 0; i--) {
            const side = getHoveredDot(point, shapes[i], 14);
            if (side !== null) {
                setDotShapeId(shapes[i].id);
                return;
            }
        }
        // Also show dots when hovering a shape body
        const hitId = getShapeAtPoint(point.x, point.y, shapes);
        setDotShapeId(hitId);
    }

    /**
     * Always call from onPointerUp.
     * Completes the connector if a valid target shape is hovered.
     * Returns { fromShapeId, fromSide, toShapeId, toSide } if connector should be created, else null.
     */
    function onPointerUp(
        point: Point,
        shapes: Shape[]
    ): {
        fromShapeId: string;
        fromSide: ConnectorSide;
        toShapeId: string;
        toSide: ConnectorSide;
    } | null {
        if (!isDraggingRef.current || !draft) return null;

        isDraggingRef.current = false;
        const savedDraft = draft;
        setDraft(null);
        setTargetShapeId(null);

        // Only require >= 2 shapes
        if (shapes.length < 2) return null;

        // Find target: prefer dot-level precision first, then shape body
        let toShape: Shape | undefined;
        let toSide: ConnectorSide | undefined;

        for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].id === savedDraft.fromShapeId) continue;
            const side = getHoveredDot(point, shapes[i], 14);
            if (side !== null) {
                toShape = shapes[i];
                toSide  = side;
                break;
            }
        }

        if (!toShape) {
            const hitId = getShapeAtPoint(point.x, point.y, shapes);
            if (hitId && hitId !== savedDraft.fromShapeId) {
                const candidate = shapes.find(s => s.id === hitId);
                if (candidate && candidate.type !== "text" && candidate.type !== "stroke") {
                    toShape = candidate;
                }
            }
        }

        if (!toShape) return null;

        const fromShape = shapes.find(s => s.id === savedDraft.fromShapeId);
        if (!fromShape) return null;

        // If precise side not determined, pick geometrically closest pair
        const pair = toSide
            ? { fromSide: savedDraft.fromSide, toSide }
            : getClosestSidePair(fromShape, toShape);

        return {
            fromShapeId: savedDraft.fromShapeId,
            fromSide: pair.fromSide,
            toShapeId: toShape.id,
            toSide:    pair.toSide,
        };
    }

    function cancelDrag() {
        isDraggingRef.current = false;
        setDraft(null);
        setTargetShapeId(null);
    }

    /** Expose draft endpoint as a Point (source anchor) for rendering */
    function getDraftStartPoint(shapes: Shape[]): Point | null {
        if (!draft) return null;
        const fromShape = shapes.find(s => s.id === draft.fromShapeId);
        if (!fromShape) return null;
        return getConnectionPoint(fromShape, draft.fromSide);
    }

    return {
        draft,
        targetShapeId,
        dotShapeId,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        cancelDrag,
        getDraftStartPoint,
    };
}
