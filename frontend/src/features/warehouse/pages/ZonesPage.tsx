import { CrudResourcePage } from "../../../shared/page-templates/CrudResourcePage";
import { zonesApi } from "../api/warehouseApi";
export default function ZonesPage() { return <CrudResourcePage title="Zones" description="Warehouse zones backed by the verified zones API." api={zonesApi} fields={[{ name: "warehouseId", label: "Warehouse ID", type: "number", required: true }, { name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }]} columns={["Id", "WarehouseId", "Name", "Code", "IsActive"]} />; }
