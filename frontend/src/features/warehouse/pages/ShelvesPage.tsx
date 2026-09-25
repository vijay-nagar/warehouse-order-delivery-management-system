import { CrudResourcePage } from "../../../shared/page-templates/CrudResourcePage";
import { shelvesApi } from "../api/warehouseApi";
export default function ShelvesPage() { return <CrudResourcePage title="Shelves" description="Warehouse shelves backed by the verified shelves API." api={shelvesApi} fields={[{ name: "zoneId", label: "Zone ID", type: "number", required: true }, { name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }]} columns={["Id", "ZoneId", "Name", "Code", "IsActive"]} />; }
