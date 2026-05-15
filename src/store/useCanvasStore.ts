import { create } from 'zustand';
import {
  createCanvas as apiCreateCanvas,
  getCanvas,
  updateCanvas as apiUpdateCanvas,
  listCanvases,
  getSharedCanvas,
  generateShareLink as apiGenerateShareLink,
  revokeShareLink as apiRevokeShareLink,
  deleteCanvas as apiDeleteCanvas
} from '@/api/canvas';
import type { Shape, Connector } from '../types/types';
import { useDiagramStore } from './useDiagramStore';

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
  fetchCanvas: (id: string) => Promise<{ elements: Shape[]; connectors: Connector[]; code: string; camera?: { scale: number; offset: { x: number; y: number } }; generatedGroupOffset?: { x: number; y: number } }>;
  listAllCanvases: () => Promise<void>;
  removeCanvas: (id: string) => Promise<void>;
  updateCanvas: (data: {
    title?: string;
    manualElements?: Shape[];
    manualConnectors?: Connector[];
    code?: string;
    generatedGroupOffset?: { x: number; y: number };
    camera?: { scale: number; offset: { x: number; y: number } };
  }) => Promise<void>;
  fetchSharedCanvas: (token: string) => Promise<{ elements: Shape[]; connectors: Connector[]; code: string; camera?: { scale: number; offset: { x: number; y: number } }; generatedGroupOffset?: { x: number; y: number } }>;
  getShareToken: () => Promise<string>;
  revokeShareToken: () => Promise<void>;
  setIsReadOnly: (val: boolean) => void;
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

  setCanvasId: (id: string) => set({ canvasId: id }),

  createCanvas: async (title: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiCreateCanvas(title);
      set({ canvasId: data._id, title, loading: false });
      return data._id;
    } catch (err) {
      const error = err as Error;
      set({ error: error.message, loading: false });
      throw err;
    }
  },

  fetchCanvas: async (id: string) => {
    set({ loading: true, error: null, isHydrated: false, isReadOnly: false });
    try {
      const data = await getCanvas(id);
      set({ canvasId: id, title: data.title, loading: false });

      const manualElements = data.manualElements || [];
      const manualConnectors = data.manualConnectors || [];

      // Push into diagram store for Save button and LayerScript
      const diagramStore = useDiagramStore.getState();
      diagramStore.setManualElements(manualElements);
      diagramStore.setManualConnectors(manualConnectors);
      diagramStore.setCode(data.code || "");

      const rawOffset = data.generatedGroupOffset;

      if (rawOffset) {
        diagramStore.setGeneratedGroupOffset(rawOffset);
      } else {
        diagramStore.setGeneratedGroupOffset({ x: 0, y: 0 });
      }

      set({ isHydrated: true });

      // Return the raw data so callers can initialize history directly
      return {
        elements: manualElements,
        connectors: manualConnectors,
        code: data.code || "",
        camera: data.camera,
        generatedGroupOffset: rawOffset || { x: 0, y: 0 }
      };
    } catch (err) {
      const error = err as Error;
      set({ error: error.message, loading: false });
      throw err;
    }
  },

  fetchSharedCanvas: async (token: string) => {
    set({ loading: true, error: null, isHydrated: false, isReadOnly: true });
    try {
      const data = await getSharedCanvas(token);
      set({ canvasId: data.id, title: data.title, loading: false });

      const manualElements = data.manualElements || [];
      const manualConnectors = data.manualConnectors || [];

      const diagramStore = useDiagramStore.getState();
      diagramStore.setManualElements(manualElements);
      diagramStore.setManualConnectors(manualConnectors);
      diagramStore.setCode(data.code || "");
      if (data.generatedGroupOffset) {
        diagramStore.setGeneratedGroupOffset(data.generatedGroupOffset);
      } else {
        diagramStore.setGeneratedGroupOffset({ x: 0, y: 0 });
      }

      set({ isHydrated: true });

      return {
        elements: manualElements,
        connectors: manualConnectors,
        code: data.code || "",
        camera: data.camera,
        generatedGroupOffset: data.generatedGroupOffset
      };
    } catch (err) {
      const error = err as Error;
      set({ error: error.message, loading: false });
      throw err;
    }
  },

  listAllCanvases: async () => {
    set({ loading: true, error: null });
    try {
      const data = await listCanvases();
      set({ canvases: data, loading: false });
    } catch (err) {
      const error = err as Error;
      set({ error: error.message, loading: false });
      throw err;
    }
  },

  removeCanvas: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiDeleteCanvas(id);
      set((state) => ({
        canvases: state.canvases.filter((c) => c._id !== id),
        loading: false
      }));
    } catch (err) {
      const error = err as Error;
      set({ error: error.message, loading: false });
      throw err;
    }
  },

  updateCanvas: async (data) => {
    const { canvasId } = get();
    if (!canvasId) return;

    set({ loading: true, error: null });
    try {
      // If elements are provided, sanitize them. Otherwise, we're just updating metadata like the title.
      const sanitizedElements = data.manualElements
        ? data.manualElements.map(el => {
          const rest = { ...el } as Record<string, unknown>;
          delete rest.isGenerated;
          delete rest.source;
          return rest as unknown as Shape;
        })
        : undefined;

      const payload: Partial<import("../api/canvas").CanvasResponse> = { ...data };
      if (sanitizedElements) {
        payload.manualElements = sanitizedElements;
      }

      await apiUpdateCanvas(canvasId, payload);

      // Update local state if title changed
      if (data.title) {
        set({ title: data.title });
      }

      set({ loading: false });
    } catch (err) {
      const error = err as Error;
      set({ error: error.message, loading: false });
      throw err;
    }
  },

  getShareToken: async () => {
    const { canvasId } = get();
    if (!canvasId) throw new Error("No canvas ID");
    try {
      const data = await apiGenerateShareLink(canvasId);
      // Backend returns { shareUrl, expiry }
      const token = data.shareUrl;
      set({ shareToken: token });
      return token;
    } catch (err) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  revokeShareToken: async () => {
    const { canvasId } = get();
    if (!canvasId) throw new Error("No canvas ID");
    try {
      await apiRevokeShareLink(canvasId);
      set({ shareToken: null });
    } catch (err) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  setIsReadOnly: (val: boolean) => set({ isReadOnly: val })
}));
