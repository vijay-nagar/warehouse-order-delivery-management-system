import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function OrdersPage() {
  return (
    <ResourceTablePage
      title="Orders"
      description="Manage customer orders and monitor their warehouse processing status."
      endpoint="/api/orders"
      searchPlaceholder="Search orders..."
      columns={[
        { key: "id", label: "ID" },
        { key: "orderNumber", label: "Order Number" },
        { key: "customerId", label: "Customer" },
        { key: "warehouseId", label: "Warehouse" },
        { key: "status", label: "Status" },
        { key: "totalAmount", label: "Amount" },
        { key: "createdAt", label: "Created" },
      ]}
    />
  );
}
