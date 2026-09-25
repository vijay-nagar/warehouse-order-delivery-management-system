import { useEffect, useState } from "react";
import { clearAuth, getStoredUser, isAccessTokenExpired } from "../storage/authStorage";
import type { AuthUser } from "../types";

export function useSession() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (isAccessTokenExpired()) {
      clearAuth();
      return null;
    }
    return getStoredUser();
  });

  useEffect(() => {
    const restore = () => {
      if (isAccessTokenExpired()) {
        clearAuth();
        setUser(null);
      } else {
        setUser(getStoredUser());
      }
    };
    window.addEventListener("storage", restore);
    window.addEventListener("warehouse:unauthorized", restore);
    return () => {
      window.removeEventListener("storage", restore);
      window.removeEventListener("warehouse:unauthorized", restore);
    };
  }, []);

  return user;
}
