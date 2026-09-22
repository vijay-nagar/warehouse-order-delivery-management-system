import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

export interface TableColumn {
  key: string;
  label: string;
}

interface ResourceTablePageProps {
  title: string;
  description: string;
  endpoint: string;
  columns?: TableColumn[];
  searchPlaceholder?: string;
}

type Row = Record<string, unknown>;

function extractRows(payload: unknown): Row[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Row => !!item && typeof item === "object",
    );
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const object = payload as Record<string, unknown>;

  for (const key of ["data", "items", "results", "rows"]) {
    const value = object[key];

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is Row => !!item && typeof item === "object",
      );
    }

    if (value && typeof value === "object") {
      const nested = extractRows(value);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") {
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
    (key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("created") ||
      key.toLowerCase().includes("updated")) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Date(value).toLocaleString();
  }

  return String(value);
}

function isStatusKey(key: string) {
  return key.toLowerCase().includes("status");
}

export default function ResourceTablePage({
  title,
  description,
  endpoint,
  columns,
  searchPlaceholder = "Search records...",
}: ResourceTablePageProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(endpoint);
      setRows(extractRows(response.data));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to load data. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [endpoint]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        formatValue(value, "").toLowerCase().includes(query),
      ),
    );
  }, [rows, search]);

  const resolvedColumns = useMemo(() => {
    if (columns?.length) {
      return columns;
    }

    if (!rows.length) {
      return [];
    }

    return Object.keys(rows[0])
      .filter((key) => !["password", "token"].includes(key.toLowerCase()))
      .slice(0, 8)
      .map((key) => ({
        key,
        label: formatLabel(key),
      }));
  }, [columns, rows]);

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
        <div className="module-search">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="module-count">
          {visibleRows.length} record{visibleRows.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="module-alert module-alert-error">
          <span>{error}</span>
          <button type="button" onClick={() => void loadData()}>
            Retry
          </button>
        </div>
      )}

      <div className="module-panel">
        {loading ? (
          <div className="module-state">Loading {title.toLowerCase()}...</div>
        ) : visibleRows.length === 0 ? (
          <div className="module-state">
            {search
              ? "No records match your search."
              : `No ${title.toLowerCase()} found.`}
          </div>
        ) : (
          <div className="module-table-wrapper">
            <table className="module-table">
              <thead>
                <tr>
                  {resolvedColumns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row, rowIndex) => (
                  <tr key={String(row.id ?? rowIndex)}>
                    {resolvedColumns.map((column) => {
                      const value = row[column.key];

                      return (
                        <td key={column.key}>
                          {isStatusKey(column.key) ? (
                            <span className="module-status">
                              {formatValue(value, column.key)}
                            </span>
                          ) : (
                            <span className="module-cell-value">
                              {formatValue(value, column.key)}
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
      </div>
    </section>
  );
}
