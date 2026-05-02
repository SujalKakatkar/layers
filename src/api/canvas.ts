import {api} from "@/lib/api";

export type CanvasResponse = {
  id: string;
  title: string;
  manualElements: any[];
  manualConnectors: any[];
  code: string;
  createdAt: number;
};

export async function createCanvas (title: string) {
  const response = await api.post("/canvas", {title});

  return response.data.data;
}

export async function getCanvas (id: string) {
  const response = await api.get(`/canvas/${id}`);
  return response.data.data as CanvasResponse;
}

export async function updateCanvas (id: string, data: any) {
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
  return response.data.data as CanvasResponse;
}
