import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";

export const healthApi = {
  health: () => request<ResourceRow>({ method: "GET", url: "/health" }),
  apiHealth: () => request<ResourceRow>({ method: "GET", url: "/api/health" }),
};
