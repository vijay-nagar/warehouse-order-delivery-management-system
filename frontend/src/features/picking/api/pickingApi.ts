import { request, requestPaginated } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";

type Body = Record<string, unknown>;
export const pickingApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/picking", data }),
  list: (params?: PaginationParams & { status?: string }) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/picking", params }),
  myTasks: (params?: PaginationParams & { status?: string }) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/picking/my-tasks", params }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/picking/${id}` }),
  assign: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/picking/${id}/assign`, data }),
  reassign: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/picking/${id}/reassign`, data }),
  start: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/picking/${id}/start` }),
  complete: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/picking/${id}/complete`, data }),
  updateItem: (id: number, itemId: number, data: Body) => request<ResourceRow>({ method: "PATCH", url: `/api/picking/${id}/items/${itemId}`, data }),
};
