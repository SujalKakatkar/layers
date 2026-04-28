/**
 * Shared module-level flag that tracks whether Monaco Editor
 * currently has text focus. This avoids prop-drilling the
 * focus state through the entire component tree.
 *
 * CodePanel sets it via Monaco's onDidFocusEditorText /
 * onDidBlurEditorText events. useKeyboard reads it before
 * handling any keyboard shortcut.
 */
export const editorFocus = {
    active: false,
};
