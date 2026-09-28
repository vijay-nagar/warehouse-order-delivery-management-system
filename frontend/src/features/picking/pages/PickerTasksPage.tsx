import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { pickingApi } from "../api/pickingApi";
import { getStoredUser } from "../../auth/storage/authStorage";
import type { ResourceRow } from "../../../shared/types/api";

function getId(row: ResourceRow) {
  return Number(row.Id ?? row.id ?? 0);
}

function getStatus(row: ResourceRow) {
  return String(row.Status ?? row.status ?? "UNKNOWN").toUpperCase();
}

function getPickerId(row: ResourceRow) {
  const value = row.PickerUserId ?? row.pickerUserId;
  return value == null || value === "" ? 0 : Number(value);
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PickerTasksPage() {
  const user = getStoredUser();
  const pickerId = Number(user?.id ?? 0);

  const navigate = useNavigate();
  const location = useLocation();
  const historyMode = location.pathname === "/picker/history";

  const [tasks, setTasks] = useState<ResourceRow[]>([]);
  const [status, setStatus] = useState(historyMode ? "PICKED" : "ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const all: ResourceRow[] = [];
      let page = 1;
      let hasNext = true;

      while (hasNext && page <= 20) {
        const response = await pickingApi.list({
          page,
          pageSize: 100,
        });

        all.push(...response.data);
        hasNext = response.pagination.hasNext;
        page += 1;
      }

      const visibleTasks = historyMode
        ? all.filter(
            (task) =>
              getPickerId(task) === pickerId &&
              getStatus(task) === "PICKED",
          )
        : all.filter((task) => {
            const taskPickerId = getPickerId(task);
            const taskStatus = getStatus(task);

            const assignedToMe = taskPickerId === pickerId;

            const availableToAssign =
              taskStatus === "PENDING" && taskPickerId === 0;

            return assignedToMe || availableToAssign;
          });

      setTasks(visibleTasks);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load picking tasks.",
      );
    } finally {
      setLoading(false);
    }
  }, [historyMode, pickerId]);

  useEffect(() => {
    setStatus(historyMode ? "PICKED" : "ALL");
  }, [historyMode]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleAssignToMe = async (taskId: number) => {
    if (!pickerId || assigningId !== null) {
      return;
    }

    try {
      setAssigningId(taskId);
      setError("");

      await pickingApi.assign(taskId, {
        pickerUserId: pickerId,
      });

      await loadTasks();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to assign this task.",
      );
    } finally {
      setAssigningId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const taskStatus = getStatus(task);
      const matchesStatus =
        status === "ALL" || taskStatus === status;

      const haystack = Object.values(task)
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return (
        matchesStatus &&
        (!query || haystack.includes(query))
      );
    });
  }, [tasks, status, search]);

  return (
    <div className="picker-page">
      <div className="picker-page-heading">
        <div>
          <span className="picker-eyebrow">
            {historyMode ? "COMPLETED WORK" : "PICKER WORK QUEUE"}
          </span>

          <h2>
            {historyMode ? "Picking History" : "Picking Tasks"}
          </h2>

          <p>
            {historyMode
              ? "Completed picking tasks assigned to you."
              : "Assign available tasks to yourself or continue your assigned work."}
          </p>
        </div>

        <button
          type="button"
          className="picker-button picker-button-secondary"
          onClick={() => void loadTasks()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="picker-alert">
          {error}
        </div>
      )}

      <div className="picker-toolbar">
        <input
          className="picker-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search task or order..."
        />

        <select
          className="picker-input picker-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter task status"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="PICKING">Picking</option>
          <option value="PICKED">Picked</option>
        </select>
      </div>

      <section className="picker-panel">
        <div className="picker-panel-header">
          <div>
            <h3>
              {filteredTasks.length} task
              {filteredTasks.length === 1 ? "" : "s"}
            </h3>

            <p>
              {historyMode
                ? "Your completed picking history."
                : "Pending unassigned tasks are available to claim."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="picker-page-state">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="picker-empty-state">
            <strong>No matching tasks</strong>
            <span>
              New pending tasks or assignments will appear after refresh.
            </span>
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
                  <th>Started</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => {
                  const id = getId(task);
                  const taskStatus = getStatus(task);
                  const taskPickerId = getPickerId(task);

                  const isPending = taskStatus === "PENDING";

                  const canAssign =
                    !historyMode &&
                    isPending &&
                    taskPickerId === 0;

                  const isAssignedToMe =
                    !historyMode &&
                    isPending &&
                    taskPickerId === pickerId;

                  return (
                    <tr key={id}>
                      <td>#{id}</td>

                      <td>
                        #
                        {String(
                          task.OrderId ??
                            task.orderId ??
                            "-",
                        )}
                      </td>

                      <td>
                        <span
                          className={`picker-status picker-status-${taskStatus.toLowerCase()}`}
                        >
                          {formatStatus(taskStatus)}
                        </span>
                      </td>

                      <td>
                        {String(
                          task.AssignedAt ??
                            task.assignedAt ??
                            "-",
                        )}
                      </td>

                      <td>
                        {String(
                          task.StartedAt ??
                            task.startedAt ??
                            "-",
                        )}
                      </td>

                      <td className="picker-table-action-cell">
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          {canAssign && (
                            <button
                              type="button"
                              className="picker-text-button"
                              onClick={() =>
                                void handleAssignToMe(id)
                              }
                              disabled={assigningId === id}
                            >
                              {assigningId === id
                                ? "Assigning..."
                                : "Assign to Me"}
                            </button>
                          )}

                          {isAssignedToMe && (
                            <button
                              type="button"
                              className="picker-text-button"
                              onClick={() =>
                                navigate(`/picker/tasks/${id}`)
                              }
                            >
                              Assigned to Me
                            </button>
                          )}

                          {!canAssign &&
                            !isAssignedToMe &&
                            !historyMode && (
                              <button
                                type="button"
                                className="picker-text-button"
                                onClick={() =>
                                  navigate(`/picker/tasks/${id}`)
                                }
                              >
                                Open
                              </button>
                            )}
                        </div>
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