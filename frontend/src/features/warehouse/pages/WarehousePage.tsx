import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function WarehousePage() {
  return (
    <ResourceTablePage
      title="Warehouse"
      description="Monitor warehouses and their operational configuration."
      endpoint="/api/warehouses"
      searchPlaceholder="Search warehouses..."
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Warehouse" },
        { key: "code", label: "Code" },
        { key: "address", label: "Address" },
        { key: "city", label: "City" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
