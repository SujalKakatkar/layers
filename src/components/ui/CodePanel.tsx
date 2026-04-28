import {X} from "lucide-react"
import {useState, useEffect, useRef} from "react"
import {useDiagramStore} from "../../store/useDiagramStore"
import type {Shape, Connector} from "../../types/types"
import {editorFocus} from "../../hooks/useEditorFocus.ts"

// ── Stable ID helpers ────────────────────────────────────────────────────────
function normalize (text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, "-");
}

function getNodeId (text: string) {
  return "node-" + normalize(text);
}

function getConnectorId (fromId: string, toId: string) {
  return "conn-" + fromId + "__" + toId;
}

// ── Parser ───────────────────────────────────────────────────────────────────
function parseNode (raw: string) {
  if(raw.startsWith("[") && raw.endsWith("]")) {
    return {type: "rectangle", text: raw.slice(1, -1), rawText: raw};
  }

  if(raw.startsWith("(") && raw.endsWith(")")) {
    return {type: "circle", text: raw.slice(1, -1), rawText: raw};
  }

  return {type: "rectangle", text: raw, rawText: raw};
}

type ParsedDiagram = {
  nodes: Map<string, any>;
  edges: Set<string>;
};

function parseToShapes (input: string): ParsedDiagram {
  const lines = input.split("\n");

  const nodes = new Map<string, any>();
  const edges = new Set<string>();

  function getOrCreateNode (raw: string, lineIndex: number, line: string) {
    const parsed = parseNode(raw);
    const id = getNodeId(parsed.text);

    if(!nodes.has(id)) {
      const start = line.indexOf(parsed.rawText);
      const end = start + parsed.rawText.length;

      nodes.set(id, {
        id,
        type: parsed.type,
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

      edges.add(getConnectorId(fromNode.id, toNode.id));
    }
  });

  return {nodes, edges};
}

// ── Layout engine ─────────────────────────────────────────────────────────────
function mapParsedToShapes (parsed: ParsedDiagram) {
  const elements: any[] = [];
  const connectors: any[] = [];
  const nodeMap = new Map<string, any>();

  // ── Step 1: Build shape objects (no positions yet) ────────────────────────
  parsed.nodes.forEach((node) => {
    const shape: any = {
      id: node.id,
      type: node.type,
      text: node.text,
      fontSize: 16,
      isGenerated: true,
    };

    if(node.type === "circle") {
      shape.r = 40;
      shape.width = 80;
      shape.height = 80;
    } else {
      shape.width = 150;
      shape.height = 80;
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

  function dfs (nodeId: string, level: number) {
    const current = levels.get(nodeId) ?? -1;
    if(level <= current) return;
    levels.set(nodeId, level);
    childrenMap.get(nodeId)?.forEach(child => dfs(child, level + 1));
  }

  roots.forEach(root => dfs(root, 0));

  // Fallback: assign level 0 to any still-unvisited node
  parsed.nodes.forEach((_, id) => {
    if(!levels.has(id)) dfs(id, 0);
  });

  // ── Step 5: Subtree-aware recursive layout ───────────────────────────────
  const spacingX = 250;
  const spacingY = 120;
  let currentY = 100;

  function layoutNode (nodeId: string, level: number) {
    const shape = nodeMap.get(nodeId);
    const children = childrenMap.get(nodeId) ?? [];
    const x = 100 + level * spacingX;

    if(children.length === 0) {
      if(shape.type === "circle") {
        shape.cx = x + shape.r;
        shape.cy = currentY + shape.r;
      } else {
        shape.x = x;
        shape.y = currentY;
      }
      currentY += spacingY;
      return;
    }

    const startY = currentY;
    children.forEach(child => layoutNode(child, level + 1));
    const endY = currentY - spacingY;
    const midY = (startY + endY) / 2;

    if(shape.type === "circle") {
      shape.cx = x + shape.r;
      shape.cy = midY + shape.r;
    } else {
      shape.x = x;
      shape.y = midY;
    }
  }

  roots.forEach(root => layoutNode(root, 0));

  // Fallback: place any node still without coordinates (disconnected nodes)
  parsed.nodes.forEach((_, id) => {
    const shape = nodeMap.get(id);
    if(!shape) return;
    const needsPlace =
      (shape.type === "circle" && shape.cx == null) ||
      (shape.type !== "circle" && shape.x == null);
    if(!needsPlace) return;

    if(shape.type === "circle") {
      shape.cx = 100 + shape.r;
      shape.cy = currentY + shape.r;
    } else {
      shape.x = 100;
      shape.y = currentY;
    }
    currentY += spacingY;
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
function reconcile (
  oldElements: Shape[],
  newElements: Shape[],
  oldConnectors: Connector[],
  newConnectors: Connector[]
): {elements: Shape[]; connectors: Connector[]} {

  // ── Reconcile elements ──────────────────────────────────────────────────
  const oldMap = new Map(oldElements.map(el => [el.id, el]));

  const finalElements = newElements.map((el: any) => {
    const old = oldMap.get(el.id) as any;
    if(!old) return el; // brand-new node → use layout position

    // Existing node: keep geometry, preserve position
    const merged: any = {...old, ...el};

    if(el.type === "circle") {
      // Circles use cx/cy
      if(old.cx != null) merged.cx = old.cx;
      if(old.cy != null) merged.cy = old.cy;
    } else {
      // Rectangles / text use x/y
      if(old.x != null) merged.x = old.x;
      if(old.y != null) merged.y = old.y;
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
  const [codeInput, setCodeInput] = useState("");
  const editorRef = useRef<any>(null);
  const monaco = useMonaco();

  const {
    setGeneratedElements,
    setGeneratedConnectors,
    previousElements,
    previousConnectors,
    setPreviousElements,
    setPreviousConnectors,
    selectedNodeId,
    setSelectedNodeId,
    highlightedRange,
    setHighlightedRange,
    generatedElements,
  } = useDiagramStore();

  // ── Register LayerScript language + theme once Monaco is ready ────────────
  useEffect(() => {
    if(!monaco) return;

    // Register language
    if(!monaco.languages.getLanguages().some((l: any) => l.id === "layerscript")) {
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

    // Define custom theme
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

    monaco.editor.setTheme("layer-dark");
  }, [monaco]);

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
  const handleCursorChange = (e: any) => {
    const lineIndex = e.position.lineNumber - 1;
    const charInLine = e.position.column - 1;

    const hit = generatedElements.find((el: any) => {
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
      className={`fixed right-0 top-0 h-full w-[340px] bg-[#09090b] border-l border-white/8 shadow-2xl z-40 flex flex-col transition-transform duration-200 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-xs font-bold text-white tracking-wider uppercase">LayerScript</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Hint bar */}
      <div className="px-4 py-2 border-b border-white/5 shrink-0">
        <p className="text-[10px] text-white/25 font-mono">
          Use <span className="text-emerald-400">Node =&gt; Node</span> to connect shapes
        </p>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="layerscript"
          theme="layer-dark"
          value={codeInput}
          onChange={(value) => setCodeInput(value || "")}
          onMount={(editor) => {
            editorRef.current = editor;
            editor.onDidChangeCursorPosition(handleCursorChange);
            
            // ── Monaco focus tracking ──────────────────────────────────────
            editor.onDidFocusEditorText(() => { editorFocus.active = true; });
            editor.onDidBlurEditorText(() => { editorFocus.active = false; });
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
