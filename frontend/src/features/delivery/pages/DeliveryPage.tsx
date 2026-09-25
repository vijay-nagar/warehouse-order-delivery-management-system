import { useCallback, useEffect, useState } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";

import type { ResourceRow } from "../../../shared/types/api";
import type { PaginatedResult, PaginationParams } from "../../../shared/types/pagination";
import { MAX_PAGE_SIZE } from "../../../shared/types/pagination";

import { deliveryApi } from "../api/deliveryApi";

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

    void loadDeliveryCounts();

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

  const deliveryActions: WorkflowAction[] = [
    {
      label: "Assign",
      statuses: ["PENDING"],
      fields: [
        {
          name: "deliveryBoyUserId",
          label: "Delivery user ID",
          type: "number",
          required: true,
          min: 1,
          step: 1,
        },
      ],
      execute: (id, data) =>
        deliveryApi.assign(id, data),
    },

    {
      label: "Pickup",
      statuses: ["ASSIGNED"],
      execute: (id) =>
        deliveryApi.pickup(id),
    },

    {
      label: "Out fordelivery",
      statuses: ["PICKED_UP"],
      execute: (id) =>
        deliveryApi.outForDelivery(id),
    },

    {
      label: "Add tracking",
      statuses: [
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
      ],
      fields: [
        {
          name: "latitude",
          label: "Latitude",
          type: "number",
          required: true,
          min: -90,
          max: 90,
          step: "any",
        },
        {
          name: "longitude",
          label: "Longitude",
          type: "number",
          required: true,
          min: -180,
          max: 180,
          step: "any",
        },
        {
          name: "remarks",
          label: "Remarks",
          maxLength: 500,
        },
      ],
      execute: (id, data) =>
        deliveryApi.addTracking(id, data),
    },

    {
      label: "Mark delivered",
      statuses: ["OUT_FOR_DELIVERY"],
      execute: (id) =>
        deliveryApi.deliver(id),
    },

    {
      label: "Mark failed",
      statuses: [
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
      ],
      confirm: "Mark this delivery as failed?",
      fields: [
        {
          name: "failureReason",
          label: "Failure reason",
          required: true,
          maxLength: 1000,
        },
      ],
      execute: (id, data) =>
        deliveryApi.fail(id, data),
    },

    {
      label: "Return",
      statuses: ["FAILED"],
      confirm:
        "Mark this failed delivery as returned?",
      fields: [
        {
          name: "returnReason",
          label: "Return reason",
          required: true,
          maxLength: 1000,
        },
      ],
      execute: (id, data) =>
        deliveryApi.return(id, data),
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
