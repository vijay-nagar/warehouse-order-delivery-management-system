import { CrudResourcePage } from "../../../components/tables/CrudResourcePage";
import { shelvesApi } from "../../../services/api/backend";
export default function ShelvesPage() { return <CrudResourcePage title="Shelves" description="Warehouse shelves backed by the verified shelves API." api={shelvesApi} fields={[{ name: "zoneId", label: "Zone ID", type: "number", required: true }, { name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }]} columns={["Id", "ZoneId", "Name", "Code", "IsActive"]} />; }
