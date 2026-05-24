import { api } from "@/lib/api";
import type { Shape, Connector } from "../types/types";

export type CanvasResponse = {
  _id: string;                    // ← was id, MongoDB returns _id
  title: string;
  manualElements: Shape[];        // ← same, backend returns same key
  manualConnectors: Connector[];  // ← same, backend returns same key
  code: string;
  camera?: {
    scale: number;
    offset: { x: number; y: number };
  };
  generatedGroupOffset?: { x: number; y: number };
  elementCount?: number;          // ← new, available from backend
  connectorCount?: number;        // ← new, available from backend
  createdAt: string;              // ← was number, MongoDB returns ISO string
  updatedAt: string;              // ← add this, available from backend
};

export async function createCanvas(title: string) {
  const response = await api.post("/canvas", { title });
  return response.data.data;
}

export async function getCanvas(_id: string) {
  const response = await api.get(`/canvas/${_id}`);
  console.log(response.data);
  
  return response.data.data as CanvasResponse;
}

export async function updateCanvas(_id: string, data: Partial<CanvasResponse>) {
  await api.patch(`/canvas/${_id}`, data);
}

export async function listCanvases() {
  const response = await api.get("/canvas");
  return response.data.data as CanvasResponse[];
}

export async function generateShareLink(_id: string) {
  const response = await api.post(`/canvas/${_id}/share`);
  return response.data.data as { shareUrl: string; expiry: string };
}

export async function revokeShareLink(_id: string) {
  const response = await api.delete(`/canvas/${_id}/share`);
  return response.data.data;
}

export async function getSharedCanvas(token: string) {
  const response = await api.get(`/canvas/shared/${token}`);
  return response.data.data as CanvasResponse;
}

export async function deleteCanvas(_id: string) {
  const response = await api.delete(`/canvas/${_id}`);
  return response.data.data;
}