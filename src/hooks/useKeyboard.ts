import {useEffect} from "react";
import type {Shape, Tools} from "../types/types";

/**
 * Returns true when focus is inside a text-editing target
 * (input, textarea, or contenteditable element).
 * Mirrors the guard already used in useSpaceKey.
 */
function isTypingTarget (target: EventTarget | null): boolean {
    if(!(target instanceof HTMLElement)) return false;
    return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
    );
}

type UseKeyboardOptions = {
    /** Currently selected shape IDs */
    selectedIds: string[];
    /** Whether a text shape is being edited right now */
    isEditingText: boolean;
    /** Remove shapes by IDs (with history) */
    removeShapes: (ids: string[]) => void;
    /** Undo last action */
    undo: () => void;
    /** Redo last undone action */
    redo: () => void;
    /**
     * Move shapes by (dx, dy) WITHOUT writing to history.
     * Used for the incremental per-keydown step.
     */
    moveShapes: (ids: string[], dx: number, dy: number, options?: {skipHistory?: boolean}) => void;
    /**
     * Write a snapshot to history BEFORE moving, so the
     * arrow-key move sequence is undoable as a single step.
     * Mirrors the hasSavedMoveHistoryRef pattern in useSelectArea.
     */
    updateShapes: (updater: (prev: Shape[]) => Shape[]) => void;
    /** Clear the current selection (call onSelect([])) */
    clearSelection: () => void;
    /** Finish text editing if active */
    finishText: () => string | undefined;
    /** Copy selected shapes */
    copyShapes?: (ids: string[]) => void;
    /** Paste copied shapes */
    pasteShapes?: () => string[];
    /** Duplicate selected shapes */
    duplicateShapes?: (ids: string[]) => string[];
    /** Group shapes */
    groupShapes?: (ids: string[]) => void;
    /** Ungroup shapes */
    ungroupShapes?: (ids: string[]) => void;
    /** Select all shapes on canvas */
    selectAll?: () => void;
    /** Select specific shapes */
    setSelectedIds?: (ids: string[]) => void;
    /** Update active tool */
    setTool?: (tool: Tools) => void;
};

/** px moved per arrow-key press (in world/canvas coordinates) */
const ARROW_STEP = 4;

export function useKeyboard ({
    selectedIds,
    isEditingText,
    removeShapes,
    undo,
    redo,
    moveShapes,
    updateShapes,
    clearSelection,
    finishText,
    copyShapes,
    pasteShapes,
    duplicateShapes,
    groupShapes,
    ungroupShapes,
    selectAll,
    setSelectedIds,
    setTool,
}: UseKeyboardOptions) {
    useEffect(() => {
        // Track whether we have already saved the pre-move history snapshot
        // for the current arrow-key "session".  Reset on keyup of any arrow key.
        let savedArrowHistory = false;

        function handleKeyDown (e: KeyboardEvent) {
            // Never steal events from text inputs / contenteditable areas
            if(isTypingTarget(e.target)) return;

            const ctrl = e.ctrlKey || e.metaKey;

            // ── Undo / Redo ──────────────────────────────────────────────
            if(ctrl && e.shiftKey && e.code === "KeyZ") {
                e.preventDefault();
                redo();
                return;
            }

            if(ctrl && e.code === "KeyZ") {
                e.preventDefault();
                undo();
                return;
            }

            // Ctrl+Y is an alternative redo shortcut (Windows convention)
            if(ctrl && e.code === "KeyY") {
                e.preventDefault();
                redo();
                return;
            }

            // ── Delete / Backspace ───────────────────────────────────────
            if(
                (e.code === "Delete" || e.code === "Backspace") &&
                selectedIds.length > 0 &&
                !isEditingText
            ) {
                e.preventDefault();
                removeShapes(selectedIds);
                clearSelection();
                return;
            }

            // ── Escape ───────────────────────────────────────────────────
            if(e.code === "Escape") {
                if(isEditingText) {
                    finishText();
                } else {
                    clearSelection();
                }
                return;
            }

            // ── Common Actions: Copy, Paste, Select All, Duplicate ──────
            if(ctrl && e.code === "KeyC" && selectedIds.length > 0 && !isEditingText) {
                e.preventDefault();
                copyShapes?.(selectedIds);
                return;
            }

            if(ctrl && e.code === "KeyV" && !isEditingText) {
                e.preventDefault();
                const newIds = pasteShapes?.();
                if(newIds && newIds.length > 0) {
                    setSelectedIds?.(newIds);
                }
                return;
            }

            if(ctrl && e.code === "KeyA" && !isEditingText) {
                e.preventDefault();
                selectAll?.();
                return;
            }

            if(ctrl && e.code === "KeyD" && selectedIds.length > 0 && !isEditingText) {
                e.preventDefault();
                const newIds = duplicateShapes?.(selectedIds);
                if(newIds && newIds.length > 0) {
                    setSelectedIds?.(newIds);
                }
                return;
            }

            if(ctrl && e.shiftKey && e.code === "KeyG" && selectedIds.length > 0 && !isEditingText) {
                e.preventDefault();
                ungroupShapes?.(selectedIds);
                return;
            }

            if(ctrl && !e.shiftKey && e.code === "KeyG" && selectedIds.length > 1 && !isEditingText) {
                e.preventDefault();
                groupShapes?.(selectedIds);
                return;
            }

            // ── Tool Switching ───────────────────────────────────────────
            if(!ctrl && !isEditingText) {
                const keyToToolMap: Record<string, Tools> = {
                    KeyV: "select",
                    KeyR: "rectangle",
                    KeyC: "circle",
                    KeyP: "pen",
                    KeyT: "text",
                };

                const toolToSwitch = keyToToolMap[e.code];
                if(toolToSwitch) {
                    e.preventDefault();
                    setTool?.(toolToSwitch);
                    return;
                }
            }

            // ── Arrow keys (move selected shapes) ────────────────────────
            if(selectedIds.length === 0 || isEditingText) return;

            let dx = 0;
            let dy = 0;

            switch(e.code) {
                case "ArrowLeft":
                    dx = -ARROW_STEP;
                    break;
                case "ArrowRight":
                    dx = ARROW_STEP;
                    break;
                case "ArrowUp":
                    dy = -ARROW_STEP;
                    break;
                case "ArrowDown":
                    dy = ARROW_STEP;
                    break;
                default:
                    return; // not an arrow key — ignore
            }

            e.preventDefault(); // prevent page scroll

            // On the first arrow keydown in a sequence, write a history
            // snapshot so the whole move run is one undoable step.
            if(!savedArrowHistory) {
                updateShapes((prev) => structuredClone(prev));
                savedArrowHistory = true;
            }

            moveShapes(selectedIds, dx, dy, {skipHistory: true});
        }

        function handleKeyUp (e: KeyboardEvent) {
            // Reset the history-saved flag when the user lifts any arrow key
            // so the next press starts a fresh undo-able action.
            if(
                e.code === "ArrowLeft" ||
                e.code === "ArrowRight" ||
                e.code === "ArrowUp" ||
                e.code === "ArrowDown"
            ) {
                savedArrowHistory = false;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [
        selectedIds,
        isEditingText,
        removeShapes,
        undo,
        redo,
        moveShapes,
        updateShapes,
        clearSelection,
        finishText,
        copyShapes,
        pasteShapes,
        duplicateShapes,
        groupShapes,
        ungroupShapes,
        selectAll,
        setSelectedIds,
        setTool,
    ]);
}
