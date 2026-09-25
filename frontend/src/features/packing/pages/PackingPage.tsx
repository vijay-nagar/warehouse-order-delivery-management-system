import { useEffect, useMemo, useState } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";

import type { ResourceRow } from "../../../shared/types/api";

import { packingApi } from "../api/packingApi";

type PackingStatus =
  | "ALL"
  | "PACKED"
  | "PENDING"
  | "ASSIGNED"
  | "PACKING";

export default function PackingPage() {
  const [statusFilter, setStatusFilter] =
    useState<PackingStatus>("ALL");

  const [packingRows, setPackingRows] =
    useState<ResourceRow[]>([]);

  useEffect(() => {
    let active = true;

    const loadPackingCounts = async () => {
      try {
        const rows = await packingApi.list();

        if (!active) return;

        setPackingRows(rows);
      } catch {
        // Main WorkflowWorkspace handles table API errors.
      }
    };

    void loadPackingCounts();

    return () => {
      active = false;
    };
  }, []);

  const getStatusCount = (status: PackingStatus) => {
    if (status === "ALL") {
      return packingRows.length;
    }

    return packingRows.filter(
      (row) =>
        String(
          row.Status ?? row.status ?? "",
        ).toUpperCase() === status,
    ).length;
  };

  const packingActions: WorkflowAction[] = [
    {
      label: "Assign",
      statuses: ["PENDING"],
      fields: [
        {
          name: "packerUserId",
          label: "Packer user ID",
          type: "number",
          required: true,
          min: 1,
          step: 1,
        },
      ],
      execute: (id, data) =>
        packingApi.assign(id, data),
    },

    {
      label: "Start",
      statuses: ["ASSIGNED"],
      execute: (id) =>
        packingApi.start(id),
    },

    {
      label: "Create package",
      statuses: ["PACKING"],
      fields: [
        {
          name: "weight",
          label: "Weight",
          type: "number",
          min: Number.EPSILON,
          step: "any",
        },
      ],
      execute: (id, data) =>
        packingApi.createPackage(id, data),
    },

    {
      label: "Complete",
      statuses: ["PACKING"],
      fields: [
        {
          name: "notes",
          label: "Notes",
          maxLength: 1000,
        },
      ],
      execute: (id, data) =>
        packingApi.complete(id, data),
    },
  ];

  const selectedList = useMemo(
    () => async () => {
      const rows = await packingApi.list();

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
      title="Packing"
      description="Packing tasks and backend-supported state actions."
      list={selectedList}
      byId={packingApi.byId}
      columns={[
        "Id",
        "OrderId",
        "PackerUserId",
        "PackageCount",
        "Status",
        "CreatedAt",
      ]}
      actions={packingActions}
      headerControl={
        <select
          className="workflow-operation-select"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as PackingStatus,
            )
          }
          aria-label="Filter packing status"
        >
          <option value="ALL">
            All
          </option>

          <option value="PACKED">
            Packed
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="ASSIGNED">
            Assigned
          </option>

          <option value="PACKING">
            Packing
          </option>
        </select>
      }
      topContent={
        <div className="workflow-summary-grid workflow-packing-summary-grid">
          <div className="workflow-summary-card">
            <span>Packed</span>
            <strong>
              {getStatusCount("PACKED")}
            </strong>
          </div>

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
            <span>Packing</span>
            <strong>
              {getStatusCount("PACKING")}
            </strong>
          </div>
        </div>
      }
    />
  );
}
