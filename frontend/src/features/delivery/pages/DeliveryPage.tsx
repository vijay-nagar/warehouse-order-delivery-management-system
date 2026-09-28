import { useCallback, useEffect, useState } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";

import type { ResourceRow } from "../../../shared/types/api";
import type { PaginatedResult, PaginationParams } from "../../../shared/types/pagination";
import { MAX_PAGE_SIZE } from "../../../shared/types/pagination";

import { deliveryApi } from "../api/deliveryApi";
import { usersApi, type EligibleUser } from "../../../shared/api/usersApi";

type DeliveryStatus =
  | "ALL"
  | "DELIVERED"
  | "PICKED_UP"
  | "FAILED"
  | "RETURNED"
  | "UNASSIGNED";

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] =
    useState<DeliveryStatus>("ALL");

  const [deliveryRows, setDeliveryRows] =
    useState<ResourceRow[]>([]);

  const [eligibleDeliveryBoys, setEligibleDeliveryBoys] =
    useState<EligibleUser[]>([]);

  useEffect(() => {
    let active = true;

    const loadDeliveryCounts = async () => {
      try {
        const response = await deliveryApi.list({ pageSize: MAX_PAGE_SIZE });

        if (!active) return;

        setDeliveryRows(response.data);
      } catch {
        // Main WorkflowWorkspace handles table API errors.
      }
    };

    const loadEligibleDeliveryBoys = async () => {
      try {
        const deliveryBoys = await usersApi.eligible("Delivery Boy");

        if (!active) return;

        setEligibleDeliveryBoys(deliveryBoys);
      } catch {
        // Assign/Reassign dialogs will just show an empty dropdown.
      }
    };

    void loadDeliveryCounts();
    void loadEligibleDeliveryBoys();

    return () => {
      active = false;
    };
  }, []);

  const isUnassigned = (row: ResourceRow) => {
    const deliveryBoyUserId =
      row.DeliveryBoyUserId ?? row.deliveryBoyUserId;

    return (
      deliveryBoyUserId === null ||
      deliveryBoyUserId === undefined ||
      deliveryBoyUserId === ""
    );
  };

  const getStatusCount = (status: DeliveryStatus) => {
    if (status === "ALL") {
      return deliveryRows.length;
    }

    if (status === "UNASSIGNED") {
      return deliveryRows.filter((row) =>
        isUnassigned(row),
      ).length;
    }

    return deliveryRows.filter(
      (row) =>
        String(
          row.Status ?? row.status ?? "",
        ).toUpperCase() === status,
    ).length;
  };

  const deliveryBoyOptions = eligibleDeliveryBoys.map((deliveryBoy) => ({
    value: deliveryBoy.id,
    label: deliveryBoy.email
      ? `${deliveryBoy.username} (${deliveryBoy.email})`
      : deliveryBoy.username,
  }));

  // Manager/admin queue: assign and reassign work to a Delivery Boy.
  // Delivery execution (pickup/out-for-delivery/delivered/failed/returned)
  // lives on the Delivery Boy's own "My Deliveries" page.
  const deliveryActions: WorkflowAction[] = [
    {
      label: "Assign",
      statuses: ["PENDING"],
      roles: ["Super Admin", "Warehouse Manager", "Delivery Manager"],
      fields: [
        {
          name: "deliveryBoyUserId",
          label: "Delivery Boy",
          type: "select",
          required: true,
          options: deliveryBoyOptions,
        },
      ],
      execute: (id, data) =>
        deliveryApi.assign(id, data),
    },

    {
      label: "Reassign",
      statuses: ["ASSIGNED"],
      roles: ["Super Admin", "Warehouse Manager", "Delivery Manager"],
      fields: [
        {
          name: "deliveryBoyUserId",
          label: "Delivery Boy",
          type: "select",
          required: true,
          options: deliveryBoyOptions,
        },
      ],
      execute: (id, data) =>
        deliveryApi.reassign(id, data),
    },
  ];

  // UNASSIGNED isn't a real Status value (it's DeliveryBoyUserId being
  // null), so the backend can't filter on it server-side — fall back to a
  // capped, unpaginated fetch and filter client-side for that one case,
  // rather than adding a bespoke backend concept for it.
  const selectedList = useCallback(
    async (params?: PaginationParams): Promise<PaginatedResult<ResourceRow>> => {
      if (statusFilter === "UNASSIGNED") {
        const response = await deliveryApi.list({ pageSize: MAX_PAGE_SIZE });
        const data = response.data.filter((row) => isUnassigned(row));

        return {
          data,
          pagination: {
            ...response.pagination,
            page: 1,
            totalPages: 1,
            totalRecords: data.length,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      return deliveryApi.list({
        ...params,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
    },
    [statusFilter],
  );

  return (
    <WorkflowWorkspace
      title="Delivery"
      description="Delivery tasks and backend-supported state actions."
      list={selectedList}
      byId={deliveryApi.byId}
      columns={[
        "Id",
        "OrderId",
        "PackageId",
        "DeliveryBoyUserId",
        "Status",
        "AssignedAt",
        "DeliveredAt",
      ]}
      actions={deliveryActions}
      headerControl={
        <select
          className="workflow-operation-select"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as DeliveryStatus,
            )
          }
          aria-label="Filter delivery status"
        >
          <option value="ALL">All</option>

          <option value="DELIVERED">
            Delivered
          </option>

          <option value="PICKED_UP">
            Picked Up
          </option>

          <option value="FAILED">
            Failed
          </option>

          <option value="RETURNED">
            Returned
          </option>

          <option value="UNASSIGNED">
            Unassigned
          </option>
        </select>
      }
      topContent={
        <div className="workflow-summary-grid workflow-delivery-summary-grid">
          <div className="workflow-summary-card">
            <span>Delivered</span>
            <strong>
              {getStatusCount("DELIVERED")}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Picked Up</span>
            <strong>
              {getStatusCount("PICKED_UP")}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Failed</span>
            <strong>
              {getStatusCount("FAILED")}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Returned</span>
            <strong>
              {getStatusCount("RETURNED")}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Unassigned</span>
            <strong>
              {getStatusCount("UNASSIGNED")}
            </strong>
          </div>
        </div>
      }
    />
  );
}
