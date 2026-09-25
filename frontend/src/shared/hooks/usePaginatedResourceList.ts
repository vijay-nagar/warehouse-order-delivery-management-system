import { useCallback, useEffect, useState } from "react";
import { useAsyncRequest } from "./useAsyncRequest";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
  type PaginationParams,
} from "../types/pagination";

// Server-side paginated list state: owns page/pageSize/search, calls the
// paginated loader whenever they change, resets to page 1 on a new search,
// and steps back a page when the current page becomes empty (e.g. after a
// delete). Callers should disable pagination controls while `loading` is
// true — that is the concurrency guard against duplicate/overlapping
// requests, rather than request cancellation inside the hook.
export function usePaginatedResourceList<T>(
  loadPage: (params: PaginationParams) => Promise<PaginatedResult<T>>,
) {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");

  const { data, error, loading, execute } = useAsyncRequest<PaginatedResult<T>>();

  const load = useCallback(
    () => execute(() => loadPage({ page, pageSize, search: search || undefined })),
    [execute, loadPage, page, pageSize, search],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (data && data.data.length === 0 && page > 1) {
      setPage((current) => current - 1);
    }
  }, [data, page]);

  const changeSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(DEFAULT_PAGE);
  }, []);

  const changePageSize = useCallback((value: number) => {
    setPageSize(value);
    setPage(DEFAULT_PAGE);
  }, []);

  return {
    rows: data?.data ?? [],
    pagination: data?.pagination ?? null,
    loading,
    error,
    page,
    pageSize,
    search,
    setPage,
    setPageSize: changePageSize,
    setSearch: changeSearch,
    reload: load,
  };
}
