import { request, requestPaginated } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";

type Body = Record<string, unknown>;
export const packingApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/packing", data }),
  list: (params?: PaginationParams & { status?: string }) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/packing", params }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/packing/${id}` }),
  assign: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/assign`, data }),
  start: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/start` }),
  createPackage: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/packages`, data }),
  complete: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/packing/${id}/complete`, data }),
};
