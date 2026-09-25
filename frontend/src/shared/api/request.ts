import type { AxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "../types/api";
import { apiClient } from "./client";

export const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<T | ApiEnvelope<T>>(config);
  const body = response.data;

  if (body && typeof body === "object" && "data" in body && "success" in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
};
