import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function CustomersPage() {
  return (
    <ResourceTablePage
      title="Customers"
      description="View and manage customer information used by the order workflow."
      endpoint="/api/customers"
      searchPlaceholder="Search customers..."
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
