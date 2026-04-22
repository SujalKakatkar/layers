import type { Shape, Text } from "../../types/types";
import { measureTextSize } from "../../helpers/measureTextSize";

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
            className="absolute z-10 flex items-center justify-between gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-md shadow-lg bottom-16 left-1/2 transform -translate-x-1/2 pointer-events-auto"
            style={{ touchAction: 'none' }}
        >
            <button
                onClick={handleBold}
                className={`p-1 w-8 h-8 rounded flex items-center justify-center transition-colors ${
                    shape.fontWeight === "bold" ? "bg-blue-600 text-white" : "text-neutral-400 hover:bg-neutral-800"
                }`}
                title="Bold"
            >
                <b className="font-serif">B</b>
            </button>

            <div className="w-px h-6 bg-neutral-700 mx-1" />

            <button
                onClick={() => handleAlign("left")}
                className={`p-1 w-8 h-8 rounded flex flex-col items-center justify-center gap-[2px] transition-colors ${
                    (!shape.textAlign || shape.textAlign === "left") ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"
                }`}
                title="Align Left"
            >
                <div className="w-4 h-[2px] bg-current mr-auto" />
                <div className="w-3 h-[2px] bg-current mr-auto" />
                <div className="w-4 h-[2px] bg-current mr-auto" />
            </button>

            <button
                onClick={() => handleAlign("center")}
                className={`p-1 w-8 h-8 rounded flex flex-col items-center justify-center gap-[2px] transition-colors ${
                    shape.textAlign === "center" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"
                }`}
                title="Align Center"
            >
                <div className="w-4 h-[2px] bg-current mx-auto" />
                <div className="w-3 h-[2px] bg-current mx-auto" />
                <div className="w-4 h-[2px] bg-current mx-auto" />
            </button>

            <button
                onClick={() => handleAlign("right")}
                className={`p-1 w-8 h-8 rounded flex flex-col items-center justify-center gap-[2px] transition-colors ${
                    shape.textAlign === "right" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"
                }`}
                title="Align Right"
            >
                <div className="w-4 h-[2px] bg-current ml-auto" />
                <div className="w-3 h-[2px] bg-current ml-auto" />
                <div className="w-4 h-[2px] bg-current ml-auto" />
            </button>

            <div className="w-[1px] h-6 bg-neutral-700 mx-1" />

            <button
                onClick={handleDecreaseSize}
                className="p-1 w-8 h-8 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 transition-colors text-sm font-semibold"
                title="Decrease Font Size"
            >
                A-
            </button>

            <span className="text-white text-xs px-1 tabular-nums font-mono">
                {Math.round(shape.fontSize || 20)}
            </span>

            <button
                onClick={handleIncreaseSize}
                className="p-1 w-8 h-8 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 transition-colors text-base font-bold"
                title="Increase Font Size"
            >
                A+
            </button>
        </div>
    );
}
