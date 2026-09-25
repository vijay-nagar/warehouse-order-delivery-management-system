import { useCallback, useEffect } from "react";
import { useAsyncRequest } from "./useAsyncRequest";

export function useResourceList<T>(loadRecords: () => Promise<T[]>) {
  const { data, error, loading, execute } = useAsyncRequest<T[]>();
  const load = useCallback(() => execute(loadRecords), [execute, loadRecords]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows: data ?? [], error, loading, reload: load };
}
