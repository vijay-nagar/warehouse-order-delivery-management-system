import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";

type Body = Record<string, unknown>;
export const ordersApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/orders", data }),
  list: () => request<ResourceRow[]>({ method: "GET", url: "/api/orders" }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/orders/${id}` }),
  cancel: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/orders/${id}/cancel` }),
};
