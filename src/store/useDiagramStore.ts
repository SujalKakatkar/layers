import { create } from 'zustand';
import type { Shape, Connector } from '../types/types';

type DiagramStore = {
  generatedElements: Shape[];
  generatedConnectors: Connector[];
  setGeneratedElements: (elements: Shape[] | ((prev: Shape[]) => Shape[])) => void;
  setGeneratedConnectors: (connectors: Connector[] | ((prev: Connector[]) => Connector[])) => void;
};

export const useDiagramStore = create<DiagramStore>((set) => ({
  generatedElements: [],
  generatedConnectors: [],
  setGeneratedElements: (elements) => 
    set((state) => ({ 
      generatedElements: typeof elements === 'function' ? elements(state.generatedElements) : elements 
    })),
  setGeneratedConnectors: (connectors) => 
    set((state) => ({ 
      generatedConnectors: typeof connectors === 'function' ? connectors(state.generatedConnectors) : connectors 
    })),
}));
