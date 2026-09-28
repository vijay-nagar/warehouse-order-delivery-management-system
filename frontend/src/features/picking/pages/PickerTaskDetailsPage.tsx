import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { pickingApi } from "../api/pickingApi";
import { getStoredUser } from "../../auth/storage/authStorage";
import type { ResourceRow } from "../../../shared/types/api";

function getNumber(row: ResourceRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return Number(value);
  }
  return 0;
}

function getString(row: ResourceRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value) !== "") return String(value);
  }
  return "—";
}

function getStatus(row: ResourceRow) {
  return getString(row, "Status", "status").toUpperCase();
}

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PickerTaskDetailsPage() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const taskId = Number(idParam);

  const [task, setTask] = useState<ResourceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantityByItem, setQuantityByItem] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState("");

  const loadTask = useCallback(async () => {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      setError("Invalid picking task ID.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const result = await pickingApi.byId(taskId);
      const assignedPicker = getNumber(result, "PickerUserId", "pickerUserId");
      if (assignedPicker !== Number(user?.id ?? 0)) {
        setError("This picking task is not assigned to your account.");
        setTask(null);
        return;
      }
      setTask(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the picking task.");
    } finally {
      setLoading(false);
    }
  }, [taskId, user?.id]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const items = useMemo(() => {
    if (!task) return [];
    const raw = task.items ?? task.Items;
    return Array.isArray(raw) ? (raw as ResourceRow[]) : [];
  }, [task]);

  const allPicked = items.length > 0 && items.every((item) =>
    getNumber(item, "PickedQuantity", "pickedQuantity") >= getNumber(item, "RequiredQuantity", "requiredQuantity"),
  );

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      setActionLoading(true);
      setError("");
      await action();
      await loadTask();
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : successMessage);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    await runAction(() => pickingApi.start(taskId), "Unable to start picking.");
  };

  const handleUpdateItem = async (item: ResourceRow) => {
    const itemId = getNumber(item, "Id", "id");
    const rawQuantity = quantityByItem[itemId] ?? String(getNumber(item, "PickedQuantity", "pickedQuantity"));
    const pickedQuantity = Number(rawQuantity);
    const requiredQuantity = getNumber(item, "RequiredQuantity", "requiredQuantity");
    const binId = getNumber(item, "BinId", "binId");

    if (!Number.isInteger(pickedQuantity) || pickedQuantity < 0 || pickedQuantity > requiredQuantity) {
      setError(`Enter a picked quantity between 0 and ${requiredQuantity}.`);
      return;
    }

    await runAction(
      () => pickingApi.updateItem(taskId, itemId, {
        pickedQuantity,
        ...(binId > 0 ? { pickedBinId: binId } : {}),
      }),
      "Unable to update the picked quantity.",
    );
  };

  const handleComplete = async () => {
    if (!allPicked) {
      setError("Complete all picking items before completing the task.");
      return;
    }

    await runAction(() => pickingApi.complete(taskId, { notes: notes.trim() || undefined }), "Unable to complete the picking task.");
  };

  if (loading) return <div className="picker-page-state">Loading picking task...</div>;

  if (!task) {
    return (
      <div className="picker-page">
        <button type="button" className="picker-button picker-button-secondary" onClick={() => navigate(-1)}>Back</button>
        <div className="picker-alert">{error || "Picking task not found."}</div>
      </div>
    );
  }

  const status = getStatus(task);
  const orderId = getNumber(task, "OrderId", "orderId");

  return (
    <div className="picker-page">
      <div className="picker-page-heading">
        <div>
          <button type="button" className="picker-back-button" onClick={() => navigate(-1)}>← Back to tasks</button>
          <span className="picker-eyebrow">PICKING TASK #{taskId}</span>
          <h2>Order #{orderId}</h2>
          <p>Pick the required stock from the specified warehouse location.</p>
        </div>
        <span className={`picker-status picker-status-${status.toLowerCase()}`}>{formatStatus(status)}</span>
      </div>

      {error && <div className="picker-alert">{error}</div>}

      <div className="picker-detail-grid">
        <section className="picker-panel">
          <div className="picker-panel-header">
            <div>
              <h3>Task Information</h3>
              <p>Assignment and workflow timestamps.</p>
            </div>
          </div>
          <div className="picker-detail-grid-inner">
            <div><span>Picker</span><strong>{user?.username ?? "—"}</strong></div>
            <div><span>Status</span><strong>{formatStatus(status)}</strong></div>
            <div><span>Assigned</span><strong>{formatDate(task.AssignedAt ?? task.assignedAt)}</strong></div>
            <div><span>Started</span><strong>{formatDate(task.StartedAt ?? task.startedAt)}</strong></div>
            <div><span>Completed</span><strong>{formatDate(task.CompletedAt ?? task.completedAt)}</strong></div>
            <div><span>Created</span><strong>{formatDate(task.CreatedAt ?? task.createdAt)}</strong></div>
          </div>

          {status === "ASSIGNED" && (
            <div className="picker-action-bar">
              <button type="button" className="picker-button picker-button-primary" disabled={actionLoading} onClick={() => void handleStart()}>
                {actionLoading ? "Starting..." : "Start Picking"}
              </button>
            </div>
          )}
        </section>

        <section className="picker-panel">
          <div className="picker-panel-header">
            <div>
              <h3>Workflow</h3>
              <p>Task state progression.</p>
            </div>
          </div>
          <div className="picker-workflow-line">
            {(["PENDING", "ASSIGNED", "PICKING", "PICKED"] as const).map((step) => {
              const active = ["PENDING", "ASSIGNED", "PICKING", "PICKED"].indexOf(step) <= ["PENDING", "ASSIGNED", "PICKING", "PICKED"].indexOf(status as (typeof step));
              return (
                <div className={`picker-workflow-step ${active ? "done" : ""}`} key={step}>
                  <span />
                  <strong>{formatStatus(step)}</strong>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="picker-panel">
        <div className="picker-panel-header">
          <div>
            <h3>Pick Items</h3>
            <p>Confirm quantity after picking from the displayed bin.</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="picker-empty-state"><strong>No picking items</strong><span>This task has no item records.</span></div>
        ) : (
          <div className="picker-items">
            {items.map((item) => {
              const itemId = getNumber(item, "Id", "id");
              const required = getNumber(item, "RequiredQuantity", "requiredQuantity");
              const picked = getNumber(item, "PickedQuantity", "pickedQuantity");
              const itemStatus = getString(item, "Status", "status").toUpperCase();
              const warehouse = getString(item, "WarehouseName", "warehouseName");
              const zone = getString(item, "ZoneName", "zoneName");
              const shelf = getString(item, "ShelfName", "shelfName");
              const bin = getString(item, "BinName", "binName");
              const binId = getNumber(item, "BinId", "binId");
              const canEdit = status === "PICKING";

              return (
                <article className="picker-item-card" key={itemId}>
                  <div className="picker-item-main">
                    <div className="picker-item-title">
                      <span>Product #{getNumber(item, "ProductId", "productId")}</span>
                      <span className={`picker-status picker-status-${itemStatus.toLowerCase()}`}>{formatStatus(itemStatus)}</span>
                    </div>
                    <div className="picker-location-grid">
                      <div><span>Warehouse</span><strong>{warehouse}</strong></div>
                      <div><span>Zone</span><strong>{zone}</strong></div>
                      <div><span>Shelf</span><strong>{shelf}</strong></div>
                      <div><span>Bin</span><strong>{bin}{binId > 0 ? ` (#${binId})` : ""}</strong></div>
                    </div>
                  </div>

                  <div className="picker-quantity-box">
                    <div><span>Required</span><strong>{required}</strong></div>
                    <div><span>Picked</span><strong>{picked}</strong></div>
                    {canEdit && (
                      <label>
                        <span>Confirm picked qty</span>
                        <input
                          type="number"
                          min={0}
                          max={required}
                          step={1}
                          value={quantityByItem[itemId] ?? String(picked)}
                          onChange={(event) => setQuantityByItem((current) => ({ ...current, [itemId]: event.target.value }))}
                        />
                      </label>
                    )}
                  </div>

                  {canEdit && (
                    <button type="button" className="picker-button picker-button-secondary" disabled={actionLoading} onClick={() => void handleUpdateItem(item)}>
                      Save Pick
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {status === "PICKING" && (
        <section className="picker-panel picker-complete-panel">
          <div className="picker-panel-header">
            <div>
              <h3>Complete Picking</h3>
              <p>{allPicked ? "All item quantities are complete." : "Every item must reach its required quantity first."}</p>
            </div>
          </div>
          <textarea className="picker-textarea" maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional completion notes" />
          <div className="picker-action-bar">
            <button type="button" className="picker-button picker-button-primary" disabled={actionLoading || !allPicked} onClick={() => void handleComplete()}>
              {actionLoading ? "Completing..." : "Complete Picking"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
