import { request, requestPaginated } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";

type Body = Record<string, unknown>;
export const customersApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/customers", data }),
  list: (params?: PaginationParams) =>
    requestPaginated<ResourceRow>({ method: "GET", url: "/api/customers", params }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/customers/${id}` }),
  update: (id: number, data: Body) => request<ResourceRow>({ method: "PUT", url: `/api/customers/${id}`, data }),
  remove: (id: number) => request<ResourceRow>({ method: "DELETE", url: `/api/customers/${id}` }),
};
