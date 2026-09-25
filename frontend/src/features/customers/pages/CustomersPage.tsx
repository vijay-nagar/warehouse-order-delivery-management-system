import { CrudResourcePage } from "../../../shared/page-templates/CrudResourcePage";
import { customersApi } from "../api/customersApi";

export default function CustomersPage() {
  return <CrudResourcePage title="Customers" description="Customer records supported by the backend." api={customersApi} fields={[{ name: "name", label: "Name", required: true }, { name: "phone", label: "Phone", required: true }, { name: "email", label: "Email", type: "email" }, { name: "addressLine1", label: "Address line 1", required: true }, { name: "addressLine2", label: "Address line 2" }, { name: "city", label: "City", required: true }, { name: "state", label: "State", required: true }, { name: "postalCode", label: "Postal code", required: true }]} columns={["id", "name", "phone", "email", "city", "isActive"]} />;
}
