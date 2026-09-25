import { request, requestPaginated } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";

export const notificationsApi = {
  mine: (params?: PaginationParams) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/notifications/me", params }),
  unread: (params?: PaginationParams) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/notifications/me/unread", params }),
  markRead: (id: number) => request<ResourceRow>({ method: "PATCH", url: `/api/notifications/${id}/read` }),
  create: (data: Record<string, unknown>) => request<ResourceRow>({ method: "POST", url: "/api/notifications", data }),
};
