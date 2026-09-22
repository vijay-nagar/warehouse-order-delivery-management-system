import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function InventoryPage() {
  return (
    <ResourceTablePage
      title="Inventory"
      description="Track warehouse stock and inventory availability."
      endpoint="/api/inventory"
      searchPlaceholder="Search inventory..."
      columns={[
        { key: "Id", label: "ID" },
        { key: "ProductId", label: "Product" },
        { key: "WarehouseId", label: "Warehouse" },
        { key: "AvailableQuantity", label: "Available" },
        { key: "ReservedQuantity", label: "Reserved" },
        { key: "AvailableQuantity", label: "Available" },
        { key: "IsActive", label: "Active" },
      ]}
    />
  );
}
