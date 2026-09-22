import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function PickingPage() {
  return (
    <ResourceTablePage
      title="Picking"
      description="Monitor picking tasks generated from warehouse orders."
      endpoint="/api/picking"
      searchPlaceholder="Search picking tasks..."
      columns={[
        { key: "Id", label: "Task ID" },
        { key: "OrderId", label: "Order" },
        { key: "PickerUserId", label: "Picker" },
        { key: "Status", label: "Status" },
        { key: "CreatedAt", label: "Created" },
        { key: "CompletedAt", label: "Completed" },
      ]}
    />
  );
}
