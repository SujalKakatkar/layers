import {useEffect, useRef, useState} from "react";

function isTypingTarget (target: EventTarget | null) {
    if(!(target instanceof HTMLElement)) return false;

    return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
    );
}

export function useSpaceKey () {
    const pressedRef = useRef(false);
    const [pressed, setPressed] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {

            if(isTypingTarget(e.target)) return; // 🔥 ignore typing

            if(e.code === "Space" && !pressedRef.current) {
                e.preventDefault();
                pressedRef.current = true;
                setPressed(true);
            }
        };

        const up = (e: KeyboardEvent) => {

            if(isTypingTarget(e.target)) return; // 🔥 ignore typing

            if(e.code === "Space") {
                pressedRef.current = false;
                setPressed(false);
            }
        };

        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);

        return () => {
            window.removeEventListener("keydown", down);
            window.removeEventListener("keyup", up);
        };
    }, []);

    return {pressed, pressedRef};
}