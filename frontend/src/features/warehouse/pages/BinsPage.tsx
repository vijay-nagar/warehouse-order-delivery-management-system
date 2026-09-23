import { CrudResourcePage } from "../../../components/tables/CrudResourcePage";
import { binsApi } from "../../../services/api/backend";
export default function BinsPage() { return <CrudResourcePage title="Bins" description="Warehouse bins backed by the verified bins API." api={binsApi} fields={[{ name: "shelfId", label: "Shelf ID", type: "number", required: true }, { name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }]} columns={["Id", "ShelfId", "Name", "Code", "IsActive"]} />; }
