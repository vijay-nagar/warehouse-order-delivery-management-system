import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";

type Body = Record<string, unknown>;
export const packingApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/packing", data }),
  list: () => request<ResourceRow[]>({ method: "GET", url: "/api/packing" }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/packing/${id}` }),
  assign: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/assign`, data }),
  start: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/start` }),
  createPackage: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/packages`, data }),
  complete: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/complete`, data }),
};
