import { useEffect, useMemo, useState } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";

import type { ResourceRow } from "../../../shared/types/api";

import { pickingApi } from "../api/pickingApi";

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

  useEffect(() => {
    let active = true;

    const loadPickingCounts = async () => {
      try {
        const rows = await pickingApi.list();

        if (!active) return;

        setPickingRows(rows);
      } catch {
        // Main WorkflowWorkspace handles table API errors.
      }
    };

    void loadPickingCounts();

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

  const pickingActions: WorkflowAction[] = [
    {
      label: "Assign",
      statuses: ["PENDING"],
      fields: [
        {
          name: "pickerUserId",
          label: "Picker user ID",
          type: "number",
          required: true,
          min: 1,
          step: 1,
        },
      ],
      execute: (id, data) =>
        pickingApi.assign(id, data),
    },

    {
      label: "Start",
      statuses: ["ASSIGNED"],
      execute: (id) =>
        pickingApi.start(id),
    },

    {
      label: "Update picked quantity",
      statuses: ["PICKING"],
      fields: [
        {
          name: "itemId",
          label: "Picking item ID",
          type: "number",
          required: true,
          min: 1,
          step: 1,
        },
        {
          name: "pickedQuantity",
          label: "Picked quantity",
          type: "number",
          required: true,
          min: 0,
          step: 1,
        },
      ],
      execute: (id, data) =>
        pickingApi.updateItem(
          id,
          Number(data.itemId),
          {
            pickedQuantity: Number(
              data.pickedQuantity,
            ),
          },
        ),
    },

    {
      label: "Complete",
      statuses: ["PICKING"],
      fields: [
        {
          name: "notes",
          label: "Notes",
          maxLength: 1000,
        },
      ],
      execute: (id, data) =>
        pickingApi.complete(id, data),
    },
  ];

  const selectedList = useMemo(
    () => async () => {
      const rows = await pickingApi.list();

      if (statusFilter === "ALL") {
        return rows;
      }

      return rows.filter(
        (row) =>
          String(
            row.Status ?? row.status ?? "",
          ).toUpperCase() === statusFilter,
      );
    },
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
