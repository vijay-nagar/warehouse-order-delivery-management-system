import { useState } from "react";
import { Dialog } from "../common/Dialog";
import { ErrorState, LoadingState, PageHeader } from "../common/AsyncStates";
import { useToast } from "../common/Toast";
import { toApiError } from "../../services/api/errors";
import { useResourceList } from "../../hooks/useResourceList";
import type { ResourceRow } from "../../types/api";

export interface CrudField { name: string; label: string; type?: "number" | "email" | "text"; required?: boolean; }
export interface CrudApi {
  list: () => Promise<ResourceRow[]>;
  byId: (id: number) => Promise<ResourceRow>;
  create: (data: Record<string, unknown>) => Promise<ResourceRow>;
  update: (id: number, data: Record<string, unknown>) => Promise<ResourceRow>;
  remove?: (id: number) => Promise<unknown>;
  updateStatus?: (id: number, isActive: boolean) => Promise<ResourceRow>;
}

function toPayload(fields: CrudField[], form: Record<string, string>) {
  return fields.reduce<Record<string, unknown>>((payload, field) => {
    const value = form[field.name]?.trim() ?? "";
    if (value) payload[field.name] = field.type === "number" ? Number(value) : value;
    return payload;
  }, {});
}

export function CrudResourcePage({ title, description, api, fields, columns }: { title: string; description: string; api: CrudApi; fields: CrudField[]; columns: string[] }) {
  const { rows, loading, error, reload } = useResourceList(api.list);
  const { notify } = useToast();
  const [dialog, setDialog] = useState<"create" | "edit" | "detail" | null>(null);
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const open = async (mode: "edit" | "detail", id: number) => {
    setSubmitting(true);
    try {
      const record = await api.byId(id);
      setSelected(record);
      setForm(Object.fromEntries(fields.map((field) => [field.name, String(record[field.name] ?? "")])))
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
  return <section className="module-page"><PageHeader title={title} description={description} action={<button type="button" className="module-refresh-button" onClick={() => { setForm({}); setSelected(null); setDialog("create"); }} disabled={submitting}>Create</button>} />
    <div className="module-panel"><div className="module-table-wrapper"><table className="module-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((record) => { const id = Number(record.Id ?? record.id); return <tr key={id}>{columns.map((column) => <td key={column}>{String(record[column] ?? "-")}</td>)}<td><button type="button" onClick={() => void open("detail", id)}>View</button><button type="button" onClick={() => void open("edit", id)} disabled={submitting}>Edit</button>{(api.remove || api.updateStatus) ? <button type="button" onClick={() => void deactivate(record)} disabled={submitting}>Deactivate</button> : null}</td></tr>; })}</tbody></table></div></div>
    <Dialog open={dialog !== null} title={dialog === "detail" ? `${title} details` : `${dialog === "edit" ? "Edit" : "Create"} ${title}`} onClose={() => setDialog(null)}>{dialog === "detail" && selected ? <pre className="record-details">{JSON.stringify(selected, null, 2)}</pre> : <form className="login-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>{fields.map((field) => <label className="form-field" key={field.name}><span>{field.label}</span><input required={field.required} type={field.type ?? "text"} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} /></label>)}<button className="login-submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button></form>}</Dialog>
  </section>;
}
