const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function Pagination({
  page,
  pageCount,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  if (pageCount <= 1 && !onPageSizeChange) return null;

  return (
    <nav className="module-pagination" aria-label="Pagination">
      {typeof totalRecords === "number" && <span>{totalRecords} total</span>}
      <button type="button" disabled={page === 1} onClick={() => onPageChange(1)}>
        First
      </button>
      <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
      <button type="button" disabled={page === pageCount} onClick={() => onPageChange(pageCount)}>
        Last
      </button>
      {onPageSizeChange && pageSize !== undefined && (
        <label>
          Page size{" "}
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}
