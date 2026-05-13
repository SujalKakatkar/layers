import {useLayoutEffect} from "react";

export function useCanvasResize (
    shapesRef: React.RefObject<HTMLCanvasElement | null>,
    connectorsRef: React.RefObject<HTMLCanvasElement | null>,
    overlayRef: React.RefObject<HTMLCanvasElement | null>
) {
    useLayoutEffect(() => {

        function resize () {
            const dpr = window.devicePixelRatio || 1;

            const width = window.innerWidth;
            const height = window.innerHeight;

            const refs = [shapesRef, connectorsRef, overlayRef];

            refs.forEach(ref => {
                const canvas = ref.current;
                if (!canvas) return;

                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                canvas.width = Math.floor(width * dpr);
                canvas.height = Math.floor(height * dpr);

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                // Reset + scale for retina displays
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            });
        }

        resize();

        window.addEventListener("resize", resize);

        return () => window.removeEventListener("resize", resize);

    }, [shapesRef, connectorsRef, overlayRef]);
}