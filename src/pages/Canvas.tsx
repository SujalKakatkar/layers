import {useParams, useNavigate, useOutletContext} from "react-router";
import {useEffect, useState, useRef} from "react";
import WhiteBoard from "../components/draw/WhiteBoard";
import { useDiagramStore } from "@/store/useDiagramStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { toast } from "sonner";
import LoadingScreen from "@/components/ui/LoadingScreen";

type ContextType = {
    isCodePanelOpen: boolean;
};

function Canvas () {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {isCodePanelOpen} = useOutletContext<ContextType>();
    
    const { fetchCanvas, updateCanvas, loading, title: canvasTitle, setCanvasId } = useCanvasStore();
    const { code, manualElements, manualConnectors, generatedGroupOffset, setCode } = useDiagramStore();
    
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempTitle, setTempTitle] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            setCanvasId(id);
            fetchCanvas(id).catch(err => {
                console.error("Failed to fetch canvas", err);
                toast.error("Failed to load canvas data");
            });
        }
    }, [id, fetchCanvas, setCanvasId]);

    useEffect(() => {
        setTempTitle(canvasTitle);
    }, [canvasTitle]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleSave = async () => {
        try {
            await updateCanvas({
                manualElements,
                manualConnectors,
                code,
                generatedGroupOffset
            });
            toast.success("Canvas saved successfully");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save canvas");
        }
    };

    const handleShare = () => {
        console.log("Share clicked");
    };

    const saveTitle = () => {
        const newTitle = tempTitle.trim() || "Untitled Canvas";
        // setIsRenaming(false);
        // In a real app, update title via store
        console.log("Title update requested:", newTitle);
        setIsRenaming(false);
    };

    if (loading && !manualElements.length) {
        return <LoadingScreen />;
    }

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
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-white/10 bg-black/40 text-white/70 hover:text-white hover:bg-white/5 backdrop-blur-md text-xs font-semibold transition-all duration-200"
                    >
                        {loading ? "Saving..." : "Save"}
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
            <WhiteBoard initialElements={manualElements} initialConnectors={manualConnectors}/>
        </div>
    );
}

export default Canvas;
