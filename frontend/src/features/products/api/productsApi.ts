import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";

type Body = Record<string, unknown>;
export const productsApi = {
  create: (data: Body) => request<ResourceRow>({ method: "POST", url: "/api/products", data }),
  list: () => request<ResourceRow[]>({ method: "GET", url: "/api/products" }),
  byId: (id: number) => request<ResourceRow>({ method: "GET", url: `/api/products/${id}` }),
  update: (id: number, data: Body) => request<ResourceRow>({ method: "PUT", url: `/api/products/${id}`, data }),
  remove: (id: number) => request<ResourceRow>({ method: "DELETE", url: `/api/products/${id}` }),
};
