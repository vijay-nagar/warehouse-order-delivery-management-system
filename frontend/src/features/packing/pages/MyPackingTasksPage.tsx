import { useCallback } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";
import type { PaginationParams } from "../../../shared/types/pagination";

import { packingApi } from "../api/packingApi";

// Packer worker view: only tasks assigned to the current user, with
// execute-only actions (start/create package/complete). Assignment
// controls live on the manager-facing Packing Queue, not here.
export default function MyPackingTasksPage() {
  const packingActions: WorkflowAction[] = [
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

  const list = useCallback(
    (params?: PaginationParams) => packingApi.myTasks(params),
    [],
  );

  return (
    <WorkflowWorkspace
      title="My Packing Tasks"
      description="Packing tasks assigned to you."
      list={list}
      byId={packingApi.byId}
      columns={[
        "Id",
        "OrderId",
        "PackageCount",
        "Status",
        "CreatedAt",
      ]}
      actions={packingActions}
    />
  );
}
