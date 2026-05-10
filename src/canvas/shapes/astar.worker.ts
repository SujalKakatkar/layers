import type { Point, Shape } from "../../types/types";

type GridNode = { x: number, y: number, g: number, h: number, f: number, parent?: GridNode };

class AStarHeap {
    private heap: GridNode[] = [];
    
    push(val: GridNode) {
        this.heap.push(val);
        let n = this.heap.length - 1;
        while (n > 0) {
            const p = (n - 1) >> 1;
            if (this.heap[p].f <= this.heap[n].f) break;
            const tmp = this.heap[n];
            this.heap[n] = this.heap[p];
            this.heap[p] = tmp;
            n = p;
        }
    }
    
    pop(): GridNode | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0 && bottom !== undefined) {
            this.heap[0] = bottom;
            let n = 0;
            const len = this.heap.length;
            while (true) {
                const left = (n << 1) + 1;
                const right = left + 1;
                let swap = -1;
                if (left < len && this.heap[left].f < this.heap[n].f) swap = left;
                if (right < len && this.heap[right].f < (swap === -1 ? this.heap[n].f : this.heap[left].f)) swap = right;
                if (swap === -1) break;
                const tmp = this.heap[n];
                this.heap[n] = this.heap[swap];
                this.heap[swap] = tmp;
                n = swap;
            }
        }
        return top;
    }
    
    get length() { return this.heap.length; }
}

function getShapeBounds(shape: Shape) {
    if (shape.type === "circle") {
        return {
            x: shape.cx - shape.r,
            y: shape.cy - shape.r,
            width: shape.r * 2,
            height: shape.r * 2
        };
    }
    // Stroke is filtered out before calling this, but TS doesn't know.
    const s = shape as any;
    return {
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height
    };
}

export function getAStarPath(
    start: Point,
    end: Point,
    shapes: Shape[],
    ignoreIds: string[],
    usageMap: Map<string, number>
): Point[] {
    const PADDING = 15;
    const GRID_SIZE = 15;
    
    const obstacles = shapes
        .filter(s => !s.type.includes('stroke') && s.type !== "text")
        .map(s => {
            const b = getShapeBounds(s);
            const isSourceOrTarget = ignoreIds.includes(s.id);
            
            const pad = isSourceOrTarget ? 0 : PADDING;
            
            return {
                left: b.x - pad,
                right: b.x + b.width + pad,
                top: b.y - pad,
                bottom: b.y + b.height + pad,
                isSourceOrTarget
            };
        });

    const startX = start.x;
    const startY = start.y;

    const snapX = (x: number) => startX + Math.round((x - startX) / GRID_SIZE) * GRID_SIZE;
    const snapY = (y: number) => startY + Math.round((y - startY) / GRID_SIZE) * GRID_SIZE;
    
    const endX = snapX(end.x);
    const endY = snapY(end.y);

    const isBlocked = (x: number, y: number) => {
        if ((x === startX && y === startY) || (x === endX && y === endY)) return false;
        
        return obstacles.some(obs => {
            if (obs.isSourceOrTarget) {
                return x > obs.left && x < obs.right && y > obs.top && y < obs.bottom;
            } else {
                return x >= obs.left && x <= obs.right && y >= obs.top && y <= obs.bottom;
            }
        });
    };

    const nodeHash = (x: number, y: number) => `${x},${y}`;
    
    const openSet = new AStarHeap();
    const closedSet = new Set<string>();
    const bestG = new Map<string, number>();
    
    const startNode: GridNode = { 
        x: startX, 
        y: startY, 
        g: 0, 
        h: Math.abs(startX - endX) + Math.abs(startY - endY), 
        f: 0 
    };
    startNode.f = startNode.g + startNode.h;
    
    openSet.push(startNode);
    bestG.set(nodeHash(startX, startY), 0);
    
    let current: GridNode | undefined;
    let iterations = 0;
    const MAX_ITERATIONS = 5000;
    
    while (openSet.length > 0 && iterations++ < MAX_ITERATIONS) {
        current = openSet.pop();
        if (!current) break;
        
        const hash = nodeHash(current.x, current.y);
        
        if (closedSet.has(hash)) continue;
        closedSet.add(hash);
        
        if (current.x === endX && current.y === endY) {
            break;
        }
        
        const neighbors = [
            { x: current.x + GRID_SIZE, y: current.y },
            { x: current.x - GRID_SIZE, y: current.y },
            { x: current.x, y: current.y + GRID_SIZE },
            { x: current.x, y: current.y - GRID_SIZE }
        ];
        
        for (const n of neighbors) {
            if (isBlocked(n.x, n.y)) continue;
            
            const nHash = nodeHash(n.x, n.y);
            if (closedSet.has(nHash)) continue;
            
            let turnPenalty = 0;
            if (current.parent) {
                const dx1 = current.x - current.parent.x;
                const dy1 = current.y - current.parent.y;
                const dx2 = n.x - current.x;
                const dy2 = n.y - current.y;
                if (Math.sign(dx1) !== Math.sign(dx2) || Math.sign(dy1) !== Math.sign(dy2)) {
                    turnPenalty = GRID_SIZE * 0.5;
                }
            }
            
            const usage = usageMap.get(nHash) || 0;
            const isStartOrEnd = (n.x === startX && n.y === startY) || (n.x === endX && n.y === endY);
            const usagePenalty = isStartOrEnd ? 0 : (usage * GRID_SIZE * 3);
            
            const g = current.g + GRID_SIZE + turnPenalty + usagePenalty;
            
            if (!bestG.has(nHash) || g < bestG.get(nHash)!) {
                bestG.set(nHash, g);
                
                const dx1 = n.x - startX;
                const dy1 = n.y - startY;
                const dx2 = endX - startX;
                const dy2 = endY - startY;
                const crossProduct = Math.abs(dx1 * dy2 - dx2 * dy1);
                const tieBreaker = crossProduct * 0.001;
                
                const h = Math.abs(n.x - endX) + Math.abs(n.y - endY) + tieBreaker;
                
                openSet.push({
                    x: n.x,
                    y: n.y,
                    g,
                    h,
                    f: g + h,
                    parent: current
                });
            }
        }
    }
    
    const path: Point[] = [];
    if (current && current.x === endX && current.y === endY) {
        let temp: GridNode | undefined = current;
        while (temp) {
            path.push({ x: temp.x, y: temp.y });
            
            const hash = nodeHash(temp.x, temp.y);
            const isStartOrEnd = (temp.x === startX && temp.y === startY) || (temp.x === endX && temp.y === endY);
            if (!isStartOrEnd) {
                usageMap.set(hash, (usageMap.get(hash) || 0) + 1);
            }
            
            temp = temp.parent;
        }
        path.reverse();
        
        const simplified: Point[] = [start];
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];
            
            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;
            
            if (dx1 * dy2 !== dy1 * dx2) {
                simplified.push(curr);
            }
        }
        simplified.push(end);
        return simplified;
    }
    
    return [start, end];
}

self.onmessage = (e: MessageEvent) => {
    const { id, start, end, shapes, ignoreIds, usageMap } = e.data;
    const usageMapObj = new Map<string, number>(usageMap);
    
    const path = getAStarPath(start, end, shapes, ignoreIds, usageMapObj);
    self.postMessage({ id, path });
};
