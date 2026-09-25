import { useEffect, useMemo, useState } from "react";
import { deliveryApi } from "../../api/deliveryApi";
import type { ResourceRow } from "../../../../shared/types/api";
import { MAX_PAGE_SIZE } from "../../../../shared/types/pagination";

export default function MyDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<ResourceRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await deliveryApi.myDeliveries({ pageSize: MAX_PAGE_SIZE });
      setDeliveries(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load deliveries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeliveries();
  }, []);

  const filteredDeliveries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const deliveryStatus = String(
        delivery.Status ?? delivery.status ?? "",
      ).toUpperCase();

      const matchesStatus =
        status === "all" || deliveryStatus === status;

      const matchesSearch =
        !query ||
        Object.values(delivery).some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        );

      return matchesStatus && matchesSearch;
    });
  }, [deliveries, search, status]);

  return (
    <div className="db-page">
      <div className="db-page-heading">
        <div>
          <span className="db-eyebrow">DELIVERY WORK</span>
          <h2>My Deliveries</h2>
          <p>View and manage deliveries assigned to you.</p>
        </div>

        <button
          type="button"
          className="db-button db-button-secondary"
          onClick={() => void loadDeliveries()}
        >
          Refresh
        </button>
      </div>

      <div className="db-toolbar">
        <input
          className="db-input"
          placeholder="Search delivery..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="db-input db-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {error && <div className="db-alert">{error}</div>}

      <div className="db-card">
        <div className="db-card-header">
          <div>
            <h3>Assigned Deliveries</h3>
            <p>{filteredDeliveries.length} delivery records</p>
          </div>
        </div>

        {loading ? (
          <div className="db-empty">Loading deliveries...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="db-empty">
            <strong>No deliveries found</strong>
            <span>There are no deliveries matching your filters.</span>
          </div>
        ) : (
          <div className="db-delivery-list">
            {filteredDeliveries.map((delivery, index) => {
              const id = String(
                    delivery.Id ?? delivery.id ?? index,
                    );

                    const orderId = String(
                    delivery.OrderId ?? delivery.orderId ?? "-",
                    );
                                const deliveryStatus = String(
                delivery.Status ?? delivery.status ?? "UNKNOWN",
              ).toUpperCase();

              return (
                <div className="db-delivery-row" key={String(id)}>
                  <div className="db-delivery-main">
                    <div className="db-order-number">
                      Delivery #{id}
                    </div>

                    <div className="db-delivery-meta">
                      Order #{orderId}
                    </div>
                  </div>

                  <span className="db-status">
                    {deliveryStatus.replaceAll("_", " ")}
                  </span>

                  <div className="db-delivery-actions">
                    {deliveryStatus === "ASSIGNED" && (
                      <button
                        type="button"
                        className="db-button db-button-primary"
                        onClick={async () => {
                          await deliveryApi.pickup(Number(id));
                          await loadDeliveries();
                        }}
                      >
                        Pickup
                      </button>
                    )}

                    {deliveryStatus === "PICKED_UP" && (
                      <button
                        type="button"
                        className="db-button db-button-primary"
                        onClick={async () => {
                          await deliveryApi.outForDelivery(Number(id));
                          await loadDeliveries();
                        }}
                      >
                        Start Delivery
                      </button>
                    )}

                    {deliveryStatus === "OUT_FOR_DELIVERY" && (
                      <button
                        type="button"
                        className="db-button db-button-success"
                        onClick={async () => {
                          await deliveryApi.deliver(Number(id));
                          await loadDeliveries();
                        }}
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
