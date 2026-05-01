import { api } from "@/lib/api";

export type CanvasResponse = {
  id: string;
  title: string;
  manualElements: any[];
  connectors: any[];
  code: string;
  createdAt: number;
};

export async function createCanvas(title: string) {
  const response = await api.post("/canvas", {title});

  return response.data.data;
}

export async function getCanvas(id: string) {
  const response = await api.get(`/canvas/${id}`);
  return response.data.data as CanvasResponse;
}

export async function updateCanvas(id: string, data: any) {
  const response = await api.put(`/canvas/${id}`, data);
  return response.data.data;
}
export async function listCanvases() {
  const response = await api.get("/canvas");
  return response.data.data;
}
