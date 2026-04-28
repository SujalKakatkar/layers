import {X} from "lucide-react"
import {useState, useEffect, useRef} from "react"
import { useDiagramStore } from "../../store/useDiagramStore"

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
    return {type: "rectangle", text: raw.slice(1, -1)};
  }

  if(raw.startsWith("(") && raw.endsWith(")")) {
    return {type: "circle", text: raw.slice(1, -1)};
  }

  return {type: "rectangle", text: raw};
}

type ParsedDiagram = {
  nodes: Map<string, any>;
  edges: Set<string>;
};

function parseToShapes (input: string): ParsedDiagram {
  const lines = input.split("\n");

  const nodes = new Map<string, any>();
  const edges = new Set<string>();

  function getOrCreateNode (raw: string) {
    const parsed = parseNode(raw);
    const id = getNodeId(parsed.text);

    if(!nodes.has(id)) {
      nodes.set(id, {
        id,
        type: parsed.type,
        text: parsed.text,
      });
    }

    return nodes.get(id);
  }

  lines.forEach((line) => {
    const clean = line.trim();
    if(!clean) return;

    const parts = clean.split("=>").map(p => p.trim()).filter(Boolean);
    if(parts.length < 2) return;

    for(let i = 0;i < parts.length - 1;i++) {
      const fromNode = getOrCreateNode(parts[i]);
      const toNode = getOrCreateNode(parts[i + 1]);

      edges.add(getConnectorId(fromNode.id, toNode.id));
    }
  });

  return {nodes, edges};
}

function mapParsedToShapes(parsed: ParsedDiagram) {
  const elements: any[]   = [];
  const connectors: any[] = [];
  const nodeMap = new Map<string, any>();

  // ── Step 1: Build shape objects (no positions yet) ────────────────────────
  parsed.nodes.forEach((node) => {
    const shape: any = {
      id: node.id,
      type: node.type,
      text: node.text,
      fontSize: 16,
    };

    if (node.type === "circle") {
      shape.r      = 40;
      shape.width  = 80;
      shape.height = 80;
    } else {
      shape.width  = 150;
      shape.height = 80;
    }

    nodeMap.set(node.id, shape);
    elements.push(shape);
  });

  // ── Step 2: Build graph (adjacency list + in-degree) ─────────────────────
  const childrenMap    = new Map<string, string[]>();
  const incomingCount  = new Map<string, number>();

  parsed.nodes.forEach((_, id) => {
    childrenMap.set(id, []);
    incomingCount.set(id, 0);
  });

  parsed.edges.forEach((edgeId) => {
    const parts = edgeId.split(/conn-|__/);
    const from  = parts[1];
    const to    = parts[2];
    if (!from || !to) return;

    childrenMap.get(from)?.push(to);
    incomingCount.set(to, (incomingCount.get(to) ?? 0) + 1);
  });

  // ── Step 3: Find root nodes (no incoming edges) ───────────────────────────
  const roots: string[] = [];
  incomingCount.forEach((count, nodeId) => {
    if (count === 0) roots.push(nodeId);
  });

  // Fallback: if graph has a cycle with no real root, treat first node as root
  if (roots.length === 0 && parsed.nodes.size > 0) {
    const firstId = parsed.nodes.keys().next().value as string | undefined;
    if (firstId) roots.push(firstId);
  }

  // ── Step 4: DFS to assign levels (max-depth wins for shared nodes) ────────
  const levels = new Map<string, number>();

  function dfs(nodeId: string, level: number) {
    const current = levels.get(nodeId) ?? -1;
    if (level <= current) return; // already visited at equal or deeper level
    levels.set(nodeId, level);
    childrenMap.get(nodeId)?.forEach(child => dfs(child, level + 1));
  }

  roots.forEach(root => dfs(root, 0));

  // Fallback: assign level 0 to any still-unvisited node
  parsed.nodes.forEach((_, id) => {
    if (!levels.has(id)) dfs(id, 0);
  });

  // ── Step 5: Subtree-aware recursive layout ───────────────────────────────
  // Instead of a fixed grid, we use a shared Y cursor that only advances when
  // a LEAF node is placed. Parents center themselves over the Y range their
  // children consumed. This guarantees zero overlap for any tree shape.

  const spacingX = 250;
  const spacingY = 120;
  let currentY   = 100;

  function layoutNode(nodeId: string, level: number) {
    const shape    = nodeMap.get(nodeId);
    const children = childrenMap.get(nodeId) ?? [];
    const x        = 100 + level * spacingX;

    if (children.length === 0) {
      // Leaf node: place at current cursor and advance
      if (shape.type === "circle") {
        shape.cx = x + shape.r;
        shape.cy = currentY + shape.r;
      } else {
        shape.x = x;
        shape.y = currentY;
      }
      currentY += spacingY;
      return;
    }

    // Interior node: layout children first, then center self over their range
    const startY = currentY;
    children.forEach(child => layoutNode(child, level + 1));
    const endY   = currentY - spacingY;
    const midY   = (startY + endY) / 2;

    if (shape.type === "circle") {
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
    if (!shape) return;
    const needsPlace =
      (shape.type === "circle"    && shape.cx == null) ||
      (shape.type !== "circle"    && shape.x  == null);
    if (!needsPlace) return;

    if (shape.type === "circle") {
      shape.cx = 100 + shape.r;
      shape.cy = currentY + shape.r;
    } else {
      shape.x = 100;
      shape.y = currentY;
    }
    currentY += spacingY;
  });



  // ── Step 8: Safety check ─────────────────────────────────────────────────
  elements.forEach((shape) => {
    if (
      (shape.type === "rectangle" && (shape.x == null || shape.y == null)) ||
      (shape.type === "circle"    && (shape.cx == null || shape.cy == null))
    ) {
      console.error("❌ Invalid shape coordinates:", shape);
    }
  });

  console.log("FINAL ELEMENTS:", elements);

  // ── Step 9: Build connectors ──────────────────────────────────────────────
  parsed.edges.forEach((edgeId) => {
    const parts  = edgeId.split(/conn-|__/);
    const fromId = parts[1];
    const toId   = parts[2];

    if (!nodeMap.has(fromId) || !nodeMap.has(toId)) return;

    connectors.push({
      id:          edgeId,
      fromShapeId: fromId,
      toShapeId:   toId,
      fromSide:    "right",
      toSide:      "left",
    });
  });

  return { elements, connectors };
}

type CodePanelProps = {
  isOpen: boolean;
  onClose: () => void;
}

function CodePanel ({isOpen, onClose}: CodePanelProps) {
  const [codeInput, setCodeInput] = useState("");
  const { setGeneratedElements, setGeneratedConnectors } = useDiagramStore();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if(!codeInput.trim()) {
        setGeneratedElements([]);
        setGeneratedConnectors([]);
        return;
      }

      const parsed = parseToShapes(codeInput);

      const {elements, connectors} = mapParsedToShapes(parsed);

      console.log("Generated Elements:", elements);
      console.log("Generated Connectors:", connectors);

      // 🔥 Replace state (not append)
      setGeneratedElements(elements);
      setGeneratedConnectors(connectors);
    }, 300);

    return () => clearTimeout(timeout);
  }, [codeInput, setGeneratedElements, setGeneratedConnectors]);

  return (
    <div
      className={`fixed right-0 top-0 h-full w-[320px] bg-zinc-900 border-l border-zinc-700 shadow-2xl z-50 flex flex-col transition-transform duration-200 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <h2 className="text-sm font-semibold text-white">Diagram Code</h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 p-4">
        <textarea
          className="w-full h-full bg-zinc-950 text-zinc-300 p-4 border border-zinc-700 rounded-lg outline-none resize-none font-mono text-sm focus:border-zinc-500 transition-colors"
          placeholder="Write your diagram code here..."
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
        />
      </div>
    </div>
  )
}

export default CodePanel
