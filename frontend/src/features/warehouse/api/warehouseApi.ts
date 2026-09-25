import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";

type Body = Record<string, unknown>;
const warehouseResourceApi = (baseUrl: string) => ({
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: baseUrl, data }),
  list: () => request<ResourceRow[]>({ method: "GET", url: baseUrl }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `${baseUrl}/${id}` }),
  update: (id: number, data: Body) => request<ResourceRow>({ method: "PUT", url: `${baseUrl}/${id}`, data }),
  updateStatus: (id: number, isActive: boolean) => request<ResourceRow>({ method: "PATCH", url: `${baseUrl}/${id}/status`, data: { isActive } }),
});

export const warehousesApi = warehouseResourceApi("/api/warehouses");
export const zonesApi = warehouseResourceApi("/api/zones");
export const shelvesApi = warehouseResourceApi("/api/shelves");
export const binsApi = warehouseResourceApi("/api/bins");
