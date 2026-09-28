import { useCallback, useEffect, useState } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";

import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";
import { MAX_PAGE_SIZE } from "../../../shared/types/pagination";

import { pickingApi } from "../api/pickingApi";
import { usersApi, type EligibleUser } from "../../../shared/api/usersApi";

type PickingStatus =
  | "ALL"
  | "PENDING"
  | "ASSIGNED"
  | "PICKING"
  | "PICKED";

export default function PickingPage() {
  const [statusFilter, setStatusFilter] =
    useState<PickingStatus>("ALL");

  const [pickingRows, setPickingRows] =
    useState<ResourceRow[]>([]);

  const [eligiblePickers, setEligiblePickers] =
    useState<EligibleUser[]>([]);

  useEffect(() => {
    let active = true;

    const loadPickingCounts = async () => {
      try {
        const response = await pickingApi.list({ pageSize: MAX_PAGE_SIZE });

        if (!active) return;

        setPickingRows(response.data);
      } catch {
        // Main WorkflowWorkspace handles table API errors.
      }
    };

    const loadEligiblePickers = async () => {
      try {
        const pickers = await usersApi.eligible("Picker");

        if (!active) return;

        setEligiblePickers(pickers);
      } catch {
        // Assign/Reassign dialogs will just show an empty dropdown.
      }
    };

    void loadPickingCounts();
    void loadEligiblePickers();

    return () => {
      active = false;
    };
  }, []);

  const getStatusCount = (status: PickingStatus) => {
    if (status === "ALL") {
      return pickingRows.length;
    }

    return pickingRows.filter(
      (row) =>
        String(
          row.Status ?? row.status ?? "",
        ).toUpperCase() === status,
    ).length;
  };

  const pickerOptions = eligiblePickers.map((picker) => ({
    value: picker.id,
    label: picker.email
      ? `${picker.username} (${picker.email})`
      : picker.username,
  }));

  // Manager/admin queue: assign and reassign work to a Picker. Picking
  // execution (start/update/complete) lives on the Picker's own "My
  // Picking Tasks" page — managers don't get worker execution controls
  // here per the manager-vs-worker split.
  const pickingActions: WorkflowAction[] = [
    {
      label: "Assign",
      statuses: ["PENDING"],
      roles: ["Super Admin", "Warehouse Manager"],
      fields: [
        {
          name: "pickerUserId",
          label: "Picker",
          type: "select",
          required: true,
          options: pickerOptions,
        },
      ],
      execute: (id, data) =>
        pickingApi.assign(id, data),
    },

    {
      label: "Reassign",
      statuses: ["ASSIGNED"],
      roles: ["Super Admin", "Warehouse Manager"],
      fields: [
        {
          name: "pickerUserId",
          label: "Picker",
          type: "select",
          required: true,
          options: pickerOptions,
        },
      ],
      execute: (id, data) =>
        pickingApi.reassign(id, data),
    },
  ];

  const selectedList = useCallback(
    (params?: PaginationParams) =>
      pickingApi.list({
        ...params,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
    [statusFilter],
  );

  return (
    <WorkflowWorkspace
      title="Picking"
      description="Picking tasks and backend-supported state actions."
      list={selectedList}
      byId={pickingApi.byId}
      columns={[
        "Id",
        "OrderId",
        "PickerUserId",
        "Status",
        "CreatedAt",
        "CompletedAt",
      ]}
      actions={pickingActions}
      headerControl={
        <select
          className="workflow-operation-select"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as PickingStatus,
            )
          }
          aria-label="Filter picking status"
        >
          <option value="ALL">
            All
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="ASSIGNED">
            Assigned
          </option>

          <option value="PICKING">
            Picking
          </option>

          <option value="PICKED">
            Picked
          </option>
        </select>
      }
      topContent={
        <div className="workflow-summary-grid workflow-picking-summary-grid">
          <div className="workflow-summary-card">
            <span>Pending</span>
            <strong>
              {getStatusCount("PENDING")}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Assigned</span>
            <strong>
              {getStatusCount("ASSIGNED")}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Picking</span>
            <strong>
              {getStatusCount("PICKING")}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Picked</span>
            <strong>
              {getStatusCount("PICKED")}
            </strong>
          </div>
        </div>
      }
    />
  );
}
