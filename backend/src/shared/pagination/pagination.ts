import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type PaginationMeta,
  type PaginationRequest,
  type PaginationResult,
} from "./pagination.types.js";

export function parsePagination(
  pageValue?: string,
  pageSizeValue?: string,
): PaginationRequest {
  const parsedPage = Number(pageValue);
  const parsedPageSize = Number(pageSizeValue);

  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : DEFAULT_PAGE;

  const pageSize =
    Number.isInteger(parsedPageSize) && parsedPageSize > 0
      ? Math.min(parsedPageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
  };
}

export function getPaginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function getTotalPages(
  totalCount: number,
  pageSize: number,
): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

// Builds the wire-format pagination metadata from an internal
// PaginationResult, so every controller sends the same
// { data, pagination: { page, pageSize, totalRecords, totalPages, hasNext, hasPrevious } }
// shape without duplicating this logic per controller.
export function toPaginationMeta<T>(
  result: Pick<PaginationResult<T>, "page" | "pageSize" | "totalCount" | "totalPages">,
): PaginationMeta {
  return {
    page: result.page,
    pageSize: result.pageSize,
    totalRecords: result.totalCount,
    totalPages: result.totalPages,
    hasNext: result.page < result.totalPages,
    hasPrevious: result.page > 1,
  };
}
