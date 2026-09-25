import axios from "axios";
import { env } from "../../app/config/env";
import { clearAuth, getAccessToken } from "../../features/auth/storage/authStorage";

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAuth();
      window.dispatchEvent(new Event("warehouse:unauthorized"));
    }
    return Promise.reject(error);
  },
);
