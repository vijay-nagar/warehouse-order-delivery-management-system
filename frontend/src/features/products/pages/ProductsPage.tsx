import { CrudResourcePage } from "../../../components/tables/CrudResourcePage";
import { productsApi } from "../../../services/api/backend";

export default function ProductsPage() {
  return <CrudResourcePage title="Products" description="Product records supported by the backend." api={productsApi} fields={[{ name: "name", label: "Name", required: true }, { name: "sku", label: "SKU", required: true }, { name: "description", label: "Description" }, { name: "price", label: "Price", type: "number", required: true }]} columns={["id", "name", "sku", "price", "isActive"]} />;
}
