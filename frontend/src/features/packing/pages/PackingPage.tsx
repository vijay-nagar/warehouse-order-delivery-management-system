import { useCallback, useEffect, useState } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";

import type { ResourceRow } from "../../../shared/types/api";
import type { PaginationParams } from "../../../shared/types/pagination";
import { MAX_PAGE_SIZE } from "../../../shared/types/pagination";

import { packingApi } from "../api/packingApi";
import { usersApi, type EligibleUser } from "../../../shared/api/usersApi";

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

  const [eligiblePackers, setEligiblePackers] =
    useState<EligibleUser[]>([]);

  useEffect(() => {
    let active = true;

    const loadPackingCounts = async () => {
      try {
        const response = await packingApi.list({ pageSize: MAX_PAGE_SIZE });

        if (!active) return;

        setPackingRows(response.data);
      } catch {
        // Main WorkflowWorkspace handles table API errors.
      }
    };

    const loadEligiblePackers = async () => {
      try {
        const packers = await usersApi.eligible("Packer");

        if (!active) return;

        setEligiblePackers(packers);
      } catch {
        // Assign/Reassign dialogs will just show an empty dropdown.
      }
    };

    void loadPackingCounts();
    void loadEligiblePackers();

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

  const packerOptions = eligiblePackers.map((packer) => ({
    value: packer.id,
    label: packer.email
      ? `${packer.username} (${packer.email})`
      : packer.username,
  }));

  // Manager/admin queue: assign and reassign work to a Packer. Packing
  // execution (start/create package/complete) lives on the Packer's own
  // "My Packing Tasks" page.
  const packingActions: WorkflowAction[] = [
    {
      label: "Assign",
      statuses: ["PENDING"],
      roles: ["Super Admin", "Warehouse Manager"],
      fields: [
        {
          name: "packerUserId",
          label: "Packer",
          type: "select",
          required: true,
          options: packerOptions,
        },
      ],
      execute: (id, data) =>
        packingApi.assign(id, data),
    },

    {
      label: "Reassign",
      statuses: ["ASSIGNED"],
      roles: ["Super Admin", "Warehouse Manager"],
      fields: [
        {
          name: "packerUserId",
          label: "Packer",
          type: "select",
          required: true,
          options: packerOptions,
        },
      ],
      execute: (id, data) =>
        packingApi.reassign(id, data),
    },
  ];

  const selectedList = useCallback(
    (params?: PaginationParams) =>
      packingApi.list({
        ...params,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
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
