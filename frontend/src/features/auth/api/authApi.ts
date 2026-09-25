import { request } from "../../../shared/api/request";
import type { ResourceRow } from "../../../shared/types/api";
import type { LoginRequest, LoginResponse } from "../types";

export const authApi = {
  login: (data: LoginRequest) => request<LoginResponse["data"]>({ method: "POST", url: "/api/auth/login", data }),
  me: () => request<ResourceRow>({ method: "GET", url: "/api/auth/me" }),
};
