import {useParams, useNavigate, useOutletContext} from "react-router";
import type { Shape, Connector } from "../types/types";
import {useCallback, useEffect, useRef, useState} from "react";
import {Plus, Minus} from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ContextType = {
    isCodePanelOpen: boolean;
};

function Canvas () {
    const {id, token} = useParams<{id: string, token: string}>();
    const navigate = useNavigate();
    const {isCodePanelOpen} = useOutletContext<ContextType>();
    const whiteboardRef = useRef<WhiteBoardRef>(null);

    const {fetchCanvas, fetchSharedCanvas, updateCanvas, getShareToken, revokeShareToken, loading, title: canvasTitle, setCanvasId, isHydrated, shareToken, isReadOnly, setIsReadOnly} = useCanvasStore();
    // manualElements / manualConnectors are read from the store only for Save.
    // They must NOT be passed directly as initialElements to WhiteBoard —
    // that would create a feedback loop that resets undo history on every draw.
    const {code, manualElements, manualConnectors, generatedGroupOffset} = useDiagramStore();

    const [isRenaming, setIsRenaming] = useState(false);
    const [tempTitle, setTempTitle] = useState("");
    const [isFetched, setIsFetched] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [currentZoom, setCurrentZoom] = useState(1);

    const isFetchedRef = useRef(false);
    useEffect(() => {
        isFetchedRef.current = isFetched;
    }, [isFetched]);

    useEffect(() => {
        const handleZoom = (e: Event) => {
            // Only update currentZoom from the whiteboard events 
            // once we've finished the initial data fetch.
            if (isFetchedRef.current) {
                setCurrentZoom((e as CustomEvent).detail);
            }
        };
        window.addEventListener('canvas-zoom', handleZoom);
        return () => window.removeEventListener('canvas-zoom', handleZoom);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth < 1024;
            setIsMobile(small);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setIsReadOnly(true);
        } else {
            // Restore original read-only state when moving back to larger screen
            setIsReadOnly(!!token);
        }
    }, [isMobile, setIsReadOnly, isFetched, token]); 

    // Stable snapshot of data fetched from the backend.
    // Only updated when a fetch completes — never on user edits.
    // This breaks the feedback loop: useShapes → setManualElements → prop change → setHistoryFromData → history reset.
    const [canvasInitData, setCanvasInitData] = useState<{
        elements: Shape[];
        connectors: Connector[];
        camera?: { scale: number; offset: { x: number; y: number } };
        generatedGroupOffset?: { x: number; y: number };
    } | null>(null);

    //  Unsaved-changes tracking 
    // We compare Zustand array references (not deep equality) to detect edits.
    // After each save / fetch, we snapshot the refs. Any subsequent reference
    // change means the user has made edits that aren't persisted yet.
    const lastSavedElementsRef = useRef<Shape[]>([]);
    const lastSavedConnectorsRef = useRef<Connector[]>([]);
    const lastSavedCodeRef = useRef<string>("");
    const lastSavedOffsetsRef = useRef<{x: number; y: number}>({x: 0, y: 0});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Where the user wants to go if they choose "Leave" in the dialog
    const pendingNavigationRef = useRef<string | null>(null);

    useEffect(() => {
        if(token) {
            setIsFetched(false);
            setCanvasInitData(null);
            setHasUnsavedChanges(false);
            fetchSharedCanvas(token)
                .then(data => {
                    
                    setCanvasInitData({
                        elements: data.elements,
                        connectors: data.connectors,
                        camera: data.camera
                    });
                    
                    
                    if (data.camera?.scale) {
                        
                        setCurrentZoom(data.camera.scale);
                    }     
                    lastSavedElementsRef.current = data.elements;
                    lastSavedConnectorsRef.current = data.connectors;
                    lastSavedCodeRef.current = data.code || "";
                    lastSavedOffsetsRef.current = data.generatedGroupOffset || {x: 0, y: 0};
                    setIsFetched(true);
                })
                .catch(err => {
                    console.error("Failed to fetch shared canvas", err);
                    toast.error("Invalid or expired share link");
                    navigate("/");
                });
        } else if(id) {
            setIsFetched(false);
            setCanvasInitData(null);
            setHasUnsavedChanges(false);
            setCanvasId(id);
            fetchCanvas(id)
                .then((data) => {
                    
                    setCanvasInitData({
                        elements: data.elements,
                        connectors: data.connectors,
                        camera: data.camera
                    });
                    if (data.camera?.scale) {
                        setCurrentZoom(data.camera.scale);
                    }
                    // Snapshot what the store contains right after fetch
                    lastSavedElementsRef.current = data.elements;
                    lastSavedConnectorsRef.current = data.connectors;
                    lastSavedCodeRef.current = data.code || "";
                    lastSavedOffsetsRef.current = data.generatedGroupOffset || {x: 0, y: 0};
                    setIsFetched(true);
                })
                .catch(err => {
                    console.error("Failed to fetch canvas", err);
                    toast.error("Failed to load canvas data");
                    setCanvasInitData({elements: [], connectors: []});
                    setIsFetched(true);
                });
        }
    }, [id, token, fetchCanvas, fetchSharedCanvas, setCanvasId, navigate]);

    // Detect edits: any reference change to manualElements/manualConnectors
    // after the initial fetch marks the canvas as having unsaved changes.
    useEffect(() => {
        if(!isFetched) return;
        
        // Use stringification for a robust "deep" comparison to avoid reference-mismatch false positives on mount
        const currentElementsJson = JSON.stringify(manualElements);
        const savedElementsJson = JSON.stringify(lastSavedElementsRef.current);
        const currentConnectorsJson = JSON.stringify(manualConnectors);
        const savedConnectorsJson = JSON.stringify(lastSavedConnectorsRef.current);

        const changed =
            currentElementsJson !== savedElementsJson ||
            currentConnectorsJson !== savedConnectorsJson ||
            code !== lastSavedCodeRef.current ||
            JSON.stringify(generatedGroupOffset) !== JSON.stringify(lastSavedOffsetsRef.current);
            
        setHasUnsavedChanges(changed);
    }, [manualElements, manualConnectors, code, generatedGroupOffset, isFetched]);

    useEffect(() => {
        setTempTitle(canvasTitle);
    }, [canvasTitle]);

    useEffect(() => {
        if(isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    //  Save
    const handleSave = useCallback(async () => {
        if (!hasUnsavedChanges) return;

        const {isHydrated} = useCanvasStore.getState();
        if(!isHydrated) {
            toast.error("Canvas still loading");
            return;
        }

        const state = useDiagramStore.getState();
        const uiShapes = whiteboardRef.current?.getShapes();
        const camera = whiteboardRef.current?.getCamera();
        
        const manualElements = uiShapes ? uiShapes.elements : state.manualElements;
        const manualConnectors = uiShapes ? uiShapes.connectors : state.manualConnectors;
        const {code, generatedGroupOffset} = state;

        console.log("Save payload generatedGroupOffset:", generatedGroupOffset);
        
        try {
            await updateCanvas({
                manualElements,
                manualConnectors,
                code,
                generatedGroupOffset,
                camera: camera || { scale: 1, offset: { x: 0, y: 0 } }
            });
            // Snapshot saved state so the unsaved-changes tracker resets
            lastSavedElementsRef.current = manualElements;
            lastSavedConnectorsRef.current = manualConnectors;
            lastSavedCodeRef.current = code;
            lastSavedOffsetsRef.current = generatedGroupOffset;
            setHasUnsavedChanges(false);
            toast.success("Canvas saved  ✓");
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Failed to save canvas");
        }
    }, [updateCanvas, hasUnsavedChanges]);

    //  Share
    const handleShare = async () => {
        setIsSharing(true);
        try {
            await getShareToken();
            setShowShareDialog(true);
        } catch {
            toast.error("Failed to generate share link");
        } finally {
            setIsSharing(false);
        }
    };

    const handleRevokeShare = async () => {
        try {
            await revokeShareToken();
            toast.success("Share link revoked");
            setShowShareDialog(false);
        } catch {
            toast.error("Failed to revoke share link");
        }
    };

    const copyShareLink = () => {
        if (!shareToken) return;
        const url = shareToken;
        navigator.clipboard.writeText(url);
        toast.success("Share link copied to clipboard");
    };

    //  Keyboard shortcuts
    useEffect(() => {
        function onKeyDown (e: KeyboardEvent) {
            if (isReadOnly) return;
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
    }, [handleSave, isReadOnly]);

    //  Warn on browser reload / tab close
    useEffect(() => {
        function onBeforeUnload (e: BeforeUnloadEvent) {
            if(!hasUnsavedChanges) return;
            e.preventDefault();
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [hasUnsavedChanges]);

    //  Dashboard navigation (in-app)
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


    const saveTitle = async () => {
        const newTitle = tempTitle.trim() || "Untitled Canvas";
        if(newTitle === canvasTitle) {
            setIsRenaming(false);
            return;
        }

        try {
            await updateCanvas({ title: newTitle });
            toast.success("Title updated");
        } catch(error) {
            console.error("Failed to update title", error);
            toast.error("Failed to update title");
            setTempTitle(canvasTitle);
        }
        setIsRenaming(false);
    };

    if(!isFetched) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-background">

            {/*  Mobile Restriction Dialog  */}
            <Dialog open={isMobile} onOpenChange={() => {}}>
                <DialogContent showCloseButton={false} className="max-w-sm dark border-border bg-muted/90 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2 text-xl">
                            <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            </div>
                            Larger Device Required
                        </DialogTitle>
                        <DialogDescription className="text-foreground/60 text-sm leading-relaxed pt-2">
                            Please use a larger device to use this canvas. The editor is optimized for desktop and larger tablet screens to ensure the best experience.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-8">
                         <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                         </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/*  Share Dialog  */}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent className="max-w-md dark">
                    <DialogHeader>
                        <DialogTitle>Share Canvas</DialogTitle>
                        <DialogDescription>
                            Anyone with this link can view this canvas in read-only mode.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={shareToken ? `${shareToken}` : "Generating..."}
                                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground/80 focus:outline-none"
                            />
                            <button
                                onClick={copyShareLink}
                                className="px-3 py-2 bg-primary hover:bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-all"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <p className="text-[10px] text-foreground/40 italic">Link expires if revoked manually.</p>
                            <button
                                onClick={handleRevokeShare}
                                className="text-[10px] text-destructive hover:text-destructive font-semibold transition-all underline underline-offset-4"
                            >
                                Revoke Link
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/*  Unsaved Changes Dialog  */}
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
                            className="px-4 py-2 rounded-lg border border-border bg-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/5 text-xs font-semibold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDialogLeaveWithoutSaving}
                            className="px-4 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-all"
                        >
                            Leave without saving
                        </button>
                        <button
                            onClick={handleDialogSaveAndLeave}
                            disabled={loading || !isHydrated}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary text-primary-foreground text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving…" : "Save & leave"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Top Header Overlay  */}
            <div
                className={`absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-50 pointer-events-none transition-all duration-300 ease-in-out ${isCodePanelOpen ? 'pr-[444px]' : 'pr-6'}`}
            >
                {/* Left: Title */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <div
                        onDoubleClick={() => setIsRenaming(true)}
                        className="px-3 py-1.5 rounded-lg bg-foreground/5 border border-border backdrop-blur-md hover:bg-foreground/10 transition-colors cursor-text min-w-30"
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
                                className="bg-transparent text-foreground text-sm font-bold border-none outline-none w-full"
                            />
                        ) : (
                            <h1 className="text-sm font-bold text-foreground tracking-tight">
                                {canvasTitle}
                            </h1>
                        )}
                    </div>
                    {!isRenaming && (
                        <p className="text-[10px] text-foreground/20 hidden md:block">Double-click to rename</p>
                    )}
                    {/* Unsaved indicator dot */}
                    {hasUnsavedChanges && (
                        <span
                            title="Unsaved changes"
                            className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"
                        />
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col items-center gap-4 pointer-events-auto">
                    {/* Buttons Row */}
                    <div className="flex items-center gap-3">
                        <Tooltip>
                            <TooltipTrigger render={ <button
                                    onClick={handleDashboardClick}
                                    className="px-4 py-2 rounded-lg border border-border bg-background/40 text-foreground/70 hover:text-foreground hover:bg-foreground/5 backdrop-blur-md text-xs font-semibold transition-all duration-200"
                                >
                                    Dashboard
                                </button>}>
                               
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="px-2.5 py-1.5 font-medium">
                                Back to Dashboard
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger render={   <button
                                    onClick={handleSave}
                                    disabled={loading || !isHydrated || !hasUnsavedChanges || isReadOnly}
                                    className={`px-4 py-2 rounded-lg border backdrop-blur-md text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                        ${hasUnsavedChanges && !isReadOnly
                                            ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
                                            : "border-border bg-background/40 text-foreground/70"
                                        }`}
                                >
                                    {loading ? "Saving…" : (isReadOnly ? "Read Only" : (hasUnsavedChanges ? "Save*" : "Saved"))}
                                </button>}>
                             
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="flex items-center gap-3 px-3 py-1.5 font-medium text-foreground/90">
                                {isReadOnly ? (
                                    <span>Read Only mode</span>
                                ) : !hasUnsavedChanges ? (
                                    <span>Nothing to save</span>
                                ) : (
                                    <>
                                        <span>Save changes</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 text-[10px] font-mono text-foreground/40 border border-border leading-none">
                                            Ctrl+S
                                        </kbd>
                                    </>
                                )}
                            </TooltipContent>
                        </Tooltip>

                        {!isReadOnly && (
                            <Tooltip>
                                <TooltipTrigger render={ <button
                                        onClick={handleShare}
                                        disabled={isSharing}
                                        className="bg-primary hover:bg-primary text-primary-foreground px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg shadow-primary/10 disabled:opacity-50"
                                    >
                                        {isSharing ? "Sharing..." : "Share"}
                                    </button>}>
                                   
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="px-2.5 py-1.5 font-medium">
                                    Share Canvas
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {/* Zoom Row */}
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger render={<button
                                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-zoom-out'))}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-background/40 text-foreground hover:text-foreground hover:bg-foreground/5 backdrop-blur-md transition-all duration-200"
                                >
                                    <Minus size={14} />
                                </button>}>
                                
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="px-2.5 py-1.5 font-medium">
                                Zoom Out
                            </TooltipContent>
                        </Tooltip>
                        
                        <div className="px-3 py-2 rounded-lg border border-border bg-background/40 text-foreground backdrop-blur-md text-[10px] font-black tracking-widest uppercase min-w-[64px] text-center">
                            {Math.round(currentZoom * 100)}%
                        </div>

                        <Tooltip>
                            <TooltipTrigger render={<button
                                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-zoom-in'))}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-background/40 text-foreground hover:text-foreground hover:bg-foreground/5 backdrop-blur-md transition-all duration-200"
                                >
                                    <Plus size={14} />
                                </button>}>
                                
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="px-2.5 py-1.5 font-medium">
                                Zoom In
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* ─── WhiteBoard Component ─────────────────────────────────────── */}
            <WhiteBoard
                ref={whiteboardRef}
                initialElements={canvasInitData?.elements ?? []}
                initialConnectors={canvasInitData?.connectors ?? []}
                initialCamera={canvasInitData?.camera}
            />
        </div>
    );
}

export default Canvas;
