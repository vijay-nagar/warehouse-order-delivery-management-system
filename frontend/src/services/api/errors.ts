import type { AxiosError } from "axios";
import type { ApiError } from "../../types/api";

const fallbackMessages: Record<number, string> = {
  401: "Your session has ended. Please sign in again.",
  403: "You do not have access to perform this action.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on the server. Please try again later.",
};

export const toApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<{ message?: string; errors?: unknown }>;
  const status = axiosError.response?.status;
  const serverMessage = axiosError.response?.data?.message;

  return {
    status,
    message: status && fallbackMessages[status]
      ? fallbackMessages[status]
      : serverMessage ?? "Unable to complete the request. Please try again.",
    fieldErrors: axiosError.response?.data?.errors,
  };
};
