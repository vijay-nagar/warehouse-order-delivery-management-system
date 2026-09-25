import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type {
  PaginationParams,
  PaginationResult,
} from "../../../shared/types/pagination";

type Body = Record<string, unknown>;
export const ordersApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/orders", data }),
  list: (params?: PaginationParams) =>
    request<PaginationResult<ResourceRow>>({
      method: "GET",
      url: "/api/orders",
      params,
    }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/orders/${id}` }),
  cancel: (id: number) => request<ResourceRow>({ method: "POST", url: `/api/orders/${id}/cancel` }),
};
