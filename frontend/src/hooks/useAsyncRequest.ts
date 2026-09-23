import { useCallback, useState } from "react";
import { toApiError } from "../services/api/errors";
import type { ApiError } from "../types/api";

export function useAsyncRequest<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (requestError) {
      setError(toApiError(requestError));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, execute, setData };
}
