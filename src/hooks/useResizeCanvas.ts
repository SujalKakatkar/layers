import {useEffect} from "react";

export function useCanvasResize (
    canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
    useEffect(() => {

        function resize () {
            const canvas = canvasRef.current;
            if(!canvas) return;

            const dpr = window.devicePixelRatio || 1;

            const width = window.innerWidth;
            const height = window.innerHeight;

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);

            const ctx = canvas.getContext("2d");
            if(!ctx) return;

            // Reset + scale for retina displays
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resize();

        window.addEventListener("resize", resize);

        return () => window.removeEventListener("resize", resize);

    }, [canvasRef]);
}