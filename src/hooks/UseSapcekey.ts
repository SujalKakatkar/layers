import {useEffect, useRef, useState} from "react";
import {editorFocus} from "./useEditorFocus";

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
            // 🔥 ignore typing in normal inputs AND Monaco editor
            if(isTypingTarget(e.target)) return;
            if(editorFocus.active) return;

            if(e.code === "Space" && !pressedRef.current) {
                e.preventDefault();
                pressedRef.current = true;
                setPressed(true);
            }
        };

        const up = (e: KeyboardEvent) => {
            // Always release on keyup so we don't get stuck in pan mode
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