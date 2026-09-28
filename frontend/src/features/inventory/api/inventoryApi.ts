import { request, requestPaginated } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";

type Body = Record<string, unknown>;
export const inventoryApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/inventory", data }),
  list: (params?: PaginationParams & { binId?: number; warehouseId?: number; productId?: number }) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/inventory", params }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/inventory/${id}` }),
  update: (id: number, data: Body) => request<ResourceRow>({ method: "PUT", url: `/api/inventory/${id}`, data }),
  updateStatus: (id: number, isActive: boolean) => request<ResourceRow>({ method: "PATCH", url: `/api/inventory/${id}/status`, data: { isActive } }),
  reserve: (orderId: number) => request<ResourceRow[]>({ method: "POST", url: `/api/inventory/reservations/${orderId}` }),
};
export const inventoryReservationApi = {
  reserve: (orderId: number) => request<ResourceRow[]>({ method: "POST", url: `/api/inventory-reservation/${orderId}` }),
};
export const inventoryTransactionsApi = {
  stockIn: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/inventory-transactions/stock-in", data }),
  stockOut: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/inventory-transactions/stock-out", data }),
  adjustment: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/inventory-transactions/adjustment", data }),
  history: (inventoryId: number, params?: PaginationParams) =>
    requestPaginated<ResourceRow>({ method: "GET", url: `/api/inventory-transactions/history/${inventoryId}`, params }),
};
