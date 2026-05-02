import type { Shape, Text } from "../../types/types";
import { measureTextSize } from "../../helpers/measureTextSize";
import { Bold, AlignLeft, AlignCenter, AlignRight, Minus, Plus } from "lucide-react";

type TextToolbarProps = {
    shape: Text;
    updateShape: (id: string, updater: (shape: Shape) => Shape) => void;
};

export default function TextToolbar({ shape, updateShape }: TextToolbarProps) {
    const handleBold = () => {
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            const newWeight = s.fontWeight === "bold" ? "normal" : "bold";
            const metrics = measureTextSize(s.text, s.fontSize, newWeight);
            return { ...s, fontWeight: newWeight, width: metrics.width, height: metrics.height };
        });
    };

    const handleAlign = (align: "left" | "center" | "right") => {
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            return { ...s, textAlign: align };
        });
    };

    const handleIncreaseSize = () => {
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            const newFontSize = (s.fontSize || 20) + 4;
            const metrics = measureTextSize(s.text, newFontSize, s.fontWeight);
            return { ...s, fontSize: newFontSize, width: metrics.width, height: metrics.height };
        });
    };

    const handleDecreaseSize = () => {
        updateShape(shape.id, (s) => {
            if (s.type !== "text") return s;
            const newFontSize = Math.max(8, (s.fontSize || 20) - 4);
            const metrics = measureTextSize(s.text, newFontSize, s.fontWeight);
            return { ...s, fontSize: newFontSize, width: metrics.width, height: metrics.height };
        });
    };

    return (
        <div
            className="absolute z-50 flex items-center gap-2 px-3 h-12 bg-zinc-900/60 backdrop-blur-md border border-zinc-700 rounded-xl shadow-xl bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4"
            style={{ touchAction: 'none' }}
        >
            {/* Bold Toggle */}
            <button
                onClick={handleBold}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                    shape.fontWeight === "bold" 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
                title="Bold"
            >
                <Bold size={16} strokeWidth={shape.fontWeight === "bold" ? 3 : 2} />
            </button>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            {/* Alignment Group */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => handleAlign("left")}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                        (!shape.textAlign || shape.textAlign === "left") 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                    title="Align Left"
                >
                    <AlignLeft size={16} />
                </button>

                <button
                    onClick={() => handleAlign("center")}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                        shape.textAlign === "center" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                    title="Align Center"
                >
                    <AlignCenter size={16} />
                </button>

                <button
                    onClick={() => handleAlign("right")}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                        shape.textAlign === "right" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                    title="Align Right"
                >
                    <AlignRight size={16} />
                </button>
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            {/* Font Size Control */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDecreaseSize}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
                    title="Decrease Font Size"
                >
                    <Minus size={14} strokeWidth={3} />
                </button>

                <div className="min-w-[28px] flex justify-center">
                    <span className="text-zinc-200 text-xs font-mono font-medium tabular-nums">
                        {Math.round(shape.fontSize || 20)}
                    </span>
                </div>

                <button
                    onClick={handleIncreaseSize}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
                    title="Increase Font Size"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
