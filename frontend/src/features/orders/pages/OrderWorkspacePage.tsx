import { useState } from "react";
import { Dialog } from "../../../shared/components/overlay/Dialog";
import {
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../../../shared/components/feedback/AsyncStates";
import { Pagination } from "../../../shared/components/table/Pagination";
import { useToast } from "../../../app/providers/ToastProvider";
import { usePaginatedResourceList } from "../../../shared/hooks/usePaginatedResourceList";
import { ordersApi } from "../api/ordersApi";
import { productsApi } from "../../products/api/productsApi";
import { warehousesApi } from "../../warehouse/api/warehouseApi";
import { toApiError } from "../../../shared/api/errors";
import type { ResourceRow } from "../../../shared/types/api";

type OrderItem = {
  productId: number;
  quantity: number;
  productName: string;
};

type CreateForm = {
  customerId: string;
  warehouseId: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
};

const emptyForm: CreateForm = {
  customerId: "",
  warehouseId: "",
  shippingAddressLine1: "",
  shippingAddressLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
};

const positiveInteger = (value: number) =>
  Number.isInteger(value) && value > 0;

const getId = (row: ResourceRow) => Number(row.id ?? row.Id);

const getProductLabel = (row: ResourceRow) =>
  `${String(row.name ?? row.Name ?? `Product #${row.id ?? row.Id}`)}${
    row.sku ?? row.SKU ? ` (${String(row.sku ?? row.SKU)})` : ""
  }`;

const getWarehouseLabel = (row: ResourceRow) =>
  `${String(row.name ?? row.Name ?? `Warehouse #${row.id ?? row.Id}`)}${
    row.code ?? row.Code ? ` (${String(row.code ?? row.Code)})` : ""
  }`;

export default function OrderWorkspacePage() {
  const {
    rows,
    loading,
    error,
    reload,
    page,
    pageSize,
    setPage,
    setPageSize,
    pagination,
  } = usePaginatedResourceList(ordersApi.list);

  const { notify } = useToast();

  const [detail, setDetail] = useState<ResourceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const [products, setProducts] = useState<ResourceRow[]>([]);
  const [warehouses, setWarehouses] = useState<ResourceRow[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

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

  const openCreate = async () => {
    setForm(emptyForm);
    setItems([]);
    setSelectedProductId("");
    setQuantity("1");
    setCreating(true);

    if (products.length > 0 && warehouses.length > 0) {
      return;
    }

    setOptionsLoading(true);

    try {
      const [productResult, warehouseResult] = await Promise.all([
        productsApi.list(),
        warehousesApi.list(),
      ]);

      setProducts(productResult.data);
      setWarehouses(warehouseResult.data);
    } catch (requestError) {
      notify(toApiError(requestError).message);
      setCreating(false);
    } finally {
      setOptionsLoading(false);
    }
  };

  const addItem = () => {
    const productId = Number(selectedProductId);
    const itemQuantity = Number(quantity);

    if (!positiveInteger(productId)) {
      notify("Please select a product.");
      return;
    }

    if (!positiveInteger(itemQuantity)) {
      notify("Quantity must be a positive whole number.");
      return;
    }

    const product = products.find((row) => getId(row) === productId);

    if (!product) {
      notify("Selected product was not found.");
      return;
    }

    setItems((current) => {
      const existing = current.find((item) => item.productId === productId);

      if (existing) {
        return current.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + itemQuantity,
              }
            : item
        );
      }

      return [
        ...current,
        {
          productId,
          quantity: itemQuantity,
          productName: getProductLabel(product),
        },
      ];
    });

    setSelectedProductId("");
    setQuantity("1");
  };

  const removeItem = (productId: number) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
  };

  const create = async () => {
    const customerId = Number(form.customerId);
    const warehouseId = Number(form.warehouseId);

    if (!positiveInteger(customerId)) {
      notify("Customer ID must be a positive whole number.");
      return;
    }

    if (!positiveInteger(warehouseId)) {
      notify("Please select a warehouse.");
      return;
    }

    if (items.length === 0) {
      notify("Please add at least one product.");
      return;
    }

    if (!form.shippingAddressLine1.trim()) {
      notify("Shipping address is required.");
      return;
    }

    if (!form.shippingCity.trim()) {
      notify("City is required.");
      return;
    }

    if (!form.shippingState.trim()) {
      notify("State is required.");
      return;
    }

    if (!form.shippingPostalCode.trim()) {
      notify("Postal code is required.");
      return;
    }

    setBusy(true);

    try {
      await ordersApi.create({
        customerId,
        warehouseId,
        shippingAddressLine1: form.shippingAddressLine1.trim(),
        ...(form.shippingAddressLine2.trim()
          ? { shippingAddressLine2: form.shippingAddressLine2.trim() }
          : {}),
        shippingCity: form.shippingCity.trim(),
        shippingState: form.shippingState.trim(),
        shippingPostalCode: form.shippingPostalCode.trim(),
        items: items.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
      });

      await reload();

      setCreating(false);
      setForm(emptyForm);
      setItems([]);
      setSelectedProductId("");
      setQuantity("1");

      notify("Order created successfully.");
    } catch (requestError) {
      notify(toApiError(requestError).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading orders..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <section className="module-page">
      <PageHeader
        title="Orders"
        description="Create and manage customer orders."
        action={
          <button
            type="button"
            className="module-refresh-button"
            onClick={() => void openCreate()}
          >
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
                      <button
                        type="button"
                        onClick={() => void view(id)}
                        disabled={busy}
                      >
                        Details
                      </button>

                      {status === "CREATED" ? (
                        <button
                          type="button"
                          onClick={() => void cancel(id)}
                          disabled={busy}
                        >
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

      <Dialog
        open={detail !== null}
        title="Order details"
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <pre className="record-details">
            {JSON.stringify(detail, null, 2)}
          </pre>
        ) : null}
      </Dialog>

      <Dialog
        open={creating}
        title="Create order"
        onClose={() => setCreating(false)}
      >
        {optionsLoading ? (
          <LoadingState label="Loading products and warehouses..." />
        ) : (
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              void create();
            }}
          >
            <label className="form-field">
              <span>Customer ID</span>
              <input
                required
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                autoComplete="off"
                value={form.customerId}
                placeholder="Enter customer ID"
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");

                  setForm((current) => ({
                    ...current,
                    customerId: value,
                  }));
                }}
              />
            </label>

            <label className="form-field">
              <span>Warehouse</span>
              <select
                required
                value={form.warehouseId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    warehouseId: event.target.value,
                  }))
                }
              >
                <option value="">Select warehouse</option>

                {warehouses.map((warehouse) => (
                  <option key={getId(warehouse)} value={getId(warehouse)}>
                    {getWarehouseLabel(warehouse)}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-field">
              <span>Add product</span>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "end",
                }}
              >
                <select
                  value={selectedProductId}
                  onChange={(event) =>
                    setSelectedProductId(event.target.value)
                  }
                  style={{ flex: 1 }}
                >
                  <option value="">Select product</option>

                  {products.map((product) => (
                    <option key={getId(product)} value={getId(product)}>
                      {getProductLabel(product)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  style={{ width: "90px" }}
                  aria-label="Quantity"
                />

                <button type="button" onClick={addItem}>
                  Add
                </button>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="form-field">
                <span>Order items</span>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    >
                      <span>
                        {item.productName} × {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <small>No products added yet.</small>
            )}

            <label className="form-field">
              <span>Shipping address</span>
              <input
                required
                type="text"
                maxLength={500}
                value={form.shippingAddressLine1}
                placeholder="House / street / area"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shippingAddressLine1: event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-field">
              <span>Address line 2 (optional)</span>
              <input
                type="text"
                maxLength={500}
                value={form.shippingAddressLine2}
                placeholder="Apartment / landmark"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shippingAddressLine2: event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-field">
              <span>City</span>
              <input
                required
                type="text"
                maxLength={100}
                value={form.shippingCity}
                placeholder="Enter city"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shippingCity: event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-field">
              <span>State</span>
              <input
                required
                type="text"
                maxLength={100}
                value={form.shippingState}
                placeholder="Enter state"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shippingState: event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-field">
              <span>Postal code</span>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={20}
                autoComplete="postal-code"
                value={form.shippingPostalCode}
                placeholder="Enter postal code"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shippingPostalCode: event.target.value,
                  }))
                }
              />
            </label>

            <button className="login-submit" disabled={busy}>
              {busy ? "Creating..." : "Create order"}
            </button>
          </form>
        )}
      </Dialog>
    </section>
  );
}
