import { useState } from "react";
import { Dialog } from "../components/overlay/Dialog";
import { SearchSelect } from "../components/forms/SearchSelect";
import { ErrorState, LoadingState, PageHeader } from "../components/feedback/AsyncStates";
import { Pagination } from "../components/table/Pagination";
import { useToast } from "../../app/providers/ToastProvider";
import { toApiError } from "../api/errors";
import { usePaginatedResourceList } from "../hooks/usePaginatedResourceList";
import type { ResourceRow } from "../types/api";
import type { PaginatedResult, PaginationParams } from "../types/pagination";

export interface CrudSelectConfig {
  fetchOptions: (search: string) => Promise<ResourceRow[]>;
  getLabel: (row: ResourceRow) => string;
  getDescription?: (row: ResourceRow) => string | undefined;
  placeholder?: string;
  // Resolves the currently-saved id (e.g. Zone.WarehouseId) to its full row
  // so the dropdown can display its label when editing, not just the id.
  resolveOption?: (id: number) => Promise<ResourceRow | null>;
}
export interface CrudField {
  name: string;
  label: string;
  type?: "number" | "email" | "text" | "select";
  required?: boolean;
  select?: CrudSelectConfig;
}
export interface CrudApi {
  list: (params?: PaginationParams) => Promise<PaginatedResult<ResourceRow>>;
  byId: (id: number) => Promise<ResourceRow>;
  create: (data: Record<string, unknown>) => Promise<ResourceRow>;
  update: (id: number, data: Record<string, unknown>) => Promise<ResourceRow>;
  remove?: (id: number) => Promise<unknown>;
  updateStatus?: (id: number, isActive: boolean) => Promise<ResourceRow>;
}

// Some resource APIs (warehouses/zones/shelves/bins) return raw SQL
// PascalCase columns (WarehouseId, Name, Code) instead of the camelCase
// field names used in `fields` configs here. Fall back to the capitalized
// key so editing those resources doesn't silently open a blank form.
function getFieldValue(record: ResourceRow, name: string): unknown {
  if (record[name] !== undefined) return record[name];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return record[capitalized];
}

function toPayload(fields: CrudField[], form: Record<string, string>) {
  return fields.reduce<Record<string, unknown>>((payload, field) => {
    const value = form[field.name]?.trim() ?? "";
    if (value) payload[field.name] = field.type === "number" || field.type === "select" ? Number(value) : value;
    return payload;
  }, {});
}

export function CrudResourcePage({ title, description, api, fields, columns }: { title: string; description: string; api: CrudApi; fields: CrudField[]; columns: string[] }) {
  const { rows, loading, error, reload, page, pageSize, setPage, setPageSize, pagination } =
    usePaginatedResourceList(api.list);
  const { notify } = useToast();
  const [dialog, setDialog] = useState<"create" | "edit" | "detail" | null>(null);
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectValues, setSelectValues] = useState<Record<string, ResourceRow | null>>({});
  const [submitting, setSubmitting] = useState(false);

  const open = async (mode: "edit" | "detail", id: number) => {
    setSubmitting(true);
    try {
      const record = await api.byId(id);
      setSelected(record);
      setForm(Object.fromEntries(fields.map((field) => [field.name, String(getFieldValue(record, field.name) ?? "")])))

      const resolvedSelects: Record<string, ResourceRow | null> = {};
      for (const field of fields) {
        if (field.type === "select" && field.select?.resolveOption) {
          const rawId = Number(getFieldValue(record, field.name));
          resolvedSelects[field.name] = Number.isFinite(rawId) && rawId > 0
            ? await field.select.resolveOption(rawId)
            : null;
        }
      }
      setSelectValues(resolvedSelects);
      setDialog(mode);
    } catch (requestError) { notify(toApiError(requestError).message); }
    finally { setSubmitting(false); }
  };
  const save = async () => {
    setSubmitting(true);
    try {
      const payload = toPayload(fields, form);
      if (dialog === "create") await api.create(payload);
      if (dialog === "edit" && selected) await api.update(Number(selected.Id ?? selected.id), payload);
      await reload();
      setDialog(null);
      notify(`${title} saved.`);
    } catch (requestError) { notify(toApiError(requestError).message); }
    finally { setSubmitting(false); }
  };
  const deactivate = async (record: ResourceRow) => {
    const id = Number(record.Id ?? record.id);
    if (!window.confirm(`Deactivate this ${title.toLowerCase()} record?`)) return;
    setSubmitting(true);
    try {
      if (api.remove) await api.remove(id);
      else if (api.updateStatus) await api.updateStatus(id, false);
      await reload();
      notify(`${title} updated.`);
    } catch (requestError) { notify(toApiError(requestError).message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingState label={`Loading ${title.toLowerCase()}...`} />;
  if (error) return <ErrorState message={error.message} onRetry={() => void reload()} />;
  return <section className="module-page"><PageHeader title={title} description={description} action={<button type="button" className="module-refresh-button" onClick={() => { setForm({}); setSelectValues({}); setSelected(null); setDialog("create"); }} disabled={submitting}>Create</button>} />
    <div className="module-panel"><div className="module-table-wrapper"><table className="module-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((record) => { const id = Number(record.Id ?? record.id); return <tr key={id}>{columns.map((column) => <td
  key={column}
  className={`module-table-cell module-table-cell-${column.toLowerCase()}`}
>
  <span className="module-table-cell-content">
    {String(record[column] ?? "-")}
  </span>
</td>)}<td><button type="button" onClick={() => void open("detail", id)}>View</button><button type="button" onClick={() => void open("edit", id)} disabled={submitting}>Edit</button>{(api.remove || api.updateStatus) ? <button type="button" onClick={() => void deactivate(record)} disabled={submitting}>Deactivate</button> : null}</td></tr>; })}</tbody></table></div><Pagination page={page} pageCount={pagination?.totalPages ?? 1} totalRecords={pagination?.totalRecords} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} /></div>
    <Dialog open={dialog !== null} title={dialog === "detail" ? `${title} details` : `${dialog === "edit" ? "Edit" : "Create"} ${title}`} onClose={() => setDialog(null)}>{dialog === "detail" && selected ? <pre className="record-details">{JSON.stringify(selected, null, 2)}</pre> : <form className="login-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>{fields.map((field, index) => field.type === "select" && field.select ? <SearchSelect key={field.name} id={`crud-field-${field.name}`} label={field.label} required={field.required} autoFocus={index === 0} placeholder={field.select.placeholder} value={selectValues[field.name] ?? null} onChange={(row) => { setSelectValues((current) => ({ ...current, [field.name]: row })); setForm((current) => ({ ...current, [field.name]: row ? String(row.Id ?? row.id ?? "") : "" })); }} fetchOptions={field.select.fetchOptions} getLabel={field.select.getLabel} getDescription={field.select.getDescription} /> : <label className="form-field" key={field.name}><span>{field.label}</span><input autoFocus={index === 0} required={field.required} type={field.type ?? "text"} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} /></label>)}<button className="login-submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button></form>}</Dialog>
  </section>;
}
