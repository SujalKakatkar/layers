import {useRef, useState} from "react";
import type {Point} from '../types/types'

export function useCamera () {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({x: 0, y: 0})

    const isPanningRef = useRef(false)
    const lastPanPointRef = useRef<Point>({x: 0, y: 0})

    const startPan = (x: number, y: number) => {
        isPanningRef.current = true,
            lastPanPointRef.current = {x, y}
    }

    const pan = (x: number, y: number) => {
        if(!isPanningRef.current) return

        const dx = x - lastPanPointRef.current.x;
        const dy = y - lastPanPointRef.current.y;

        setOffset((prev) => ({
            x: prev.x + dx,
            y: prev.y + dy
        }))

        lastPanPointRef.current = {x, y}
    }
    const endPan = () => {
        isPanningRef.current = false
    }

    const zoom = (deltaY: number, canvas: HTMLCanvasElement) => {
        const zoomIntensity = 0.1;
        const direction = deltaY < 0 ? 1 : -1;

        const newScale = Math.min(4, Math.max(0.2, scale * (1 + direction * zoomIntensity)));

        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const wx = (cx - offset.x) / scale;
        const wy = (cy - offset.y) / scale;

        setScale(newScale);
        setOffset({
            x: cx - wx * newScale,
            y: cy - wy * newScale,
        });
    }

    return {
        scale,
        offset,
        setScale,
        setOffset,
        startPan,
        pan,
        endPan,
        zoom,
        isPanningRef
    }

}

import {useEffect} from "react";
export function useCameraSync(scale: number) {
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: scale }));
    }, [scale]);
}