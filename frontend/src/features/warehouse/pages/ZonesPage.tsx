import { CrudResourcePage } from "../../../shared/page-templates/CrudResourcePage";
import { zonesApi, warehousesApi } from "../api/warehouseApi";
import type { ResourceRow } from "../../../shared/types/api";

const rowLabel = (row: ResourceRow) => String(row.Name ?? row.name ?? "");
const rowCode = (row: ResourceRow) => String(row.Code ?? row.code ?? "");

export default function ZonesPage() {
  return (
    <CrudResourcePage
      title="Zones"
      description="Warehouse zones backed by the verified zones API."
      api={zonesApi}
      fields={[
        {
          name: "warehouseId",
          label: "Warehouse",
          required: true,
          type: "select",
          select: {
            placeholder: "Select warehouse",
            fetchOptions: (search) => warehousesApi.list({ search: search || undefined, pageSize: 8 }).then((r) => r.data),
            getLabel: rowLabel,
            getDescription: rowCode,
            resolveOption: (id) => warehousesApi.byId(id),
          },
        },
        { name: "name", label: "Name", required: true },
        { name: "code", label: "Code", required: true },
      ]}
      columns={["Id", "WarehouseId", "Name", "Code", "IsActive"]}
    />
  );
}
