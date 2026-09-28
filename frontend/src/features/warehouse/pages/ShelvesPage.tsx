import { CrudResourcePage } from "../../../shared/page-templates/CrudResourcePage";
import { shelvesApi, zonesApi } from "../api/warehouseApi";
import type { ResourceRow } from "../../../shared/types/api";

const rowLabel = (row: ResourceRow) => String(row.Name ?? row.name ?? "");
const rowCode = (row: ResourceRow) => String(row.Code ?? row.code ?? "");

export default function ShelvesPage() {
  return (
    <CrudResourcePage
      title="Shelves"
      description="Warehouse shelves backed by the verified shelves API."
      api={shelvesApi}
      fields={[
        {
          name: "zoneId",
          label: "Zone",
          required: true,
          type: "select",
          select: {
            placeholder: "Select zone",
            fetchOptions: (search) => zonesApi.list({ search: search || undefined, pageSize: 8 }).then((r) => r.data),
            getLabel: rowLabel,
            getDescription: rowCode,
            resolveOption: (id) => zonesApi.byId(id),
          },
        },
        { name: "name", label: "Name", required: true },
        { name: "code", label: "Code", required: true },
      ]}
      columns={["Id", "ZoneId", "Name", "Code", "IsActive"]}
    />
  );
}
