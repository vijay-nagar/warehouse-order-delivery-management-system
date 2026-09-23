import { CrudResourcePage } from "../../../components/tables/CrudResourcePage";
import { warehousesApi } from "../../../services/api/backend";

export default function WarehousePage() {
  return <CrudResourcePage title="Warehouses" description="Warehouse records supported by the backend." api={warehousesApi} fields={[{ name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }, { name: "addressLine1", label: "Address line 1", required: true }, { name: "addressLine2", label: "Address line 2" }, { name: "city", label: "City", required: true }, { name: "state", label: "State", required: true }, { name: "postalCode", label: "Postal code", required: true }]} columns={["Id", "Name", "Code", "City", "IsActive"]} />;
}
