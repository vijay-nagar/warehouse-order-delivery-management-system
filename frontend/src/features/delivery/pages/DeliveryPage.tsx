import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function DeliveryPage() {
  return (
    <ResourceTablePage
      title="Delivery"
      description="Track delivery assignments and delivery lifecycle status."
      endpoint="/api/delivery"
      searchPlaceholder="Search deliveries..."
      columns={[
        { key: "Id", label: "Delivery ID" },
        { key: "OrderId", label: "Order" },
        { key: "PackageId", label: "Package" },
        { key: "DeliveryBoyUserId", label: "Delivery Boy" },
        { key: "Status", label: "Status" },
        { key: "AssignedAt", label: "Assigned" },
        { key: "PickedUpAt", label: "Picked Up" },
        { key: "OutForDeliveryAt", label: "Out for Delivery" },
        { key: "DeliveredAt", label: "Delivered" },
        { key: "FailedAt", label: "Failed" },
        { key: "ReturnedAt", label: "Returned" },
      ]}
    />
  );
}
