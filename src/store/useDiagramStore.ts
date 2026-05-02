import {create} from 'zustand';
import type {Shape, Connector} from '../types/types';

type DiagramStore = {
  generatedElements: Shape[];
  generatedConnectors: Connector[];
  setGeneratedElements: (elements: Shape[] | ((prev: Shape[]) => Shape[])) => void;
  setGeneratedConnectors: (connectors: Connector[] | ((prev: Connector[]) => Connector[])) => void;

  // ── Group drag offset ────────────────────────────────────────────────────
  generatedGroupOffset: {x: number; y: number};
  setGeneratedGroupOffset: (offset: {x: number; y: number}) => void;

  // ── Reconciliation state ─────────────────────────────────────────────────
  previousElements: Shape[];
  previousConnectors: Connector[];
  setPreviousElements: (elements: Shape[]) => void;
  setPreviousConnectors: (connectors: Connector[]) => void;

  // ── Highlighting ─────────────────────────────────────────────────────────
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  highlightedRange: {line: number; start: number; end: number} | null;
  setHighlightedRange: (range: {line: number; start: number; end: number} | null) => void;

  // ── Canvas Content (for Welcome Message & Persistence) ──────────────────
  code: string;
  setCode: (code: string) => void;
  manualElements: Shape[];
  setManualElements: (elements: Shape[]) => void;
  manualConnectors: Connector[];
  setManualConnectors: (connectors: Connector[]) => void;
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

  // ── Group drag offset ────────────────────────────────────────────────────
  generatedGroupOffset: {x: 0, y: 0},
  setGeneratedGroupOffset: (offset) => set({generatedGroupOffset: offset}),

  // ── Reconciliation state ─────────────────────────────────────────────────
  previousElements: [],
  previousConnectors: [],
  setPreviousElements: (elements) => set({previousElements: elements}),
  setPreviousConnectors: (connectors) => set({previousConnectors: connectors}),

  // ── Highlighting ─────────────────────────────────────────────────────────
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({selectedNodeId: id}),
  highlightedRange: null,
  setHighlightedRange: (range) => set({highlightedRange: range}),

  // ── Canvas Content ──────────────────────────────────────────────────────
  code: "",
  setCode: (code) => set({code}),
  manualElements: [],
  setManualElements: (manualElements) => set({manualElements}),
  manualConnectors: [],
  setManualConnectors: (manualConnectors) => set({manualConnectors}),
}));
