import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function PackingPage() {
  return (
    <ResourceTablePage
      title="Packing"
      description="Monitor packing tasks and package preparation."
      endpoint="/api/packing"
      searchPlaceholder="Search packing tasks..."
      columns={[
        { key: "Id", label: "Task ID" },
        { key: "OrderId", label: "Order" },
        { key: "PackerUserId", label: "Packer" },
        { key: "PackageCount", label: "Packages" },
        { key: "Status", label: "Status" },
        { key: "CreatedAt", label: "Created" },
      ]}
    />
  );
}
