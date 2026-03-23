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
    type: "rectangle"
    x: number
    y: number
    width: number
    height: number
};

export type Circle = {
    id: string,
    type: "circle"
    cx: number
    cy: number
    r: number
};

export type Stroke = {
    id: string
    type: "stroke"
    points: Point[]
    color: string
    width: number
}

export type Text = {
    id: string,
    type: "text"
    x: number
    y: number
    text: string
    fontSize: number
    width: number
    height: number
}

export type EditingText = {
    id: string
    x: number
    y: number
    text: string,
    fontSize: number,
    width: number
    height: number
    isNew: boolean
}


export type Shape = | Rectangle | Circle | Stroke | Text



export type SelectionArea = {
    x: number
    y: number
    width: number
    height: number
} | null

export type AnchorPosition = "top" | "bottom" | "left" | "right"

export type Connections = {
    id: string
    fromShapeId: string
    toShapeId: string

}

export type HandleType =
    | "nw" | "ne" | "sw" | "se"
    | "n" | "s"
    | "e" | "w";