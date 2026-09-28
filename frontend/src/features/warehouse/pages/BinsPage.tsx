import { CrudResourcePage } from "../../../shared/page-templates/CrudResourcePage";
import { binsApi, shelvesApi } from "../api/warehouseApi";
import type { ResourceRow } from "../../../shared/types/api";

const rowLabel = (row: ResourceRow) => String(row.Name ?? row.name ?? "");
const rowCode = (row: ResourceRow) => String(row.Code ?? row.code ?? "");

export default function BinsPage() {
  return (
    <CrudResourcePage
      title="Bins"
      description="Warehouse bins backed by the verified bins API."
      api={binsApi}
      fields={[
        {
          name: "shelfId",
          label: "Shelf",
          required: true,
          type: "select",
          select: {
            placeholder: "Select shelf",
            fetchOptions: (search) => shelvesApi.list({ search: search || undefined, pageSize: 8 }).then((r) => r.data),
            getLabel: rowLabel,
            getDescription: rowCode,
            resolveOption: (id) => shelvesApi.byId(id),
          },
        },
        { name: "name", label: "Name", required: true },
        { name: "code", label: "Code", required: true },
      ]}
      columns={["Id", "ShelfId", "Name", "Code", "IsActive"]}
    />
  );
}
