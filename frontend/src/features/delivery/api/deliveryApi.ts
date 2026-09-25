import { request, requestPaginated } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";

type Body = Record<string, unknown>;
export const deliveryApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/delivery", data }),
  list: (params?: PaginationParams & { status?: string }) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/delivery", params }),
  myDeliveries: (params?: PaginationParams) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/delivery/my-deliveries", params }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/delivery/${id}` }),
  assign: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/delivery/${id}/assign`, data }),
  pickup: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/delivery/${id}/pickup` }),
  outForDelivery: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/delivery/${id}/out-for-delivery` }),
  addTracking: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/delivery/${id}/tracking`, data }),
  deliver: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/delivery/${id}/delivered` }),
  fail: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/delivery/${id}/failed`, data }),
  return: (id: number, data: Body) => request<ResourceRow>({ method: "POST", url: `/api/delivery/${id}/returned`, data }),
};
