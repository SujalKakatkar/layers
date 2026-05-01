# Layer Technical Documentation

This document provides a technical overview of the "Layer" canvas-based diagram editor, derived strictly from the codebase analysis of the provided repository.

---

## 1. Overview

**Layer** is a specialized diagramming system that combines a free-form infinite canvas with a code-driven diagram generation engine. It allows users to manually draw shapes, create connectors, and write "LayerScript" (a domain-specific language) to programmatically generate and layout complex diagram structures.

**Key Features Observed in Code:**
- **Hybrid Canvas:** Supports both manually drawn shapes and code-generated diagram groups.
- **LayerScript Integration:** A side panel with a Monaco-based editor for defining diagrams via text.
- **Bidirectional Synchronization:** Synchronization between code lines and canvas elements.
- **Smart Connectors:** Auto-routing curved connectors between shapes with multiple anchor points.
- **Advanced Interaction:** Support for infinite pan/zoom, multi-shape selection, rotation, and group-level manipulation.

---

## 2. Canvas State Structure

The state is managed across a custom `useShapes` hook (for manual elements) and a Zustand store `useDiagramStore` (for generated elements and editor state).

**Manual State (from `useShapes.ts`):**
```ts id="rcvshf"
{
  history: {
    past: LayerState[],   // History for Undo
    present: {
      elements: Shape[],
      connectors: Connector[]
    },
    future: LayerState[]  // History for Redo
  },
  currentShape: Shape | null, // Shape currently being drawn
  clipboard: Shape[]          // For copy/paste
}
```

**Global Store (from `useDiagramStore.ts`):**
```ts id="rcvshf"
{
  generatedElements: Shape[],
  generatedConnectors: Connector[],
  generatedGroupOffset: { x: number, y: number },
  previousElements: Shape[],    // Used for reconciliation
  previousConnectors: Connector[],
  selectedNodeId: string | null, // For highlighting from code
  highlightedRange: { line: number, start: number, end: number } | null
}
```

---

## 3. Shape (Element) Model

Extracted from `src/types/types.ts`. All shapes share common properties like `id`, `groupId`, `rotation`, and `isGenerated`.

### Rectangle
```ts id="zd69cu"
{
  id: string,
  type: "rectangle",
  x: number,
  y: number,
  width: number,
  height: number,
  rotation?: number,
  isGenerated?: boolean,
  source?: { line: number, start: number, end: number }
}
```

### Circle
```ts id="zd69cu"
{
  id: string,
  type: "circle",
  cx: number, // Center X
  cy: number, // Center Y
  r: number,  // Radius
  rotation?: number,
  isGenerated?: boolean
}
```

### Text
```ts id="zd69cu"
{
  id: string,
  type: "text",
  x: number,
  y: number,
  text: string,
  fontSize: number,
  width: number,
  height: number,
  fontWeight?: string,
  textAlign?: "left" | "center" | "right",
  rotation?: number
}
```

### Stroke (Pen Tool)
```ts id="zd69cu"
{
  id: string,
  type: "stroke",
  points: { x: number, y: number }[],
  color: string,
  width: number
}
```

---

## 4. Connector Model

Connectors represent relationships between two shapes and are extracted from `src/types/types.ts`.

```ts id="3phg6y"
{
  id: string,
  fromShapeId: string,
  toShapeId: string,
  fromSide: "top" | "right" | "bottom" | "left",
  toSide: "top" | "right" | "bottom" | "left",
  isGenerated?: boolean
}
```

---

## 5. LayerScript / CodePanel

LayerScript is a text-based DSL implemented in `CodePanel.tsx` that allows defining nodes and connections.

**Parsing Rules:**
- **Rectangle Node:** `[Text Content]`
- **Circle Node:** `(Text Content)`
- **Default Node:** `Text Content` (defaults to rectangle)
- **Connection:** `NodeA => NodeB` (supports chaining: `A => B => C`)

**Implementation Details:**
- **Language Registration:** Uses Monaco Editor with a custom `layerscript` language definition.
- **Source Mapping:** Nodes store their line and character positions (`source` field) for bidirectional highlighting.
- **Reconciliation:** A reconciliation algorithm (`reconcile` function) compares the new layout with the previous state to preserve user-moved positions for existing nodes.

---

## 6. Layout System

The system includes a layout engine in `CodePanel.tsx` that automatically positions nodes defined in LayerScript.

**Algorithm Details:**
- **Graph Construction:** Builds an adjacency list and identifies "root" nodes (in-degree = 0).
- **Depth-First Search (DFS):** Assigns levels to nodes based on their depth in the tree structure.
- **Subtree-Aware Positioning:**
    - Recursive layout calculates vertical spacing based on the size of subtrees.
    - Parent nodes are centered vertically relative to their children.
- **Standard Spacing:** `spacingX = 250`, `spacingY = 120`.

---

## 7. Rendering System

The rendering pipeline is implemented in `src/canvas/draw.ts` using the HTML5 Canvas 2D API.

**Core Functions:**
- `drawRect`: Renders rounded rectangles (radius: 10px).
- `drawCircle`: Renders circles with support for centered text.
- `drawText`: Handles multi-line text with alignment support.
- `drawStroke`: Renders free-form lines from point arrays.
- `drawConnectors`: Renders curved Bézier paths between shapes.
- `drawConnectorPreview`: Previews connections during drag.
- `drawConnectionDots`: Renders interactive anchor points on shape edges.

**Aesthetics:**
- **Emerald Theme:** Uses `#10B981` for selection bounding boxes, handles, and active UI elements.
- **DPR Scaling:** Automatically handles high-DPI displays via `devicePixelRatio`.

---

## 8. Interaction Model

Defined in `WhiteBoard.tsx` and associated hooks.

- **Selection:** Supports individual click selection, area (marquee) selection, and group selection.
- **Drag & Move:**
    - Manual shapes are moved individually or in selected groups.
    - Generated diagrams are moved as a single assembly using a `generatedGroupOffset`.
- **Resize:** Handles 8-point resizing for rectangles and circles (Note: Text scaling is disabled).
- **Rotation:** Supports rotating shapes around their center or a group center.
- **Connectors:** Interactive creation by dragging from anchor points ("dots") on shapes.
- **Camera:** Infinite panning (Space + Drag) and zooming (Wheel/Pinch).

---

## 9. ID Strategy

- **Manual Elements:** Uses `crypto.randomUUID()` for unique identifiers.
- **Code-Generated Nodes:** Uses a deterministic strategy: `"node-" + slugified_text` (e.g., `[My Node]` becomes `node-my-node`).
- **Code-Generated Connectors:** Uses a composite ID: `"conn-" + fromId + "__" + toId`.

---

## 10. Data Flow

1.  **Code Input:** User types in `CodePanel`.
2.  **Parsing:** Text is parsed into a `ParsedDiagram` (nodes and edges).
3.  **Layout:** The engine assigns initial world coordinates to new nodes.
4.  **Reconciliation:** The system merges new nodes with the existing `previousElements` in the store to keep manual adjustments.
5.  **Store Update:** `setGeneratedElements` and `setGeneratedConnectors` update the Zustand store.
6.  **Scene Drawing:** `WhiteBoard` listens to store changes and calls `drawScene` to render the combined manual and generated elements.

---

## 11. Constraints Observed in Code

- **Text Scaling:** Explicitly removed in `useShapes.ts`; text bounding boxes are fixed to content size during resize operations.
- **Read-Only Generated Nodes:** Generated elements cannot be resized or rotated individually; they can only be moved as a collective group.
- **Connector Logic:** Connectors are anchored to one of four sides ("top", "bottom", "left", "right") and use Bézier curves for routing.
- **Z-Index:** Handled by the order of elements in the `elements` array; `bringToFront` and `sendToBack` manipulate array indices.

---

## 12. Example Objects

**Generated Rectangle Node:**
```ts
{
  id: "node-start",
  type: "rectangle",
  text: "Start",
  x: 100,
  y: 100,
  width: 150,
  height: 80,
  isGenerated: true,
  source: { line: 0, start: 0, end: 7 }
}
```

**Connector:**
```ts
{
  id: "conn-node-start__node-process",
  fromShapeId: "node-start",
  toShapeId: "node-process",
  fromSide: "right",
  toSide: "left",
  isGenerated: true
}
```
