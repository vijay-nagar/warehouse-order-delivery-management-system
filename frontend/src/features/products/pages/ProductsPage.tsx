import ResourceTablePage from "../../../components/tables/ResourceTablePage";

export default function ProductsPage() {
  return (
    <ResourceTablePage
      title="Products"
      description="View products that participate in inventory and order processing."
      endpoint="/api/products"
      searchPlaceholder="Search products..."
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "price", label: "Price" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
