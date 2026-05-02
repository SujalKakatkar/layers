import {useParams, useNavigate, useOutletContext} from "react-router";
import {useCallback, useEffect, useRef, useState} from "react";
import WhiteBoard, { type WhiteBoardRef } from "../components/draw/WhiteBoard";
import {useDiagramStore} from "@/store/useDiagramStore";
import {useCanvasStore} from "@/store/useCanvasStore";
import {toast} from "sonner";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

type ContextType = {
    isCodePanelOpen: boolean;
};

function Canvas () {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {isCodePanelOpen} = useOutletContext<ContextType>();
    const whiteboardRef = useRef<WhiteBoardRef>(null);

    const {fetchCanvas, updateCanvas, loading, title: canvasTitle, setCanvasId, isHydrated} = useCanvasStore();
    // manualElements / manualConnectors are read from the store only for Save.
    // They must NOT be passed directly as initialElements to WhiteBoard —
    // that would create a feedback loop that resets undo history on every draw.
    const {code, manualElements, manualConnectors, generatedGroupOffset} = useDiagramStore();

    const [isRenaming, setIsRenaming] = useState(false);
    const [tempTitle, setTempTitle] = useState("");
    const [isFetched, setIsFetched] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Stable snapshot of data fetched from the backend.
    // Only updated when a fetch completes — never on user edits.
    // This breaks the feedback loop: useShapes → setManualElements → prop change → setHistoryFromData → history reset.
    const [canvasInitData, setCanvasInitData] = useState<{
        elements: any[];
        connectors: any[];
    } | null>(null);

    // ── Unsaved-changes tracking ──────────────────────────────────────────────
    // We compare Zustand array references (not deep equality) to detect edits.
    // After each save / fetch, we snapshot the refs. Any subsequent reference
    // change means the user has made edits that aren't persisted yet.
    const lastSavedElementsRef = useRef<any[]>([]);
    const lastSavedConnectorsRef = useRef<any[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Where the user wants to go if they choose "Leave" in the dialog
    const pendingNavigationRef = useRef<string | null>(null);

    useEffect(() => {
        if(id) {
            setIsFetched(false);
            setCanvasInitData(null);
            setHasUnsavedChanges(false);
            setCanvasId(id);
            fetchCanvas(id)
                .then((data) => {
                    setCanvasInitData({
                        elements: data.elements,
                        connectors: data.connectors
                    });
                    // Snapshot what the store contains right after fetch
                    const snap = useDiagramStore.getState();
                    lastSavedElementsRef.current = snap.manualElements;
                    lastSavedConnectorsRef.current = snap.manualConnectors;
                    setIsFetched(true);
                })
                .catch(err => {
                    console.error("Failed to fetch canvas", err);
                    toast.error("Failed to load canvas data");
                    setCanvasInitData({elements: [], connectors: []});
                    setIsFetched(true);
                });
        }
    }, [id, fetchCanvas, setCanvasId]);

    // Detect edits: any reference change to manualElements/manualConnectors
    // after the initial fetch marks the canvas as having unsaved changes.
    useEffect(() => {
        if(!isFetched) return;
        const changed =
            manualElements !== lastSavedElementsRef.current ||
            manualConnectors !== lastSavedConnectorsRef.current;
        setHasUnsavedChanges(changed);
    }, [manualElements, manualConnectors, isFetched]);

    useEffect(() => {
        setTempTitle(canvasTitle);
    }, [canvasTitle]);

    useEffect(() => {
        if(isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        const {isHydrated} = useCanvasStore.getState();
        if(!isHydrated) {
            toast.error("Canvas still loading");
            return;
        }

        const state = useDiagramStore.getState();
        const uiShapes = whiteboardRef.current?.getShapes();
        
        const manualElements = uiShapes ? uiShapes.elements : state.manualElements;
        const manualConnectors = uiShapes ? uiShapes.connectors : state.manualConnectors;
        const {code, generatedGroupOffset} = state;

        console.log("Saving Canvas", {
            shapesFromUI: uiShapes?.elements.length,
            shapesFromStore: state.manualElements.length
        });

        if(manualElements.length === 0 && manualConnectors.length === 0 && code.trim() === "") {
            return;
        }

        try {
            await updateCanvas({
                manualElements,
                manualConnectors,
                code,
                generatedGroupOffset
            });
            // Snapshot saved state so the unsaved-changes tracker resets
            lastSavedElementsRef.current = manualElements;
            lastSavedConnectorsRef.current = manualConnectors;
            setHasUnsavedChanges(false);
            toast.success("Canvas saved  ✓");
        } catch(error) {
            console.error("Save failed", error);
            toast.error("Failed to save canvas");
        }
    }, [updateCanvas]);

    // ── Ctrl+S keyboard shortcut ─────────────────────────────────────────────
    useEffect(() => {
        function onKeyDown (e: KeyboardEvent) {
            const isInput = e.target instanceof HTMLElement &&
                (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable);
            if(isInput) return;

            if((e.ctrlKey || e.metaKey) && e.code === "KeyS") {
                e.preventDefault();
                handleSave();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleSave]);

    // ── Warn on browser reload / tab close ───────────────────────────────────
    useEffect(() => {
        function onBeforeUnload (e: BeforeUnloadEvent) {
            if(!hasUnsavedChanges) return;
            e.preventDefault();
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [hasUnsavedChanges]);

    // ── Dashboard navigation (in-app) ────────────────────────────────────────
    const handleDashboardClick = () => {
        if(hasUnsavedChanges) {
            pendingNavigationRef.current = "/dashboard";
            setShowUnsavedDialog(true);
        } else {
            navigate("/dashboard");
        }
    };

    const handleDialogSaveAndLeave = async () => {
        setShowUnsavedDialog(false);
        await handleSave();
        if(pendingNavigationRef.current) {
            navigate(pendingNavigationRef.current);
        }
    };

    const handleDialogLeaveWithoutSaving = () => {
        setShowUnsavedDialog(false);
        if(pendingNavigationRef.current) {
            navigate(pendingNavigationRef.current);
        }
    };

    const handleDialogCancel = () => {
        setShowUnsavedDialog(false);
        pendingNavigationRef.current = null;
    };

    const handleShare = () => {
        console.log("Share clicked");
    };

    const saveTitle = () => {
        const newTitle = tempTitle.trim() || "Untitled Canvas";
        console.log("Title update requested:", newTitle);
        setIsRenaming(false);
    };

    if(!isFetched) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">

            {/* ─── Unsaved Changes Dialog ───────────────────────────────────────── */}
            <Dialog open={showUnsavedDialog} onOpenChange={(open) => {if(!open) handleDialogCancel();}}>
                <DialogContent showCloseButton={false} className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Unsaved changes</DialogTitle>
                        <DialogDescription>
                            You have unsaved changes. Do you want to save before leaving?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                        <button
                            onClick={handleDialogCancel}
                            className="px-4 py-2 rounded-lg border border-white/10 bg-transparent text-white/60 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDialogLeaveWithoutSaving}
                            className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all"
                        >
                            Leave without saving
                        </button>
                        <button
                            onClick={handleDialogSaveAndLeave}
                            disabled={loading || !isHydrated}
                            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving…" : "Save & leave"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Top Header Overlay ────────────────────────────────────────── */}
            <div
                className={`absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-50 pointer-events-none transition-all duration-300 ease-in-out ${isCodePanelOpen ? 'pr-91' : 'pr-6'}`}
            >
                {/* Left: Title */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <div
                        onDoubleClick={() => setIsRenaming(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-text min-w-30"
                    >
                        {isRenaming ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') saveTitle();
                                    if(e.key === 'Escape') {
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
                    {/* Unsaved indicator dot */}
                    {hasUnsavedChanges && (
                        <span
                            title="Unsaved changes"
                            className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                        />
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button
                        onClick={handleDashboardClick}
                        className="px-4 py-2 rounded-lg border border-white/10 bg-black/40 text-white/70 hover:text-white hover:bg-white/5 backdrop-blur-md text-xs font-semibold transition-all duration-200"
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading || !isHydrated}
                        className={`px-4 py-2 rounded-lg border backdrop-blur-md text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                            ${hasUnsavedChanges
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                : "border-white/10 bg-black/40 text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        {loading ? "Saving…" : hasUnsavedChanges ? "Save*" : "Save"}
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
            <WhiteBoard
                ref={whiteboardRef}
                initialElements={canvasInitData?.elements ?? []}
                initialConnectors={canvasInitData?.connectors ?? []}
            />
        </div>
    );
}

export default Canvas;
