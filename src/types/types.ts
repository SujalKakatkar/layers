//tools
export type Tools = "select" | "rectangle" | "circle" | "pen" | "text"

export type HelperTools = "undo" | "redo";

export type HistoryActions = {
    undo: () => void
    redo: () => void
}


export type CanvasTool = {
    onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    cursor?: string;
};

export type ConnectionState =
    | {mode: "idle"}
    | {mode: "hover"; sourceId: string; side: ConnectorSide; ghostShape: Shape}
    | {mode: "drag"; sourceId: string; side: ConnectorSide; mouseX: number; mouseY: number; targetShapeId: string | null};

export type ConnectionIntent =
    | {type: "create"; sourceId: string; side: ConnectorSide; newShape: Shape}
    | {type: "connect"; fromShapeId: string; fromSide: ConnectorSide; toShapeId: string; toSide: ConnectorSide}
    | null;

//type for selection boundry
export type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};


export type Point = {
    x: number
    y: number
};

export type Rectangle = {
    id: string
    groupId?: string
    type: "rectangle"
    x: number
    y: number
    width: number
    height: number
    rotation?: number
    isGenerated?: boolean
    componentId?: string
    source?: {
        line: number;
        start: number;
        end: number;
    };
    text?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: "left" | "center" | "right";
};

export type Circle = {
    id: string,
    groupId?: string
    type: "circle"
    cx: number
    cy: number
    r: number
    rotation?: number
    isGenerated?: boolean
    componentId?: string
    source?: {
        line: number;
        start: number;
        end: number;
    };
    text?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: "left" | "center" | "right";
};

export type Stroke = {
    id: string
    groupId?: string
    type: "stroke"
    points: Point[]
    color: string
    width: number
    rotation?: number
    isGenerated?: boolean
    componentId?: string
    source?: {
        line: number;
        start: number;
        end: number;
    };
}

export type Text = {
    id: string,
    groupId?: string
    type: "text"
    x: number
    y: number
    text: string
    fontSize: number
    width: number
    height: number
    fontWeight?: string;
    textAlign?: "left" | "center" | "right";
    rotation?: number
    isGenerated?: boolean
    componentId?: string
    source?: {
        line: number;
        start: number;
        end: number;
    };
}

export type EditingText = {
    id: string
    groupId?: string
    x: number
    y: number
    text: string,
    fontSize: number,
    width: number
    height: number
    isNew: boolean
    fontWeight?: string;
    textAlign?: "left" | "center" | "right";
    rotation?: number
}


export type Shape = | Rectangle | Circle | Stroke | Text



export type SelectionArea = {
    x: number
    y: number
    width: number
    height: number
} | null

export type Guide = {
    type: "vertical" | "horizontal";
    position: number;
};

export type AnchorPosition = "top" | "bottom" | "left" | "right"

export type ConnectorSide = "top" | "right" | "bottom" | "left";

export type Connector = {
    id: string;
    fromShapeId: string;
    toShapeId: string;
    fromSide: ConnectorSide;
    toSide: ConnectorSide;
    isGenerated?: boolean;
    componentId?: string;
};

/** Transient state while the user is dragging a new connector */
export type ConnectorDraft = {
    fromShapeId: string;
    fromSide: ConnectorSide;
    toWorldPoint: Point; // cursor position in world coords
};

export type HandleType =
    | "nw" | "ne" | "sw" | "se"
    | "n" | "s"
    | "e" | "w"
    | "rotate"
    | "rotate-tl" | "rotate-tr" | "rotate-bl" | "rotate-br";