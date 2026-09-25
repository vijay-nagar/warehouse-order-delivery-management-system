import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";

export const notificationsApi = {
  mine: () => request<ResourceRow[]>({ method: "GET", url: "/api/notifications/me" }),
  unread: () => request<ResourceRow[]>({ method: "GET", url: "/api/notifications/me/unread" }),
  markRead: (id: number) => request<ResourceRow>({ method: "PATCH", url: `/api/notifications/${id}/read` }),
  create: (data: Record<string, unknown>) => request<ResourceRow>({ method: "POST", url: "/api/notifications", data }),
};
