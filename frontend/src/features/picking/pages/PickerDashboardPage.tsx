import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { pickingApi } from "../api/pickingApi";
import { getStoredUser } from "../../auth/storage/authStorage";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";

function getId(row: ResourceRow) {
  return Number(row.Id ?? row.id ?? 0);
}

function getStatus(row: ResourceRow) {
  return String(row.Status ?? row.status ?? "UNKNOWN").toUpperCase();
}

function getPickerId(row: ResourceRow) {
  return Number(row.PickerUserId ?? row.pickerUserId ?? 0);
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadAllPickingTasks() {
  const result: ResourceRow[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 20) {
    const response = await pickingApi.list({
      page,
      pageSize: 100,
    } as PaginationParams & { status?: string });

    result.push(...response.data);
    hasNext = response.pagination.hasNext;
    page += 1;
  }

  return result;
}

export default function PickerDashboardPage() {
  const user = getStoredUser();
  const pickerId = user?.id ?? 0;
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      const allTasks = await loadAllPickingTasks();
      setTasks(allTasks.filter((task) => getPickerId(task) === pickerId));
    } catch (requestError) {
      console.error("Failed to load picker tasks:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your picking tasks.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pickerId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const stats = useMemo(() => {
    const count = (status: string) =>
      tasks.filter((task) => getStatus(task) === status).length;

    return {
      total: tasks.length,
      assigned: count("ASSIGNED"),
      picking: count("PICKING"),
      picked: count("PICKED"),
    };
  }, [tasks]);

  const currentTask = useMemo(() => {
    return (
      tasks.find((task) => getStatus(task) === "PICKING") ??
      tasks.find((task) => getStatus(task) === "ASSIGNED") ??
      null
    );
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort(
        (a, b) =>
          new Date(String(b.CreatedAt ?? b.createdAt ?? 0)).getTime() -
          new Date(String(a.CreatedAt ?? a.createdAt ?? 0)).getTime(),
      )
      .slice(0, 6);
  }, [tasks]);

  if (loading) {
    return <div className="picker-page-state">Loading your picking workspace...</div>;
  }

  return (
    <div className="picker-dashboard">
      <div className="picker-page-heading">
        <div>
          <span className="picker-eyebrow">PICKER OPERATIONS</span>
          <h2>My Picking Dashboard</h2>
          <p>Work only on picking tasks assigned to your account.</p>
        </div>

        <button
          type="button"
          className="picker-button picker-button-secondary"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadTasks();
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="picker-alert">{error}</div>}

      <div className="picker-stats">
        <article className="picker-stat-card">
          <span>My Tasks</span>
          <strong>{stats.total}</strong>
          <small>Total assigned to you</small>
        </article>
        <article className="picker-stat-card">
          <span>Assigned</span>
          <strong>{stats.assigned}</strong>
          <small>Ready to start</small>
        </article>
        <article className="picker-stat-card">
          <span>Picking</span>
          <strong>{stats.picking}</strong>
          <small>Currently in progress</small>
        </article>
        <article className="picker-stat-card">
          <span>Picked</span>
          <strong>{stats.picked}</strong>
          <small>Completed picking</small>
        </article>
      </div>

      <div className="picker-grid">
        <section className="picker-panel picker-current-panel">
          <div className="picker-panel-header">
            <div>
              <h3>Current Task</h3>
              <p>The next picking job that needs your action.</p>
            </div>
          </div>

          {currentTask ? (
            <div className="picker-current-task">
              <div className="picker-current-topline">
                <div>
                  <span className="picker-task-label">PICK TASK</span>
                  <strong>#{getId(currentTask)}</strong>
                </div>
                <span className={`picker-status picker-status-${getStatus(currentTask).toLowerCase()}`}>
                  {formatStatus(getStatus(currentTask))}
                </span>
              </div>

              <div className="picker-task-meta-grid">
                <div><span>Order</span><strong>#{String(currentTask.OrderId ?? currentTask.orderId ?? "—")}</strong></div>
                <div><span>Assigned</span><strong>{formatDate(currentTask.AssignedAt ?? currentTask.assignedAt)}</strong></div>
                <div><span>Started</span><strong>{formatDate(currentTask.StartedAt ?? currentTask.startedAt)}</strong></div>
                <div><span>Created</span><strong>{formatDate(currentTask.CreatedAt ?? currentTask.createdAt)}</strong></div>
              </div>

              <button
                type="button"
                className="picker-button picker-button-primary picker-full-width"
                onClick={() => navigate(`/picker/tasks/${getId(currentTask)}`)}
              >
                Open Task
              </button>
            </div>
          ) : (
            <div className="picker-empty-state">
              <strong>No active task</strong>
              <span>There is no assigned task waiting for you right now.</span>
            </div>
          )}
        </section>

        <section className="picker-panel">
          <div className="picker-panel-header">
            <div>
              <h3>Picking Flow</h3>
              <p>Follow the backend-supported task states.</p>
            </div>
          </div>

          <div className="picker-flow">
            {[
              ["PENDING", "Task created"],
              ["ASSIGNED", "Assigned to picker"],
              ["PICKING", "You are picking"],
              ["PICKED", "Picking completed"],
            ].map(([status, label], index) => (
              <div className="picker-flow-step" key={status}>
                <div className="picker-flow-index">{index + 1}</div>
                <div>
                  <strong>{formatStatus(status)}</strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="picker-panel">
        <div className="picker-panel-header">
          <div>
            <h3>Recent Tasks</h3>
            <p>Your latest picking assignments.</p>
          </div>
          <button
            type="button"
            className="picker-text-button"
            onClick={() => navigate("/picker/tasks")}
          >
            View all
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="picker-empty-state">
            <strong>No tasks found</strong>
            <span>Assigned tasks will appear here automatically.</span>
          </div>
        ) : (
          <div className="picker-task-table-wrap">
            <table className="picker-task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => {
                  const id = getId(task);
                  const status = getStatus(task);
                  return (
                    <tr key={id}>
                      <td>#{id}</td>
                      <td>#{String(task.OrderId ?? task.orderId ?? "—")}</td>
                      <td><span className={`picker-status picker-status-${status.toLowerCase()}`}>{formatStatus(status)}</span></td>
                      <td>{formatDate(task.AssignedAt ?? task.assignedAt)}</td>
                      <td className="picker-table-action-cell">
                        <button type="button" className="picker-text-button" onClick={() => navigate(`/picker/tasks/${id}`)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
