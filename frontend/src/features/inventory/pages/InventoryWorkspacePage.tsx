import { useCallback, useState } from "react";
import { Dialog } from "../../../shared/components/overlay/Dialog";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/feedback/AsyncStates";
import { Pagination } from "../../../shared/components/table/Pagination";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAsyncRequest } from "../../../shared/hooks/useAsyncRequest";
import { usePaginatedResourceList } from "../../../shared/hooks/usePaginatedResourceList";
import { toApiError } from "../../../shared/api/errors";
import { inventoryApi, inventoryTransactionsApi } from "../api/inventoryApi";
import type { ResourceRow } from "../../../shared/types/api";
import type { PaginatedResult, PaginationParams } from "../../../shared/types/pagination";

type TransactionKind = "stockIn" | "stockOut" | "adjustment";

export default function InventoryWorkspacePage() {
  const [binIdFilter, setBinIdFilter] = useState("");
  const loadInventory = useCallback((params?: PaginationParams) => {
    const binId = Number(binIdFilter);
    return inventoryApi.list({
      ...params,
      ...(binIdFilter.trim() && Number.isInteger(binId) && binId > 0 ? { binId } : {}),
    });
  }, [binIdFilter]);
  const { rows, loading, error, reload, page, pageSize, setPage, setPageSize, pagination } =
    usePaginatedResourceList(loadInventory);
  const mutation = useAsyncRequest<ResourceRow>();
  const reservation = useAsyncRequest<ResourceRow[]>();
  const historyRequest = useAsyncRequest<PaginatedResult<ResourceRow>>();
  const { notify } = useToast();
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [operation, setOperation] = useState<TransactionKind | null>(null);
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reserveOpen, setReserveOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [history, setHistory] = useState<ResourceRow[] | null>(null);

  const inventoryId = (row: ResourceRow) => Number(row.Id ?? row.id);
  const begin = (row: ResourceRow, kind: TransactionKind) => {
    setSelected(row); setOperation(kind); setQuantity(""); setRemarks("");
  };
  const submitTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !operation) return;
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount <= 0) { notify("Quantity must be a positive whole number."); return; }
    const data = { inventoryId: inventoryId(selected), quantity: amount, ...(remarks.trim() ? { remarks: remarks.trim() } : {}) };
    const call = operation === "stockIn" ? inventoryTransactionsApi.stockIn : operation === "stockOut" ? inventoryTransactionsApi.stockOut : inventoryTransactionsApi.adjustment;
    try {
      await mutation.execute(() => call(data));
      notify("Inventory transaction saved."); setOperation(null); setSelected(null); await reload();
    } catch (reason) { notify(toApiError(reason).message); }
  };
  const submitReservation = async (event: React.FormEvent) => {
    event.preventDefault(); const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) { notify("Enter a valid order ID."); return; }
    try {
      await reservation.execute(() => inventoryApi.reserve(id));
      notify("Stock reservation request completed."); setReserveOpen(false); setOrderId(""); await reload();
    } catch (reason) { notify(toApiError(reason).message); }
  };
  const loadHistory = async (row: ResourceRow) => {
    setSelected(row); setHistory(null);
    try {
      const result = await historyRequest.execute(() => inventoryTransactionsApi.history(inventoryId(row), { pageSize: 50 }));
      setHistory(result?.data ?? null);
    }
    catch (reason) { notify(toApiError(reason).message); }
  };

  return <main className="page-content">
    <header className="page-header"><div><h1>Inventory</h1><p>View stock and perform the verified inventory transactions.</p></div><button type="button" onClick={() => setReserveOpen(true)}>Reserve stock for order</button></header>
    <div className="module-panel" style={{ marginBottom: "1rem" }}><label>Filter by Bin ID <input type="number" min="1" step="1" value={binIdFilter} onChange={(event) => setBinIdFilter(event.target.value)} placeholder="All bins" /></label></div>
    {loading ? <LoadingState label="Loading inventory" /> : error ? <ErrorState message={error.message} onRetry={() => void reload()} /> : rows.length === 0 ? <EmptyState label="No inventory records found." /> : <div className="module-panel"><div className="module-table-wrapper"><table className="module-table"><thead><tr><th>ID</th><th>Product</th><th>Warehouse</th><th>Zone</th><th>Shelf</th><th>Bin</th><th>Reserved</th><th>Available</th><th>Active</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={inventoryId(row)}><td>{String(row.Id ?? row.id ?? "-")}</td><td>{String(row.ProductId ?? row.productId ?? "-")}</td><td>{String(row.WarehouseName ?? row.WarehouseId ?? row.warehouseId ?? "-")}</td><td>{String(row.ZoneName ?? "-")}</td><td>{String(row.ShelfName ?? "-")}</td><td>{String(row.BinName ?? "Unassigned")}</td><td>{String(row.ReservedQuantity ?? row.reservedQuantity ?? "-")}</td><td>{String(row.AvailableQuantity ?? row.availableQuantity ?? "-")}</td><td>{String(row.IsActive ?? row.isActive ?? "-")}</td><td><button type="button" onClick={() => begin(row, "stockIn")}>Stock in</button><button type="button" onClick={() => begin(row, "stockOut")}>Stock out</button><button type="button" onClick={() => begin(row, "adjustment")}>Adjust</button><button type="button" onClick={() => void loadHistory(row)}>History</button></td></tr>)}</tbody></table></div></div>}
    <Dialog open={operation !== null} title={operation === "stockIn" ? "Stock in" : operation === "stockOut" ? "Stock out" : "Inventory adjustment"} onClose={() => !mutation.loading && setOperation(null)}>
      <form className="resource-form" onSubmit={submitTransaction}><label>Quantity<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required disabled={mutation.loading} /></label><label>Remarks <span>(optional)</span><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} disabled={mutation.loading} /></label><div className="form-actions"><button type="button" onClick={() => setOperation(null)} disabled={mutation.loading}>Cancel</button><button type="submit" disabled={mutation.loading}>{mutation.loading ? "Saving…" : "Save"}</button></div></form>
    </Dialog>
    <Dialog open={reserveOpen} title="Reserve stock for order" onClose={() => !reservation.loading && setReserveOpen(false)}>
      <form className="resource-form" onSubmit={submitReservation}><label>Order ID<input type="number" min="1" step="1" value={orderId} onChange={(event) => setOrderId(event.target.value)} required disabled={reservation.loading} /></label><div className="form-actions"><button type="button" onClick={() => setReserveOpen(false)} disabled={reservation.loading}>Cancel</button><button type="submit" disabled={reservation.loading}>{reservation.loading ? "Reserving…" : "Reserve"}</button></div></form>
    </Dialog>
    <Dialog open={selected !== null && history !== null} title="Inventory transaction history" onClose={() => { setSelected(null); setHistory(null); }}><pre className="record-details">{JSON.stringify(history, null, 2)}</pre></Dialog>
    {historyRequest.loading && <LoadingState label="Loading transaction history" />}
    <Pagination page={page} pageCount={pagination?.totalPages ?? 1} totalRecords={pagination?.totalRecords} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
  </main>;
}
