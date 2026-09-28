import { useCallback } from "react";

import { WorkflowWorkspace } from "../../../shared/page-templates/WorkflowWorkspace";

import type { WorkflowAction } from "../../../shared/page-templates/WorkflowWorkspace";
import type { PaginationParams } from "../../../shared/types/pagination";

import { pickingApi } from "../api/pickingApi";

// Picker worker view: only tasks assigned to the current user, with
// execute-only actions (start/update/complete). Assignment controls live
// on the manager-facing Picking Queue, not here.
export default function MyPickingTasksPage() {
  const pickingActions: WorkflowAction[] = [
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

  const list = useCallback(
    (params?: PaginationParams) => pickingApi.myTasks(params),
    [],
  );

  return (
    <WorkflowWorkspace
      title="My Picking Tasks"
      description="Picking tasks assigned to you."
      list={list}
      byId={pickingApi.byId}
      columns={[
        "Id",
        "OrderId",
        "Status",
        "AssignedAt",
        "CompletedAt",
      ]}
      actions={pickingActions}
    />
  );
}
