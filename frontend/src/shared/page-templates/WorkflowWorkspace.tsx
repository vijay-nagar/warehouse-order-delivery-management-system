import { useState, type ReactNode } from "react";
import { Dialog } from "../components/overlay/Dialog";
import {
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../components/feedback/AsyncStates";
import { Pagination } from "../components/table/Pagination";
import { useToast } from "../../app/providers/ToastProvider";
import { usePaginatedResourceList } from "../hooks/usePaginatedResourceList";
import { toApiError } from "../api/errors";
import type { ResourceRow } from "../types/api";
import type { PaginatedResult, PaginationParams } from "../types/pagination";

export interface WorkflowField {
  name: string;
  label: string;
  type?: "number" | "text";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  maxLength?: number;
}

export interface WorkflowAction {
  label: string;
  statuses: string[];
  fields?: WorkflowField[];
  confirm?: string;
  execute: (
    id: number,
    data: Record<string, unknown>,
  ) => Promise<unknown>;
}

interface WorkflowWorkspaceProps {
  title: string;
  description: string;
  list: (params?: PaginationParams) => Promise<PaginatedResult<ResourceRow>>;
  byId: (id: number) => Promise<ResourceRow>;
  actions: WorkflowAction[];
  columns: string[];
  headerControl?: ReactNode;
  topContent?: ReactNode;
}

export function WorkflowWorkspace({
  title,
  description,
  list,
  byId,
  actions,
  columns,
  headerControl,
  topContent,
}: WorkflowWorkspaceProps) {
  const { rows, loading, error, reload, page, pageSize, setPage, setPageSize, pagination } =
    usePaginatedResourceList(list);

  const { notify } = useToast();

  const [selected, setSelected] =
    useState<ResourceRow | null>(null);

  const [action, setAction] =
    useState<WorkflowAction | null>(null);

  const [values, setValues] =
    useState<Record<string, string>>({});

  const [submitting, setSubmitting] =
    useState(false);

  const showDetail = async (id: number) => {
    setSubmitting(true);

    try {
      setSelected(await byId(id));
    } catch (requestError) {
      notify(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!selected || !action) return;

    for (const field of action.fields ?? []) {
      const value =
        values[field.name]?.trim() ?? "";

      if (field.required && !value) {
        notify(`${field.label} is required.`);
        return;
      }

      if (field.type === "number" && value) {
        const numberValue = Number(value);

        if (
          !Number.isFinite(numberValue) ||
          (field.min !== undefined &&
            numberValue < field.min) ||
          (field.max !== undefined &&
            numberValue > field.max)
        ) {
          notify(
            `Enter a valid ${field.label.toLowerCase()}.`,
          );
          return;
        }
      }
    }

    if (
      action.confirm &&
      !window.confirm(action.confirm)
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const data = Object.fromEntries(
        (action.fields ?? []).map((field) => [
          field.name,
          field.type === "number"
            ? Number(values[field.name])
            : values[field.name],
        ]),
      );

      await action.execute(
        Number(selected.Id ?? selected.id),
        data,
      );

      const refreshed = await byId(
        Number(selected.Id ?? selected.id),
      );

      setSelected(refreshed);

      await reload();

      setAction(null);

      notify(`${action.label} completed.`);
    } catch (requestError) {
      notify(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        label={`Loading ${title.toLowerCase()}...`}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <section className="module-page">
      <PageHeader
        title={title}
        description={description}
        action={
          <div className="workflow-header-actions">
            {headerControl}

            <button
              type="button"
              className="module-refresh-button"
              onClick={() => void reload()}
            >
              Refresh
            </button>
          </div>
        }
      />

      {topContent}

      <div className="module-panel">
        <div className="module-table-wrapper">
          <table className="module-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>
                    {column}
                  </th>
                ))}

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const id = Number(
                  row.Id ?? row.id,
                );

                const status = String(
                  row.Status ??
                    row.status ??
                    "",
                );

                return (
                  <tr key={id}>
                    {columns.map((column) => (
                      <td key={column}>
                        {column.toLowerCase() ===
                        "status" ? (
                          <StatusBadge>
                            {String(
                              row[column] ?? "-",
                            )}
                          </StatusBadge>
                        ) : (
                          String(
                            row[column] ?? "-",
                          )
                        )}
                      </td>
                    ))}

                    <td>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          void showDetail(id)
                        }
                      >
                        Details
                      </button>

                      {actions
                        .filter((item) =>
                          item.statuses.includes(
                            status,
                          ),
                        )
                        .map((item) => (
                          <button
                            type="button"
                            key={item.label}
                            disabled={submitting}
                            onClick={() => {
                              setSelected(row);
                              setValues({});
                              setAction(item);
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pageCount={pagination?.totalPages ?? 1}
          totalRecords={pagination?.totalRecords}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Dialog
        open={
          selected !== null &&
          action === null
        }
        title={`${title} details`}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <pre className="record-details">
            {JSON.stringify(
              selected,
              null,
              2,
            )}
          </pre>
        ) : null}
      </Dialog>

      <Dialog
        open={action !== null}
        title={action?.label ?? "Action"}
        onClose={() => setAction(null)}
      >
        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {(action?.fields ?? []).map(
            (field) => (
              <label
                className="form-field"
                key={field.name}
              >
                <span>{field.label}</span>

                <input
                  required={field.required}
                  type={field.type ?? "text"}
                  min={
                    field.type === "number"
                      ? field.min
                      : undefined
                  }
                  max={
                    field.type === "number"
                      ? field.max
                      : undefined
                  }
                  step={
                    field.type === "number"
                      ? field.step
                      : undefined
                  }
                  maxLength={field.maxLength}
                  value={
                    values[field.name] ?? ""
                  }
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]:
                        event.target.value,
                    }))
                  }
                />
              </label>
            ),
          )}

          <button
            className="login-submit"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : action?.label}
          </button>
        </form>
      </Dialog>
    </section>
  );
}