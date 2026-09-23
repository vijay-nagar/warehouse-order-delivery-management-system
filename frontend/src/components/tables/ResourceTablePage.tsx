import { useEffect, useMemo, useState } from "react";
import { useResourceList } from "../../hooks/useResourceList";

export interface TableColumn {
  key: string;
  label: string;
}

interface ResourceTablePageProps {
  title: string;
  description: string;
  loadRecords: () => Promise<Row[]>;
  columns?: TableColumn[];
  searchPlaceholder?: string;
}

type Row = Record<string, unknown>;

const PAGE_SIZE = 20;

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[\_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown, key: string) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (
    typeof value === "string" &&
    (
      key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("created") ||
      key.toLowerCase().includes("updated")
    ) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Date(value).toLocaleString();
  }

  return String(value);
}

function isStatusKey(key: string) {
  return key.toLowerCase().includes("status");
}

function getStatus(row: Row) {
  const key = Object.keys(row).find(
    (item) => item.toLowerCase() === "status",
  );

  return key ? String(row[key] ?? "") : "";
}

function getDateValue(row: Row) {
  const key = Object.keys(row).find((item) => {
    const lowerKey = item.toLowerCase();

    return (
      lowerKey === "createdat" ||
      lowerKey === "created_at" ||
      lowerKey === "createddate"
    );
  });

  return key ? String(row[key] ?? "") : "";
}

function escapeCsvValue(value: unknown) {
  const text = formatValue(value, "");

  return `"${text.replace(/"/g, '""')}"`;
}

export default function ResourceTablePage({
  title,
  description,
  loadRecords,
  columns,
  searchPlaceholder = "Search records...",
}: ResourceTablePageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [refreshing, setRefreshing] = useState(false);
  const { rows, error, loading, reload } = useResourceList(loadRecords);
  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    await reload();
    setCurrentPage(1);
    setRefreshing(false);
  };

  const resolvedColumns = useMemo(() => {
    if (columns?.length) {
      return columns;
    }

    if (!rows.length) {
      return [];
    }

    return Object.keys(rows[0])
      .filter(
        (key) =>
          !["password", "token"].includes(
            key.toLowerCase(),
          ),
      )
      .slice(0, 8)
      .map((key) => ({
        key,
        label: formatLabel(key),
      }));
  }, [columns, rows]);

  const statusOptions = useMemo(() => {
    const statuses = rows
      .map((row) => getStatus(row).trim())
      .filter(Boolean);

    return Array.from(new Set(statuses)).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        Object.entries(row).some(([key, value]) =>
          formatValue(value, key)
            .toLowerCase()
            .includes(query),
        );

      const rowStatus = getStatus(row).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        rowStatus === statusFilter.toLowerCase();

      const rawDate = getDateValue(row);
      const rowDate = rawDate
        ? new Date(rawDate)
        : null;

      const matchesFromDate =
        !fromDate ||
        (
          rowDate &&
          !Number.isNaN(rowDate.getTime()) &&
          rowDate >= new Date(`${fromDate}T00:00:00`)
        );

      const matchesToDate =
        !toDate ||
        (
          rowDate &&
          !Number.isNaN(rowDate.getTime()) &&
          rowDate <= new Date(`${toDate}T23:59:59`)
        );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    rows,
    search,
    statusFilter,
    fromDate,
    toDate,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE),
  );

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredRows.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const exportCsv = () => {
    if (!filteredRows.length || !resolvedColumns.length) {
      return;
    }

    const headers = resolvedColumns.map(
      (column) => escapeCsvValue(column.label),
    );

    const dataRows = filteredRows.map((row) =>
      resolvedColumns.map((column) =>
        escapeCsvValue(row[column.key]),
      ),
    );

    const csvContent = [
      headers.join(","),
      ...dataRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(
      [`\uFEFF${csvContent}`],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${title
      .toLowerCase()
      .replace(/\s+/g, "-")}-export.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <section className="module-page">
      <div className="module-page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <button
          type="button"
          className="module-refresh-button"
          onClick={() => void loadData(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="module-toolbar">
      <div className="module-search filter-input-wrapper">
  <input
    type="search"
    value={search}
    maxLength={100}
    onChange={(event) => {
      const value = event.target.value
        .replace(/\s+/g, " ")
        .trimStart();

      setSearch(value);
      setCurrentPage(1);
    }}
    placeholder={searchPlaceholder}
    aria-label="Search records"
  />

  {search && (
    <button
      type="button"
      className="filter-clear-button"
      onClick={() => {
        setSearch("");
        setCurrentPage(1);
      }}
      aria-label="Clear search"
    >
      ×
    </button>
  )}
</div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>

          {statusOptions.map((status) => (
            <option
              key={status}
              value={status.toLowerCase()}
            >
              {status}
            </option>
          ))}
        </select>

       <div className="filter-input-wrapper">
  <input
    type="date"
    value={fromDate}
    max={toDate || undefined}
    onChange={(event) => {
      const value = event.target.value;

      setFromDate(value);
      setCurrentPage(1);

    }}
    aria-label="From date"
  />

  {fromDate && (
    <button
      type="button"
      className="filter-clear-button"
      onClick={() => {
        setFromDate("");
        setCurrentPage(1);
      }}
      aria-label="Clear from date"
    >
      ×
    </button>
  )}
</div>
        <button
          type="button"
          onClick={clearFilters}
        >
          Clear
        </button>

        <button
          type="button"
          onClick={exportCsv}
          disabled={!filteredRows.length}
        >
          Export CSV
        </button>

        <div className="module-count">
          {filteredRows.length} record
          {filteredRows.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="module-alert module-alert-error">
          <span>{error.message}</span>

          <button
            type="button"
            onClick={() => void loadData()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="module-panel">
        {loading ? (
          <div className="module-state">
            Loading {title.toLowerCase()}...
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="module-state">
            {search ||
            statusFilter !== "all" ||
            fromDate ||
            toDate
              ? "No records match your filters."
              : `No ${title.toLowerCase()} found.`}
          </div>
        ) : (
          <div className="module-table-wrapper">
            <table className="module-table">
              <thead>
                <tr>
                  {resolvedColumns.map((column) => (
                    <th key={column.key}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, rowIndex) => (
                  <tr
                    key={String(
                      row.id ??
                        row.Id ??
                        (currentPage - 1) * PAGE_SIZE +
                          rowIndex,
                    )}
                  >
                    {resolvedColumns.map((column) => {
                      const value = row[column.key];

                      return (
                        <td key={column.key}>
                          {isStatusKey(column.key) ? (
                            <span className="module-status">
                              {formatValue(
                                value,
                                column.key,
                              )}
                            </span>
                          ) : (
                            <span className="module-cell-value">
                              {formatValue(
                                value,
                                column.key,
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredRows.length > 0 && (
          <div className="module-pagination">
            <span>
              Showing{" "}
              {(currentPage - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(
                currentPage * PAGE_SIZE,
                filteredRows.length,
              )}{" "}
              of {filteredRows.length}
            </span>

            <div>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
