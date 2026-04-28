import {useParams, useNavigate, useOutletContext} from "react-router";
import {useEffect, useState, useRef} from "react";
import WhiteBoard from "../components/draw/WhiteBoard";

type CanvasData = {
  id: string;
  title: string;
};

type ContextType = {
    isCodePanelOpen: boolean;
};

function Canvas () {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {isCodePanelOpen} = useOutletContext<ContextType>();
    
    const [canvasTitle, setCanvasTitle] = useState("Untitled Canvas");
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempTitle, setTempTitle] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            const stored = localStorage.getItem("canvases");
            if (stored) {
                const canvases: CanvasData[] = JSON.parse(stored);
                const current = canvases.find(c => c.id === id);
                if (current) {
                    setCanvasTitle(current.title);
                    setTempTitle(current.title);
                }
            }
        }
    }, [id]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleShare = () => {
        console.log("Share clicked");
    };

    const saveTitle = () => {
        const newTitle = tempTitle.trim() || "Untitled Canvas";
        setCanvasTitle(newTitle);
        setIsRenaming(false);

        if (id) {
            const stored = localStorage.getItem("canvases");
            if (stored) {
                const canvases: CanvasData[] = JSON.parse(stored);
                const updated = canvases.map(c => c.id === id ? {...c, title: newTitle} : c);
                localStorage.setItem("canvases", JSON.stringify(updated));
            }
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* ─── Top Header Overlay ────────────────────────────────────────── */}
            <div 
                className={`absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-50 pointer-events-none transition-all duration-300 ease-in-out ${isCodePanelOpen ? 'pr-[364px]' : 'pr-6'}`}
            >
                
                {/* Left: Title */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <div 
                        onDoubleClick={() => setIsRenaming(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-text min-w-[120px]"
                    >
                        {isRenaming ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTitle();
                                    if (e.key === 'Escape') {
                                        setTempTitle(canvasTitle);
                                        setIsRenaming(false);
                                    }
                                }}
                                className="bg-transparent text-white text-sm font-bold border-none outline-none w-full"
                            />
                        ) : (
                            <h1 className="text-sm font-bold text-white tracking-tight">
                                {canvasTitle}
                            </h1>
                        )}
                    </div>
                    {!isRenaming && (
                        <p className="text-[10px] text-white/20 hidden md:block">Double-click to rename</p>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button 
                        onClick={() => navigate("/dashboard")}
                        className="px-4 py-2 rounded-lg border border-white/10 bg-black/40 text-white/70 hover:text-white hover:bg-white/5 backdrop-blur-md text-xs font-semibold transition-all duration-200"
                    >
                        Dashboard
                    </button>

                    <button 
                        onClick={handleShare}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg shadow-emerald-500/10"
                    >
                        Share
                    </button>
                </div>
            </div>

            {/* ─── WhiteBoard Component ─────────────────────────────────────── */}
            <WhiteBoard/>
        </div>
    );
}

export default Canvas
