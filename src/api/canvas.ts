import {api} from "@/lib/api";
import type { Shape, Connector } from "../types/types";

export type CanvasResponse = {
  id: string;
  title: string;
  manualElements: Shape[];
  manualConnectors: Connector[];
  code: string;
  createdAt: number;
  camera?: {
    scale: number;
    offset: { x: number; y: number };
  };
  generatedGroupOffset?: { x: number; y: number };
};

export async function createCanvas (title: string) {
  const response = await api.post("/canvas", {title});

  return response.data.data;
}

export async function getCanvas (id: string) {
  const response = await api.get(`/canvas/${id}`);
  return response.data.data as CanvasResponse;
}

export async function updateCanvas (id: string, data: Partial<CanvasResponse>) {
  console.log("Updating canvas", id, data); 
  const response = await api.put(`/canvas/${id}`, data);
  return response.data.data;
}


export async function listCanvases () {
  const response = await api.get("/canvas");
  return response.data.data;
}

export async function generateShareLink(id: string) {
  const response = await api.post(`/canvas/${id}/share`);
  return response.data.data; // Returns { shareUrl: string, expiry: number }
}

export async function revokeShareLink(id: string) {
  const response = await api.delete(`/canvas/${id}/share`);
  return response.data.data;
}

export async function getSharedCanvas(token: string) {
  const response = await api.get(`/canvas/shared/${token}`);
  console.log(response);
  
  return response.data.data as CanvasResponse;
}

export async function deleteCanvas(id: string) {
  const response = await api.delete(`/canvas/${id}`);
  return response.data.data;
}
