import type { AxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "../types/api";
import type { PaginatedResult } from "../types/pagination";
import { apiClient } from "./client";

export const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<T | ApiEnvelope<T>>(config);
  const body = response.data;

  if (body && typeof body === "object" && "data" in body && "success" in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
};

// For endpoints that return { success, data, pagination } — unlike request(),
// this keeps the pagination metadata instead of unwrapping to just `data`.
export const requestPaginated = async <T>(
  config: AxiosRequestConfig,
): Promise<PaginatedResult<T>> => {
  const response = await apiClient.request<
    ApiEnvelope<T[]> & { pagination: PaginatedResult<T>["pagination"] }
  >(config);

  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};
