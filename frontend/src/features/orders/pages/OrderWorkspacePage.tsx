import { useCallback, useEffect, useState } from "react";
import { Dialog } from "../../../shared/components/overlay/Dialog";
import { SearchSelect } from "../../../shared/components/forms/SearchSelect";
import { ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/feedback/AsyncStates";
import { Pagination } from "../../../shared/components/table/Pagination";
import { useToast } from "../../../app/providers/ToastProvider";
import { usePaginatedResourceList } from "../../../shared/hooks/usePaginatedResourceList";
import { ordersApi } from "../api/ordersApi";
import { customersApi } from "../../customers/api/customersApi";
import { warehousesApi } from "../../warehouse/api/warehouseApi";
import { productsApi } from "../../products/api/productsApi";
import { inventoryApi } from "../../inventory/api/inventoryApi";
import { toApiError } from "../../../shared/api/errors";
import type { ResourceRow } from "../../../shared/types/api";

interface OrderItemDraft {
  key: string;
  product: ResourceRow | null;
  quantity: number;
  availableStock: number | null;
  stockLoading: boolean;
}

const emptyShipping = {
  shippingAddressLine1: "",
  shippingAddressLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
};

const newItemDraft = (): OrderItemDraft => ({
  key: Math.random().toString(36).slice(2),
  product: null,
  quantity: 1,
  availableStock: null,
  stockLoading: false,
});

const isRowActive = (row: ResourceRow) => (row.IsActive ?? row.isActive) !== false;
const rowName = (row: ResourceRow) => String(row.Name ?? row.name ?? "");
const productPrice = (row: ResourceRow) => Number(row.price ?? row.Price ?? 0);
const productSku = (row: ResourceRow) => String(row.sku ?? row.SKU ?? row.Sku ?? "");
const inventoryAvailable = (row: ResourceRow) => Number(row.AvailableQuantity ?? row.availableQuantity ?? 0);
const money = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrderWorkspacePage() {
  const { rows, loading, error, reload, page, pageSize, setPage, setPageSize, pagination } =
    usePaginatedResourceList(ordersApi.list);
  const { notify } = useToast();

  const [detail, setDetail] = useState<ResourceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const [customer, setCustomer] = useState<ResourceRow | null>(null);
  const [warehouses, setWarehouses] = useState<ResourceRow[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [shipping, setShipping] = useState(emptyShipping);
  const [items, setItems] = useState<OrderItemDraft[]>([newItemDraft()]);

  const view = async (id: number) => {
    setBusy(true);
    try {
      setDetail(await ordersApi.byId(id));
    } catch (requestError) {
      notify(toApiError(requestError).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: number) => {
    if (!window.confirm("Cancel this CREATED order?")) return;
    setBusy(true);
    try {
      await ordersApi.cancel(id);
      await reload();
      await view(id);
      notify("Order cancelled.");
    } catch (requestError) {
      notify(toApiError(requestError).message);
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setCustomer(null);
    setWarehouseId("");
    setShipping(emptyShipping);
    setItems([newItemDraft()]);
    setCreating(true);
  };

  useEffect(() => {
    if (!creating) return;
    warehousesApi
      .list({ pageSize: 100 })
      .then((result) => setWarehouses(result.data.filter(isRowActive)))
      .catch(() => setWarehouses([]));
  }, [creating]);

  const refreshStock = useCallback(
    async (draftKey: string, product: ResourceRow | null, warehouse: string) => {
      if (!product) {
        setItems((current) =>
          current.map((it) => (it.key === draftKey ? { ...it, availableStock: null, stockLoading: false } : it)),
        );
        return;
      }

      setItems((current) => current.map((it) => (it.key === draftKey ? { ...it, stockLoading: true } : it)));

      try {
        const productId = Number(product.id);
        const warehouseIdNum = warehouse ? Number(warehouse) : undefined;
        const result = await inventoryApi.list({
          pageSize: 50,
          productId,
          ...(warehouseIdNum !== undefined ? { warehouseId: warehouseIdNum } : {}),
        });
        const total = result.data
          .filter(isRowActive)
          .reduce((sum, row) => sum + inventoryAvailable(row), 0);

        setItems((current) =>
          current.map((it) => (it.key === draftKey ? { ...it, availableStock: total, stockLoading: false } : it)),
        );
      } catch {
        setItems((current) =>
          current.map((it) => (it.key === draftKey ? { ...it, availableStock: null, stockLoading: false } : it)),
        );
      }
    },
    [],
  );

  const handleWarehouseChange = (value: string) => {
    setWarehouseId(value);
    items.forEach((it) => {
      if (it.product) void refreshStock(it.key, it.product, value);
    });
  };

  const setItemProduct = (key: string, product: ResourceRow | null) => {
    setItems((current) => current.map((it) => (it.key === key ? { ...it, product, quantity: 1 } : it)));
    void refreshStock(key, product, warehouseId);
  };

  const setItemQuantity = (key: string, quantity: number) => {
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
    setItems((current) => current.map((it) => (it.key === key ? { ...it, quantity: safeQuantity } : it)));
  };

  const addItemRow = () => setItems((current) => [...current, newItemDraft()]);
  const removeItemRow = (key: string) =>
    setItems((current) => (current.length > 1 ? current.filter((it) => it.key !== key) : current));

  const filledItems = items.filter((it) => it.product !== null);
  const subtotal = filledItems.reduce((sum, it) => sum + productPrice(it.product as ResourceRow) * it.quantity, 0);
  const totalUnits = filledItems.reduce((sum, it) => sum + it.quantity, 0);

  const create = async () => {
    setBusy(true);
    try {
      if (!customer) {
        throw new Error("Validation: select a customer.");
      }

      if (filledItems.length === 0) {
        throw new Error("Validation: add at least one product to the order.");
      }

      for (const it of filledItems) {
        if (it.availableStock !== null && it.quantity > it.availableStock) {
          throw new Error(
            `Validation: only ${it.availableStock} unit(s) of ${rowName(it.product as ResourceRow)} are available.`,
          );
        }
      }

      if (
        !shipping.shippingAddressLine1.trim() ||
        !shipping.shippingCity.trim() ||
        !shipping.shippingState.trim() ||
        !shipping.shippingPostalCode.trim()
      ) {
        throw new Error("Validation: complete the shipping address.");
      }

      const created = await ordersApi.create({
        customerId: Number(customer.id),
        ...(warehouseId ? { warehouseId: Number(warehouseId) } : {}),
        shippingAddressLine1: shipping.shippingAddressLine1.trim(),
        ...(shipping.shippingAddressLine2.trim()
          ? { shippingAddressLine2: shipping.shippingAddressLine2.trim() }
          : {}),
        shippingCity: shipping.shippingCity.trim(),
        shippingState: shipping.shippingState.trim(),
        shippingPostalCode: shipping.shippingPostalCode.trim(),
        items: filledItems.map((it) => ({
          productId: Number((it.product as ResourceRow).id),
          quantity: it.quantity,
        })),
      });

      await reload();
      setCreating(false);

      const shortfalls = Array.isArray(created.shortfalls) ? (created.shortfalls as ResourceRow[]) : [];
      if (created.status === "OUT_OF_STOCK" && shortfalls.length > 0) {
        notify(
          `Order created, but stock is insufficient: ${shortfalls
            .map((s) => `product ${s.productId} needs ${s.required}, only ${s.available} in stock`)
            .join("; ")}.`,
        );
      } else {
        notify("Order created.");
      }
    } catch (requestError) {
      notify(
        requestError instanceof Error && requestError.message.startsWith("Validation:")
          ? requestError.message.replace("Validation: ", "")
          : toApiError(requestError).message,
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading orders..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => void reload()} />;

  return (
    <section className="module-page">
      <PageHeader
        title="Orders"
        description="Orders with backend-supported create, detail, and cancellation."
        action={
          <button type="button" className="module-refresh-button" onClick={openCreate}>
            Create order
          </button>
        }
      />
      <div className="module-panel">
        <div className="module-table-wrapper">
          <table className="module-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => {
                const id = Number(order.id);
                const status = String(order.status);
                return (
                  <tr key={id}>
                    <td>{String(order.orderNumber ?? id)}</td>
                    <td>{String(order.customerId ?? "-")}</td>
                    <td>{String(order.warehouseId ?? "-")}</td>
                    <td>
                      <StatusBadge>{status}</StatusBadge>
                    </td>
                    <td>{String(order.totalAmount ?? "-")}</td>
                    <td>
                      <button type="button" onClick={() => void view(id)} disabled={busy}>
                        Details
                      </button>
                      {status === "CREATED" ? (
                        <button type="button" onClick={() => void cancel(id)} disabled={busy}>
                          Cancel
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pagination?.totalPages ?? 1}
          totalRecords={pagination?.totalRecords}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Dialog open={detail !== null} title="Order details" onClose={() => setDetail(null)}>
        {detail ? <pre className="record-details">{JSON.stringify(detail, null, 2)}</pre> : null}
      </Dialog>

      <Dialog open={creating} title="Create order" onClose={() => setCreating(false)}>
        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <SearchSelect
            id="order-customer"
            label="Customer"
            placeholder="Search customer by name, phone or email"
            value={customer}
            onChange={setCustomer}
            autoFocus
            required
            fetchOptions={(search) =>
              customersApi.list({ search: search || undefined, pageSize: 8 }).then((result) => result.data)
            }
            getLabel={(row) => rowName(row)}
            getDescription={(row) => [row.phone, row.email].filter(Boolean).join(" · ") || undefined}
          />

          <label className="form-field" htmlFor="order-warehouse">
            <span>Warehouse</span>
            <select
              id="order-warehouse"
              value={warehouseId}
              onChange={(event) => handleWarehouseChange(event.target.value)}
            >
              <option value="">Auto-select (recommended)</option>
              {warehouses.map((warehouse) => (
                <option key={String(warehouse.Id ?? warehouse.id)} value={String(warehouse.Id ?? warehouse.id)}>
                  {rowName(warehouse)}
                </option>
              ))}
            </select>
            <small>
              Auto-select finds the first warehouse that can fulfil every item on this order. Pick a specific
              warehouse to check stock and reserve from that location only.
            </small>
          </label>

          <label className="form-field" htmlFor="order-address-1">
            <span>Shipping address line 1</span>
            <input
              id="order-address-1"
              type="text"
              required
              maxLength={500}
              placeholder="House / street / area"
              value={shipping.shippingAddressLine1}
              onChange={(event) => setShipping((current) => ({ ...current, shippingAddressLine1: event.target.value }))}
            />
          </label>

          <label className="form-field" htmlFor="order-address-2">
            <span>Shipping address line 2 (optional)</span>
            <input
              id="order-address-2"
              type="text"
              maxLength={500}
              placeholder="Landmark / apartment"
              value={shipping.shippingAddressLine2}
              onChange={(event) => setShipping((current) => ({ ...current, shippingAddressLine2: event.target.value }))}
            />
          </label>

          <label className="form-field" htmlFor="order-city">
            <span>City</span>
            <input
              id="order-city"
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Jaipur"
              value={shipping.shippingCity}
              onChange={(event) => setShipping((current) => ({ ...current, shippingCity: event.target.value }))}
            />
          </label>

          <label className="form-field" htmlFor="order-state">
            <span>State</span>
            <input
              id="order-state"
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Rajasthan"
              value={shipping.shippingState}
              onChange={(event) => setShipping((current) => ({ ...current, shippingState: event.target.value }))}
            />
          </label>

          <label className="form-field" htmlFor="order-postal-code">
            <span>Postal code</span>
            <input
              id="order-postal-code"
              type="text"
              required
              maxLength={20}
              placeholder="e.g. 302001"
              value={shipping.shippingPostalCode}
              onChange={(event) => setShipping((current) => ({ ...current, shippingPostalCode: event.target.value }))}
            />
          </label>

          <div className="form-field">
            <span>Order items</span>
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Available</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const overStock = item.availableStock !== null && item.quantity > item.availableStock;
                  return (
                    <tr key={item.key}>
                      <td>
                        <SearchSelect
                          id={`order-item-product-${item.key}`}
                          label=""
                          placeholder="Search product by name or SKU"
                          value={item.product}
                          onChange={(product) => setItemProduct(item.key, product)}
                          fetchOptions={(search) =>
                            productsApi.list({ search: search || undefined, pageSize: 8 }).then((result) => result.data)
                          }
                          getLabel={(row) => rowName(row)}
                          getDescription={(row) => productSku(row) || undefined}
                        />
                      </td>
                      <td className="order-items-qty">
                        <button
                          type="button"
                          disabled={!item.product || item.quantity <= 1}
                          onClick={() => setItemQuantity(item.key, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          disabled={!item.product}
                          value={item.quantity}
                          onChange={(event) => setItemQuantity(item.key, Number(event.target.value))}
                        />
                        <button
                          type="button"
                          disabled={!item.product}
                          onClick={() => setItemQuantity(item.key, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        {overStock ? (
                          <span className="order-items-stock-warning">Only {item.availableStock} available.</span>
                        ) : null}
                      </td>
                      <td>
                        {!item.product ? "-" : item.stockLoading ? "..." : (item.availableStock ?? "-")}
                      </td>
                      <td>{item.product ? money(productPrice(item.product)) : "-"}</td>
                      <td>{item.product ? money(productPrice(item.product) * item.quantity) : "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="order-item-remove"
                          disabled={items.length <= 1}
                          onClick={() => removeItemRow(item.key)}
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button type="button" className="order-items-add" onClick={addItemRow}>
              + Add product
            </button>
          </div>

          <div className="order-summary">
            <div className="order-summary-row">
              <span>Total items</span>
              <span>{totalUnits}</span>
            </div>
            <div className="order-summary-row order-summary-total">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
          </div>

          <button className="login-submit" disabled={busy}>
            {busy ? "Creating..." : "Create order"}
          </button>
        </form>
      </Dialog>
    </section>
  );
}
