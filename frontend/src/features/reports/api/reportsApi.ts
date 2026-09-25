import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";

export const reportsApi = {
  orderSummary: (fromDate?: string, toDate?: string) => request<ResourceRow>({ method: "GET", url: "/api/reports/orders/summary", params: { ...(fromDate ? { fromDate } : {}), ...(toDate ? { toDate } : {}) } }),
};
