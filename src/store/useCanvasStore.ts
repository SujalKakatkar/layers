import {create} from 'zustand';
import {createCanvas as apiCreateCanvas, getCanvas, updateCanvas as apiUpdateCanvas, listCanvases, getSharedCanvas, generateShareLink as apiGenerateShareLink, revokeShareLink as apiRevokeShareLink} from '@/api/canvas';
import {useDiagramStore} from './useDiagramStore';

interface CanvasListItem {
  _id: string;
  title: string;
  createdAt: string;
}

interface CanvasState {
  canvasId: string | null;
  title: string;
  loading: boolean;
  canvases: CanvasListItem[];
  error: string | null;
  isHydrated: boolean;
  shareToken: string | null;
  isReadOnly: boolean;

  setCanvasId: (id: string) => void;
  createCanvas: (title: string) => Promise<string>;
  fetchCanvas: (id: string) => Promise<{elements: any[]; connectors: any[]}>;
  listAllCanvases: () => Promise<void>;
  updateCanvas: (data: {
    manualElements: any[];
    manualConnectors: any[];
    code: string;
    generatedGroupOffset: {x: number; y: number};
  }) => Promise<void>;
  fetchSharedCanvas: (token: string) => Promise<{elements: any[]; connectors: any[]}>;
  getShareToken: () => Promise<string>;
  revokeShareToken: () => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvasId: null,
  title: "Untitled Canvas",
  loading: false,
  canvases: [],
  error: null,
  isHydrated: false,
  shareToken: null,
  isReadOnly: false,

  setCanvasId: (id: string) => set({canvasId: id}),

  createCanvas: async (title: string) => {
    set({loading: true, error: null});
    try {
      const data = await apiCreateCanvas(title);
      set({canvasId: data._id, title, loading: false});
      return data._id;
    } catch(err: any) {
      set({error: err.message, loading: false});
      throw err;
    }
  },

  fetchCanvas: async (id: string) => {
    set({loading: true, error: null, isHydrated: false, isReadOnly: false});
    try {
      const data = await getCanvas(id);
      set({canvasId: id, title: data.title, loading: false});

      const manualElements = data.manualElements || [];
      const manualConnectors = data.manualConnectors || [];

      // Push into diagram store for Save button and LayerScript
      const diagramStore = useDiagramStore.getState();
      diagramStore.setManualElements(manualElements);
      diagramStore.setManualConnectors(manualConnectors);
      diagramStore.setCode(data.code || "");
      if((data as any).generatedGroupOffset) {
        diagramStore.setGeneratedGroupOffset((data as any).generatedGroupOffset);
      }

      set({isHydrated: true});

      // Return the raw data so callers can initialize history directly
      return {
        elements: manualElements,
        connectors: manualConnectors
      };
    } catch(err: any) {
      set({error: err.message, loading: false});
      throw err;
    }
  },

  fetchSharedCanvas: async (token: string) => {
    set({loading: true, error: null, isHydrated: false, isReadOnly: true});
    try {
      const data = await getSharedCanvas(token);
      set({canvasId: data.id, title: data.title, loading: false});

      const manualElements = data.manualElements || [];
      const manualConnectors = data.manualConnectors || [];

      const diagramStore = useDiagramStore.getState();
      diagramStore.setManualElements(manualElements);
      diagramStore.setManualConnectors(manualConnectors);
      diagramStore.setCode(data.code || "");

      set({isHydrated: true});

      return {
        elements: manualElements,
        connectors: manualConnectors
      };
    } catch(err: any) {
      set({error: err.message, loading: false});
      throw err;
    }
  },

  listAllCanvases: async () => {
    set({loading: true, error: null});
    try {
      const data = await listCanvases();
      set({canvases: data, loading: false});
    } catch(err: any) {
      set({error: err.message, loading: false});
      throw err;
    }
  },

  updateCanvas: async (data) => {
    const {canvasId} = get();
    if(!canvasId) return;

    set({loading: true, error: null});
    try {
      // Strip runtime-only fields from elements before saving
      const sanitizedElements = data.manualElements.map(el => {
        const {isGenerated, source, ...rest} = el;
        return rest;
      });

      // Backend DB field is "manualConnectors" — send it with the correct name
      await apiUpdateCanvas(canvasId, {
        manualElements: sanitizedElements,
        manualConnectors: data.manualConnectors,
        code: data.code,
        generatedGroupOffset: data.generatedGroupOffset
      });
      set({loading: false});
    } catch(err: any) {
      set({error: err.message, loading: false});
      throw err;
    }
  },

  getShareToken: async () => {
    const {canvasId} = get();
    if(!canvasId) throw new Error("No canvas ID");
    try {
      const data = await apiGenerateShareLink(canvasId);
      // Backend returns { shareUrl, expiry }
      const token = data.shareUrl;
      set({shareToken: token});
      return token;
    } catch(err: any) {
      set({error: err.message});
      throw err;
    }
  },

  revokeShareToken: async () => {
    const {canvasId} = get();
    if(!canvasId) throw new Error("No canvas ID");
    try {
      await apiRevokeShareLink(canvasId);
      set({shareToken: null});
    } catch(err: any) {
      set({error: err.message});
      throw err;
    }
  }
}));
