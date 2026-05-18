import type { Shape, Text, EditingText } from "../../types/types";
import { measureTextSize } from "../../helpers/measureTextSize";
import { Bold, AlignLeft, AlignCenter, AlignRight, Minus, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type TextToolbarProps = {
    shape: Text;
    updateShape: (id: string, updater: (shape: Shape) => Shape) => void;
    editingText: EditingText | null;
    setEditingText: (val: EditingText | null) => void;
};

export default function TextToolbar({ shape, updateShape, editingText, setEditingText }: TextToolbarProps) {
    const handleBold = () => {
        const newWeight = shape.fontWeight === "bold" ? "normal" : "bold";
        
        // Update store
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            const metrics = measureTextSize(s.text, s.fontSize, newWeight);
            return { ...s, fontWeight: newWeight, width: metrics.width, height: metrics.height };
        });

        // Sync with editing state if active
        if (editingText && editingText.id === shape.id) {
            const metrics = measureTextSize(editingText.text, editingText.fontSize, newWeight);
            setEditingText({
                ...editingText,
                fontWeight: newWeight,
                width: metrics.width,
                height: metrics.height
            });
        }
    };

    const handleAlign = (align: "left" | "center" | "right") => {
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            return { ...s, textAlign: align };
        });
        
        if (editingText && editingText.id === shape.id) {
            setEditingText({ ...editingText, textAlign: align });
        }
    };

    const handleIncreaseSize = () => {
        const newFontSize = (shape.fontSize || 20) + 4;
        
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            const metrics = measureTextSize(s.text, newFontSize, s.fontWeight);
            return { ...s, fontSize: newFontSize, width: metrics.width, height: metrics.height };
        });

        if (editingText && editingText.id === shape.id) {
            const metrics = measureTextSize(editingText.text, newFontSize, editingText.fontWeight);
            setEditingText({
                ...editingText,
                fontSize: newFontSize,
                width: metrics.width,
                height: metrics.height
            });
        }
    };

    const handleDecreaseSize = () => {
        const newFontSize = Math.max(8, (shape.fontSize || 20) - 4);
        
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            const metrics = measureTextSize(s.text, newFontSize, s.fontWeight);
            return { ...s, fontSize: newFontSize, width: metrics.width, height: metrics.height };
        });

        if (editingText && editingText.id === shape.id) {
            const metrics = measureTextSize(editingText.text, newFontSize, editingText.fontWeight);
            setEditingText({
                ...editingText,
                fontSize: newFontSize,
                width: metrics.width,
                height: metrics.height
            });
        }
    };

    return (
        <div
            className="absolute z-50 flex items-center gap-2 px-4 h-14 bg-muted/60 backdrop-blur-md border border-border rounded-2xl shadow-xl bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4"
            style={{ touchAction: 'none' }}
        >
            {/* Bold Toggle */}
            <Tooltip>
                <TooltipTrigger render={ <button
                        onClick={handleBold}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                            shape.fontWeight === "bold" 
                            ? "active-tool-glow text-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <Bold size={18} strokeWidth={shape.fontWeight === "bold" ? 3 : 2} />
                    </button>}>
                   
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-1.5 font-medium text-foreground/90">
                    Bold
                </TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-muted/50 mx-1" />

            {/* Alignment Group */}
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger render={<button
                            onClick={() => handleAlign("left")}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                                (!shape.textAlign || shape.textAlign === "left") 
                                ? "active-tool-glow text-foreground shadow-sm" 
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <AlignLeft size={18} />
                        </button>}>
                        
                    </TooltipTrigger>
                    <TooltipContent side="top" className="px-3 py-1.5 font-medium text-foreground/90">
                        Align Left
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger render={ <button
                            onClick={() => handleAlign("center")}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                                shape.textAlign === "center" 
                                ? "active-tool-glow text-foreground shadow-sm" 
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <AlignCenter size={18} />
                        </button>}>
                       
                    </TooltipTrigger>
                    <TooltipContent side="top" className="px-3 py-1.5 font-medium text-foreground/90">
                        Align Center
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger render={<button
                            onClick={() => handleAlign("right")}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                                shape.textAlign === "right" 
                                ? "active-tool-glow text-foreground shadow-sm" 
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <AlignRight size={18} />
                        </button>}>
                        
                    </TooltipTrigger>
                    <TooltipContent side="top" className="px-3 py-1.5 font-medium text-foreground/90">
                        Align Right
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="w-px h-6 bg-muted/50 mx-1" />

            {/* Font Size Control */}
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger render={<button
                            onClick={handleDecreaseSize}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        >
                            <Minus size={16} strokeWidth={3} />
                        </button>}>
                        
                    </TooltipTrigger>
                    <TooltipContent side="top" className="px-3 py-1.5 font-medium text-foreground/90">
                        Decrease Font Size
                    </TooltipContent>
                </Tooltip>

                <div className="min-w-[32px] flex justify-center">
                    <span className="text-foreground font-mono font-bold tabular-nums">
                        {Math.round(shape.fontSize || 20)}
                    </span>
                </div>

                <Tooltip>
                    <TooltipTrigger render={ <button
                            onClick={handleIncreaseSize}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>}>
                       
                    </TooltipTrigger>
                    <TooltipContent side="top" className="px-3 py-1.5 font-medium text-foreground/90">
                        Increase Font Size
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
