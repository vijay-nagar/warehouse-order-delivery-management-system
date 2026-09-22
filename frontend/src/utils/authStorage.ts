const TOKEN_KEY = "warehouse_access_token";
const USER_KEY = "warehouse_user";

export interface StoredUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): StoredUser | null => {
  const user = localStorage.getItem(USER_KEY);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as StoredUser;
  } catch {
    return null;
  }
};

export const setAuth = (token: string, user: StoredUser): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
