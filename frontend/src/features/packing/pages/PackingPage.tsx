import { WorkflowWorkspace } from "../../../components/workflow/WorkflowWorkspace";
import { packingApi } from "../../../services/api/backend";

export default function PackingPage() {
  return <WorkflowWorkspace title="Packing" description="Packing tasks and backend-supported state actions." list={packingApi.list} byId={packingApi.byId} columns={["Id", "OrderId", "PackerUserId", "PackageCount", "Status", "CreatedAt"]} actions={[{ label: "Assign", statuses: ["PENDING"], fields: [{ name: "packerUserId", label: "Packer user ID", type: "number", required: true, min: 1, step: 1 }], execute: (id, data) => packingApi.assign(id, data) }, { label: "Start", statuses: ["ASSIGNED"], execute: (id) => packingApi.start(id) }, { label: "Create package", statuses: ["PACKING"], fields: [{ name: "weight", label: "Weight", type: "number", min: Number.EPSILON, step: "any" }], execute: (id, data) => packingApi.createPackage(id, data) }, { label: "Complete", statuses: ["PACKING"], fields: [{ name: "notes", label: "Notes", maxLength: 1000 }], execute: (id, data) => packingApi.complete(id, data) }]} />;
}
