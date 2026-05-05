# Drawing Board Technical Architecture Analysis

This document provides a detailed breakdown of the application's file structure, the responsibilities of each module, and a description of the key functions that drive the drawing engine and user interface.

## 1. Page Orchestration & Global State

### `src/pages/Canvas.tsx`
The central page component that manages the lifecycle of a specific drawing session.
- **Responsibilities**: Data fetching, title management, share logic, unsaved changes tracking, and keyboard shortcuts for saving.
- **Key Functions**:
    - `fetchCanvas(id)`: Retrieves private canvas data and hydrates the store.
    - `handleSave()`: Collects current state and persists it to the backend.
    - `handleShare()`: Generates public sharing tokens.
    - `useEffect (unsaved tracking)`: Monitors JSON stringified snapshots to detect if changes have occurred since the last save.

### `src/store/useCanvasStore.ts`
A Zustand store managing canvas metadata and persistence status.
- **Responsibilities**: Loading states, canvas lists, and API wrapper calls.
- **Key Functions**:
    - `createCanvas(title)`: Initializes a new canvas record.
    - `updateCanvas(data)`: Sanitizes shape objects (removes runtime flags) and sends them to the server.
    - `revokeShareToken()`: Invalidates public access links.

### `src/store/useDiagramStore.ts`
A Zustand store acting as the bridge between manual drawing and generated "LayerScript" elements.
- **Responsibilities**: Shared state for elements, connectors, and generated code.

---

## 2. Drawing Engine & Logic

### `src/hooks/useShapes.ts`
The primary state manager for the manual drawing layer.
- **Responsibilities**: Maintains the "History Stack" (Undo/Redo) and provides CRUD operations for shapes and connectors.
- **Key Functions**:
    - `updateShapes(updater)`: Centralized state update logic that pushes the current state to the 'past' stack.
    - `undo()` / `redo()`: Manipulates the history stacks to traverse state snapshots.
    - `resizeShapes(ids, handle, dx, dy)`: Complex logic for scaling single or multiple shapes proportionally.
    - `duplicateShapes(ids)`: Clones shapes with a positional offset.

### `src/canvas/draw.ts`
The immediate-mode rendering engine.
- **Responsibilities**: Redrawing the entire canvas every frame based on the current state.
- **Key Functions**:
    - `drawScene(...)`: The entry point for rendering. Clears context, applies camera transforms (zoom/pan), and renders shapes, connectors, selection boxes, and ghosts in layers.
    - `renderShape(shape)`: Handles individual shape rotation and dispatches to specific drawing primitives.

### `src/canvas/shapes/`
A collection of low-level drawing functions.
- **`drawRect.ts`**: Draws rounded rectangles using quadratic curves.
- **`drawCircle.ts`**: Draws arcs for circular shapes.
- **`drawStroke.ts`**: Renders freehand pen lines.
- **`drawConnectors.ts`**: Handles Bezier curve pathing for lines connecting shapes.

---

## 3. Interaction & Tool Hooks

### `src/components/draw/WhiteBoard.tsx`
The main interactive component that captures pointer events and coordinates between different tool hooks.
- **Responsibilities**: Event delegation, coordinate translation (World vs. Screen), and UI overlays.
- **Key Functions**:
    - `onPointerDown/Move/Up`: Generic event handlers that dispatch to the active tool (select, rect, pen, etc.).
    - `drawScene Effect`: Triggers the redraw loop whenever state changes.

### `src/hooks/useSelectArea.ts`
Manages the "Selection" tool, including the marquee box and moving/resizing logic.
- **Key Functions**:
    - `startSelect(p)`: Identifies if a click hit a shape, a resize handle, or the background.
    - `updateSelect(e)`: Handles the heavy lifting of moving shapes or adjusting their dimensions in real-time.

### `src/hooks/useCamera.ts`
Handles the virtual camera (Panning and Zooming).
- **Key Functions**:
    - `pan(x, y)`: Updates the global offset.
    - `zoom(delta, target)`: Adjusts the scale factor centered on the mouse position.

### `src/hooks/useRectangle.ts`, `useCircle.ts`, `usePen.ts`
Specialized hooks for shape creation.
- **Key Functions**:
    - `startDraw(p)`: Initializes a new shape with an ID.
    - `draw(p)`: Updates dimensions/points as the user drags.
    - `endDraw()`: Finalizes the shape and adds it to the `useShapes` history.

---

## 4. API & Utility Layer

### `src/api/canvas.ts`
HTTP client for the backend services.
- **Key Functions**:
    - `getCanvas(id)`: Fetches private data.
    - `getSharedCanvas(token)`: Fetches public read-only data.
    - `updateCanvas(id, data)`: Persists JSON payloads to the database.

### `src/helpers/`
Pure utility functions for geometric and UI calculations.
- **`connectorHelpers.ts`**: Calculates Bezier control points and intersection points on shape perimeters.
- **`getShapeAtPoint.ts`**: Performs hit-testing to see which shape is under the cursor.
- **`measureTextSize.ts`**: Uses a temporary canvas context to measure text dimensions for auto-sizing.
- **`selectionTools.ts`**: Expands selection to include group members.

---

## 5. Summary Flow
1. **Interaction**: User clicks `WhiteBoard`.
2. **Translation**: `getWorldPoint` converts mouse coords to world coords based on `useCamera` scale/offset.
3. **Logic**: `useSelectArea` or a drawing hook (`useRectangle`) updates local state or `useShapes`.
4. **State**: `useShapes` updates the `history` and mirrors changes to `useDiagramStore`.
5. **Sync**: `Canvas.tsx` detects the change and marks the UI as "Unsaved".
6. **Render**: The `useEffect` in `WhiteBoard` calls `drawScene` in `draw.ts`, which repaints everything to the screen.
