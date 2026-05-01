import { create } from 'zustand';
import { createCanvas as apiCreateCanvas, getCanvas, updateCanvas as apiUpdateCanvas, listCanvases } from '@/api/canvas';
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
  
  setCanvasId: (id: string) => void;
  createCanvas: (title: string) => Promise<string>;
  fetchCanvas: (id: string) => Promise<void>;
  listAllCanvases: () => Promise<void>;
  updateCanvas: (data: {
    manualElements: any[];
    manualConnectors: any[];
    code: string;
    generatedGroupOffset: { x: number; y: number };
  }) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvasId: null,
  title: "Untitled Canvas",
  loading: false,
  canvases: [],
  error: null,

  setCanvasId: (id: string) => set({ canvasId: id }),

  createCanvas: async (title: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiCreateCanvas(title);
      set({ canvasId: data._id, title, loading: false });
      return data._id;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchCanvas: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await getCanvas(id);
      set({ canvasId: id, title: data.title, loading: false });
      
      // Push into existing stores
      const diagramStore = useDiagramStore.getState();
      diagramStore.setManualElements(data.manualElements || []);
      diagramStore.setManualConnectors(data.connectors || []);
      diagramStore.setCode(data.code || "");
      // Assuming generatedGroupOffset might be in the response or we use default
      if ((data as any).generatedGroupOffset) {
        diagramStore.setGeneratedGroupOffset((data as any).generatedGroupOffset);
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  listAllCanvases: async () => {
    set({ loading: true, error: null });
    try {
      const data = await listCanvases();
      set({ canvases: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateCanvas: async (data) => {
    const { canvasId } = get();
    if (!canvasId) return;

    set({ loading: true, error: null });
    try {
      // Data Sanitization
      const sanitizedElements = data.manualElements.map(el => {
        const { isGenerated, source, ...rest } = el;
        return rest;
      });

      await apiUpdateCanvas(canvasId, {
        ...data,
        manualElements: sanitizedElements
      });
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
