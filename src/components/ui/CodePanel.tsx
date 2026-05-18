import {X} from "lucide-react"
import {useEffect, useRef} from "react"
import {useDiagramStore} from "../../store/useDiagramStore"
import type {Shape, Connector} from "../../types/types"
import {editorFocus} from "../../hooks/useEditorFocus.ts"
import {useTheme} from "../ThemeProvider"


function normalize (text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, "-");
}

function getNodeId (text: string) {
  return "node-" + normalize(text);
}

function getConnectorId (fromId: string, toId: string) {
  return "conn-" + fromId + "__" + toId;
}


function parseNode (raw: string) {
  if(raw.startsWith("[") && raw.endsWith("]")) {
    return {type: "rectangle", text: raw.slice(1, -1), rawText: raw};
  }

  if(raw.startsWith("(") && raw.endsWith(")")) {
    return {type: "circle", text: raw.slice(1, -1), rawText: raw};
  }

  return {type: "rectangle", text: raw, rawText: raw};
}

type ParsedNode = {
  id: string;
  type: "rectangle" | "circle";
  text: string;
  source: {line: number; start: number; end: number};
};

type ParsedDiagram = {
  nodes: Map<string, ParsedNode>;
  edges: Set<string>;
};

function parseToShapes (input: string): ParsedDiagram {
  const lines = input.split("\n");

  const nodes = new Map<string, ParsedNode>();
  const edges = new Set<string>();

  function getOrCreateNode (raw: string, lineIndex: number, line: string) {
    const parsed = parseNode(raw);
    const id = getNodeId(parsed.text);

    if(!nodes.has(id)) {
      const start = line.indexOf(parsed.rawText);
      const end = start + parsed.rawText.length;

      nodes.set(id, {
        id,
        type: parsed.type as "rectangle" | "circle",
        text: parsed.text,
        source: {line: lineIndex, start, end}
      });
    }

    return nodes.get(id);
  }

  lines.forEach((line, lineIndex) => {
    const clean = line.trim();
    if(!clean) return;

    const parts = clean.split("=>").map(p => p.trim()).filter(Boolean);
    if(parts.length < 2) return;

    for(let i = 0;i < parts.length - 1;i++) {
      const fromNode = getOrCreateNode(parts[i], lineIndex, line);
      const toNode = getOrCreateNode(parts[i + 1], lineIndex, line);

      if(fromNode && toNode) {
        edges.add(getConnectorId(fromNode.id, toNode.id));
      }
    }
  });

  return {nodes, edges};
}

// ── Component discovery removed (Single Diagram) ──────────────────────────────

// ── Layout engine ─────────────────────────────────────────────────────────────
function mapParsedToShapes (parsed: ParsedDiagram) {
  const elements: Shape[] = [];
  const connectors: Connector[] = [];
  const nodeMap = new Map<string, Shape>();

  // ── Step 1: Build shape objects (no positions yet) ────────────────────────
  parsed.nodes.forEach((node) => {
    let shape: Shape;
    if (node.type === "circle") {
      shape = {
        id: node.id,
        type: "circle",
        cx: 0,
        cy: 0,
        r: 40,
        text: node.text,
        fontSize: 16,
        isGenerated: true,
        componentId: "default",
      };
    } else {
      shape = {
        id: node.id,
        type: "rectangle",
        x: 0,
        y: 0,
        width: 150,
        height: 80,
        text: node.text,
        fontSize: 16,
        isGenerated: true,
        componentId: "default",
      };
    }

    nodeMap.set(node.id, shape);
    elements.push(shape);
  });

  // ── Step 2: Build graph (adjacency list + in-degree) ─────────────────────
  const childrenMap = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();

  parsed.nodes.forEach((_, id) => {
    childrenMap.set(id, []);
    incomingCount.set(id, 0);
  });

  parsed.edges.forEach((edgeId) => {
    const parts = edgeId.split(/conn-|__/);
    const from = parts[1];
    const to = parts[2];
    if(!from || !to) return;

    childrenMap.get(from)?.push(to);
    incomingCount.set(to, (incomingCount.get(to) ?? 0) + 1);
  });

  // ── Step 3: Find root nodes (no incoming edges) ───────────────────────────
  const roots: string[] = [];
  incomingCount.forEach((count, nodeId) => {
    if(count === 0) roots.push(nodeId);
  });

  // Fallback: if graph has a cycle with no real root, treat first node as root
  if(roots.length === 0 && parsed.nodes.size > 0) {
    const firstId = parsed.nodes.keys().next().value as string | undefined;
    if(firstId) roots.push(firstId);
  }

  // ── Step 4: DFS to assign levels (max-depth wins for shared nodes) ────────
  const levels = new Map<string, number>();
  const dfsInStack = new Set<string>(); // Cycle guard

  function dfs (nodeId: string, level: number) {
    if(dfsInStack.has(nodeId)) return; // Back-edge: skip to break cycle
    const current = levels.get(nodeId) ?? -1;
    if(level <= current) return;
    levels.set(nodeId, level);
    dfsInStack.add(nodeId);
    childrenMap.get(nodeId)?.forEach(child => dfs(child, level + 1));
    dfsInStack.delete(nodeId);
  }

  roots.forEach(root => dfs(root, 0));

  // Fallback: assign level 0 to any still-unvisited node
  parsed.nodes.forEach((_, id) => {
    if(!levels.has(id)) dfs(id, 0);
  });

  // ── Step 5: Column-based layout — group by level, stack vertically ───────
  // This approach is cycle-safe: no recursion, no back-edge issues.
  // All nodes at the same depth level form a column; nodes are stacked top-to-bottom.
  const spacingX = 250;
  const spacingY = 130;
  const originY = 100;

  // Group nodes by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if(!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  });

  // Place each column
  levelGroups.forEach((nodeIds, level) => {
    const x = 100 + level * spacingX;
    nodeIds.forEach((nodeId, index) => {
      const shape = nodeMap.get(nodeId);
      if(!shape) return;
      const y = originY + index * spacingY;
      if(shape.type === "circle") {
        shape.cx = x + shape.r;
        shape.cy = y + shape.r;
      } else if (shape.type === "rectangle" || shape.type === "text") {
        shape.x = x;
        shape.y = y;
      }
    });
  });

  // Fallback: place any node still without coordinates (isolated / unreachable nodes)
  let fallbackY = originY + levelGroups.size * spacingY;
  parsed.nodes.forEach((_, id) => {
    const shape = nodeMap.get(id);
    if(!shape) return;
    const needsPlace =
      (shape.type === "circle" && shape.cx === 0) ||
      ((shape.type === "rectangle" || shape.type === "text") && shape.x === 0);
    if(!needsPlace) return;

    if(shape.type === "circle") {
      shape.cx = 100 + shape.r;
      shape.cy = fallbackY + shape.r;
    } else if (shape.type === "rectangle" || shape.type === "text") {
      shape.x = 100;
      shape.y = fallbackY;
    }
    fallbackY += spacingY;
  });

  // ── Safety check ─────────────────────────────────────────────────────────
  elements.forEach((shape) => {
    if(
      (shape.type === "rectangle" && (shape.x == null || shape.y == null)) ||
      (shape.type === "circle" && (shape.cx == null || shape.cy == null))
    ) {
      console.error("❌ Invalid shape coordinates:", shape);
    }
  });

  // ── Build connectors ──────────────────────────────────────────────────────
  parsed.edges.forEach((edgeId) => {
    const parts = edgeId.split(/conn-|__/);
    const fromId = parts[1];
    const toId = parts[2];

    if(!nodeMap.has(fromId) || !nodeMap.has(toId)) return;

    connectors.push({
      id: edgeId,
      fromShapeId: fromId,
      toShapeId: toId,
      fromSide: "right",
      toSide: "left",
      isGenerated: true,
      componentId: "default",
    });
  });

  // Attach source to elements
  elements.forEach(el => {
    const node = parsed.nodes.get(el.id);
    if(node && node.source) {
      el.source = node.source;
    }
  });

  return {elements, connectors};
}

// ── Reconciliation ────────────────────────────────────────────────────────────
// Merges freshly-laid-out shapes with the previous generation.
// • Existing nodes:  keep old position, update everything else.
// • New nodes:       use layout position as-is.
// • Removed nodes:   not present in newElements → naturally dropped.
// • Fresh paste:     if >55% of nodes are brand new, skip reconciliation entirely
//                    so stale positions from a previous diagram don't corrupt layout.
function reconcile (
  oldElements: Shape[],
  newElements: Shape[],
  oldConnectors: Connector[],
  newConnectors: Connector[]
): {elements: Shape[]; connectors: Connector[]} {

  // ── Guard: mostly-new diagram → skip reconciliation ─────────────────────
  const oldMap = new Map(oldElements.map(el => [el.id, el]));
  const newNodeCount = newElements.filter(el => !oldMap.has(el.id)).length;
  const freshRatio = newNodeCount / Math.max(newElements.length, 1);

  // If more than 55% of nodes are brand new, use fresh layout positions for all.
  // This prevents stale positions from confusing a newly pasted diagram.
  if(freshRatio > 0.55) {
    return {elements: newElements as Shape[], connectors: newConnectors as Connector[]};
  }

  // ── Reconcile elements ──────────────────────────────────────────────────
  const finalElements = newElements.map((el) => {
    const old = oldMap.get(el.id);
    if(!old) return el; // brand-new node → use layout position

    // Existing node: keep geometry, preserve position
    const merged = {...old, ...el} as Shape;

    if(el.type === "circle" && old.type === "circle" && merged.type === "circle") {
      if(old.cx != null) merged.cx = old.cx;
      if(old.cy != null) merged.cy = old.cy;
    } else if ((el.type === "rectangle" || el.type === "text") && (old.type === "rectangle" || old.type === "text")) {
      const m = merged as import("../../types/types").Rectangle | import("../../types/types").Text;
      if(old.x != null) m.x = old.x;
      if(old.y != null) m.y = old.y;
    }

    return merged;
  });

  // ── Reconcile connectors ────────────────────────────────────────────────
  const oldConnMap = new Map(oldConnectors.map(c => [c.id, c]));

  const finalConnectors = newConnectors.map((conn) => {
    return oldConnMap.get(conn.id) ?? conn;
  });

  return {elements: finalElements as Shape[], connectors: finalConnectors as Connector[]};
}

// ── CodePanel Component ───────────────────────────────────────────────────────
import Editor, {useMonaco} from "@monaco-editor/react"

type CodePanelProps = {
  isOpen: boolean;
  onClose: () => void;
}

function CodePanel ({isOpen, onClose}: CodePanelProps) {
  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();
  const { theme } = useTheme();

  const {
    code: codeInput,
    setCode: setCodeInput,
    setGeneratedElements,
    setGeneratedConnectors,
    previousElements,
    previousConnectors,
    setPreviousElements,
    setPreviousConnectors,
    setSelectedNodeId,
    highlightedRange,
    generatedElements,
  } = useDiagramStore();

  // ── Register LayerScript language + theme once Monaco is ready ────────────
  useEffect(() => {
    if(!monaco) return;

    // Register language
    if(!monaco.languages.getLanguages().some((l) => l.id === "layerscript")) {
      monaco.languages.register({id: "layerscript"});

      monaco.languages.setMonarchTokensProvider("layerscript", {
        tokenizer: {
          root: [
            [/=>/, "keyword.operator"],
            [/\[/, "delimiter.bracket"],
            [/\]/, "delimiter.bracket"],
            [/\(/, "delimiter.parenthesis"],
            [/\)/, "delimiter.parenthesis"],
            [/\/\/.*$/, "comment"],
            [/[A-Za-z_][\w\s]*/, "identifier"],
          ],
        },
      });
    }

    // Define custom themes
    monaco.editor.defineTheme("layer-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        {token: "keyword.operator", foreground: "10B981", fontStyle: "bold"},
        {token: "delimiter.bracket", foreground: "A3E635"},
        {token: "delimiter.parenthesis", foreground: "67E8F9"},
        {token: "comment", foreground: "4B5563", fontStyle: "italic"},
        {token: "identifier", foreground: "F9FAFB"},
      ],
      colors: {
        "editor.background": "#09090b",
        "editor.foreground": "#F9FAFB",
        "editor.lineHighlightBackground": "#ffffff08",
        "editorLineNumber.foreground": "#3f3f46",
        "editorLineNumber.activeForeground": "#10B981",
        "editor.selectionBackground": "#10B98133",
        "editor.inactiveSelectionBackground": "#10B98122",
        "editorCursor.foreground": "#10B981",
        "editorWhitespace.foreground": "#1f2937",
        "editorIndentGuide.background1": "#1f2937",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "#ffffff0f",
        "scrollbarSlider.hoverBackground": "#ffffff1a",
      },
    });

    monaco.editor.defineTheme("layer-light", {
      base: "vs",
      inherit: true,
      rules: [
        {token: "keyword.operator", foreground: "059669", fontStyle: "bold"},
        {token: "delimiter.bracket", foreground: "1e40af"},
        {token: "delimiter.parenthesis", foreground: "7c3aed"},
        {token: "comment", foreground: "4b5563", fontStyle: "italic"},
        {token: "identifier", foreground: "0f172a"},
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#0f172a",
        "editor.lineHighlightBackground": "#f1f5f9",
        "editorLineNumber.foreground": "#94a3b8",
        "editorLineNumber.activeForeground": "#10B981",
        "editor.selectionBackground": "#10B98122",
        "editor.inactiveSelectionBackground": "#10B98111",
        "editorCursor.foreground": "#10B981",
        "editorWhitespace.foreground": "#e2e8f0",
        "editorIndentGuide.background1": "#e2e8f0",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "#0000000f",
        "scrollbarSlider.hoverBackground": "#0000001a",
      },
    });

    monaco.editor.setTheme(theme === "dark" ? "layer-dark" : "layer-light");
  }, [monaco, theme]);

  // ── Bidirectional highlight: canvas → editor ──────────────────────────────
  useEffect(() => {
    if(!highlightedRange || !editorRef.current) return;

    const editor = editorRef.current;
    const monacoInstance = monaco;
    if(!monacoInstance) return;

    const {line, start, end} = highlightedRange;
    const startCol = start + 1;
    const endCol = end + 1;

    editor.setSelection({
      startLineNumber: line + 1,
      startColumn: startCol,
      endLineNumber: line + 1,
      endColumn: endCol,
    });
    editor.revealLineInCenter(line + 1);
  }, [highlightedRange, monaco]);

  // ── Debounced parsing (unchanged logic) ───────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      if(!codeInput.trim()) {
        setGeneratedElements([]);
        setGeneratedConnectors([]);
        setPreviousElements([]);
        setPreviousConnectors([]);
        return;
      }

      const parsed = parseToShapes(codeInput);
      const {elements: layoutElements, connectors: layoutConnectors} = mapParsedToShapes(parsed);
      const {elements, connectors} = reconcile(
        previousElements,
        layoutElements,
        previousConnectors,
        layoutConnectors
      );

      setGeneratedElements(elements);
      setGeneratedConnectors(connectors);
      setPreviousElements(elements);
      setPreviousConnectors(connectors);
    }, 300);

    return () => clearTimeout(timeout);
  }, [codeInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cursor-move handler: editor → canvas ─────────────────────────────────
  const handleCursorChange = (e: import("monaco-editor").editor.ICursorPositionChangedEvent) => {
    const lineIndex = e.position.lineNumber - 1;
    const charInLine = e.position.column - 1;

    const hit = generatedElements.find((el) => {
      if(!el.source) return false;
      return (
        el.source.line === lineIndex &&
        charInLine >= el.source.start &&
        charInLine <= el.source.end
      );
    });

    setSelectedNodeId(hit ? hit.id : null);
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-[420px] bg-background border-l border-border shadow-2xl z-40 flex flex-col transition-transform duration-200 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <h2 className="text-xs font-bold text-foreground tracking-wider uppercase">LayerScript</h2>
        </div>
        <button
          onClick={onClose}
          className="text-foreground/30 hover:text-foreground transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Hint bar */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <p className="text-[10px] text-foreground/25 font-mono">
          Use <span className="text-primary">Node =&gt; Node</span> to connect shapes
        </p>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="layerscript"
          theme={theme === "dark" ? "layer-dark" : "layer-light"}
          value={codeInput}
          onChange={(value) => setCodeInput(value || "")}
          onMount={(editor) => {
            editorRef.current = editor;
            editor.onDidChangeCursorPosition(handleCursorChange);

            // ── Monaco focus tracking ──────────────────────────────────────
            editor.onDidFocusEditorText(() => {editorFocus.active = true;});
            editor.onDidBlurEditorText(() => {editorFocus.active = false;});
          }}
          options={{
            fontSize: 13,
            fontFamily: "'Figtree Variable', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            minimap: {enabled: false},
            scrollBeyondLastLine: false,
            wordWrap: "on",
            folding: false,
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorStyle: "line",
            padding: {top: 12, bottom: 12},
            renderWhitespace: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "hidden",
              verticalScrollbarSize: 4,
            },
            lineNumbersMinChars: 3,
            glyphMargin: false,
            contextmenu: false,
          }}
        />
      </div>
    </div>
  )
}

export default CodePanel
