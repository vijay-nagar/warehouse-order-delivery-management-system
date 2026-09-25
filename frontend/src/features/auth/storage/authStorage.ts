import type { AuthUser } from "../types";

const TOKEN_KEY = "warehouse_access_token";
const USER_KEY = "warehouse_user";
const stores = [sessionStorage, localStorage];

const getItem = (key: string): string | null => stores.find((store) => store.getItem(key) !== null)?.getItem(key) ?? null;

export const getAccessToken = (): string | null => getItem(TOKEN_KEY);

interface TokenPayload { exp?: number; }

export const isAccessTokenExpired = (): boolean => {
  const token = getAccessToken();
  if (!token) return true;

  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as TokenPayload;
    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const getStoredUser = (): AuthUser | null => {
  const value = getItem(USER_KEY);

  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    stores.forEach((store) => store.removeItem(USER_KEY));
    return null;
  }
};

export const setAuth = (token: string, user: AuthUser, persistent = true): void => {
  const destination = persistent ? localStorage : sessionStorage;
  const otherStore = persistent ? sessionStorage : localStorage;
  otherStore.removeItem(TOKEN_KEY);
  otherStore.removeItem(USER_KEY);
  destination.setItem(TOKEN_KEY, token);
  destination.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
  stores.forEach((store) => {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  });
};
