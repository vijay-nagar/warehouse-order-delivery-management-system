import { useEffect, useRef, useState } from "react";
import type { ResourceRow } from "../../types/api";

interface SearchSelectProps {
  id: string;
  label: string;
  placeholder?: string;
  value: ResourceRow | null;
  onChange: (row: ResourceRow | null) => void;
  fetchOptions: (search: string) => Promise<ResourceRow[]>;
  getLabel: (row: ResourceRow) => string;
  getDescription?: (row: ResourceRow) => string | undefined;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
}

// Minimal searchable dropdown: types to filter server-side (debounced),
// shows loading/empty/error states, and reports the selected row (not just
// an id) so callers can read other fields off it (e.g. price, stock).
export function SearchSelect({
  id,
  label,
  placeholder,
  value,
  onChange,
  fetchOptions,
  getLabel,
  getDescription,
  disabled,
  required,
  autoFocus,
}: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      fetchOptions(query)
        .then((rows) => setOptions(rows))
        .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load options."))
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query, fetchOptions]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const select = (row: ResourceRow) => {
    onChange(row);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery("");
  };

  return (
    <div className="search-select" ref={containerRef}>
      <label className="form-field" htmlFor={id}>
        <span>{label}</span>
        {value ? (
          <div className="search-select-chosen">
            <span>{getLabel(value)}</span>
            {!disabled ? (
              <button type="button" className="search-select-clear" aria-label={`Clear ${label}`} onClick={clear}>
                ×
              </button>
            ) : null}
          </div>
        ) : (
          <input
            id={id}
            type="text"
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
          />
        )}
      </label>
      {open && !value ? (
        <ul className="search-select-list" role="listbox">
          {loading ? <li className="search-select-status">Loading...</li> : null}
          {!loading && loadError ? <li className="search-select-status search-select-error">{loadError}</li> : null}
          {!loading && !loadError && options.length === 0 ? (
            <li className="search-select-status">No results found.</li>
          ) : null}
          {!loading &&
            !loadError &&
            options.map((row) => (
              <li key={String(row.id)}>
                <button type="button" onClick={() => select(row)}>
                  <span>{getLabel(row)}</span>
                  {getDescription?.(row) ? <small>{getDescription(row)}</small> : null}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
