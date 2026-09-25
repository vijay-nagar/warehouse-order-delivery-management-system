import { useCallback, useEffect, useMemo, useState } from "react";
import "./DeliveryBoyDashboardPage.css";

import { deliveryApi } from "../api/deliveryApi";
import type { ResourceRow } from "../../../shared/types/api";
import { MAX_PAGE_SIZE } from "../../../shared/types/pagination";

type Delivery = ResourceRow & {
  Id?: number;
  id?: number;
  DeliveryId?: number;
  OrderId?: number;
  PackageId?: number;
  Status?: string;
  status?: string;
  CustomerName?: string;
  customerName?: string;
  CustomerPhone?: string;
  customerPhone?: string;
  Phone?: string;
  phone?: string;
  Address?: string;
  address?: string;
  DeliveryAddress?: string;
  deliveryAddress?: string;
  AssignedAt?: string;
  assignedAt?: string;
  DeliveredAt?: string;
  deliveredAt?: string;
  Remarks?: string;
  remarks?: string;
};

function getId(item: Delivery) {
  return item.Id ?? item.id ?? item.DeliveryId;
}

function getStatus(item: Delivery) {
  return String(item.Status ?? item.status ?? "UNKNOWN").toUpperCase();
}

function getCustomer(item: Delivery) {
  return (
    item.CustomerName ??
    item.customerName ??
    "Customer"
  );
}

function getPhone(item: Delivery) {
  return item.CustomerPhone ?? item.customerPhone ?? item.Phone ?? item.phone;
}

function getAddress(item: Delivery) {
  return (
    item.DeliveryAddress ??
    item.deliveryAddress ??
    item.Address ??
    item.address ??
    "Address not available"
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeliveryBoyDashboardPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedDelivery, setSelectedDelivery] =
    useState<Delivery | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDeliveries = useCallback(async () => {
    try {
      setError("");

      const response = await deliveryApi.myDeliveries({ pageSize: MAX_PAGE_SIZE });

      setDeliveries(Array.isArray(response.data) ? (response.data as Delivery[]) : []);
    } catch (err) {
      console.error("Failed to load delivery tasks:", err);
      setError("Unable to load your deliveries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const stats = useMemo(() => {
    const delivered = deliveries.filter(
      (item) => getStatus(item) === "DELIVERED",
    ).length;

    const failed = deliveries.filter(
      (item) =>
        getStatus(item) === "FAILED" ||
        getStatus(item) === "RETURNED",
    ).length;

    const active = deliveries.filter((item) =>
      ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(getStatus(item)),
    ).length;

    return {
      total: deliveries.length,
      delivered,
      active,
      failed,
    };
  }, [deliveries]);

  const currentDelivery = useMemo(() => {
    return (
      deliveries.find((item) =>
        ["OUT_FOR_DELIVERY", "PICKED_UP"].includes(getStatus(item)),
      ) ??
      deliveries.find((item) => getStatus(item) === "ASSIGNED") ??
      null
    );
  }, [deliveries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
  };

 const handlePickup = async (delivery: Delivery) => {
  const id = getId(delivery);

  if (!id || getStatus(delivery) !== "ASSIGNED") return;

  try {
    setActionLoading(true);
    setError("");

    await deliveryApi.pickup(id);
    await loadDeliveries();
  } catch (err) {
    console.error("Pickup failed:", err);
    setError("Unable to start pickup. Please try again.");
  } finally {
    setActionLoading(false);
  }
};

const handleOutForDelivery = async (delivery: Delivery) => {
  const id = getId(delivery);

  if (!id || getStatus(delivery) !== "PICKED_UP") return;

  try {
    setActionLoading(true);
    setError("");

    await deliveryApi.outForDelivery(id);
    await loadDeliveries();
  } catch (err) {
    console.error("Out-for-delivery action failed:", err);
    setError("Unable to start delivery. Please try again.");
  } finally {
    setActionLoading(false);
  }
};

const handleDelivered = async (delivery: Delivery) => {
  const id = getId(delivery);

  if (!id || getStatus(delivery) !== "OUT_FOR_DELIVERY") return;

  const confirmed = window.confirm(
    "Are you sure you want to mark this delivery as delivered?",
  );

  if (!confirmed) return;

  try {
    setActionLoading(true);
    setError("");

    await deliveryApi.deliver(id);
    setSelectedDelivery(null);

    await loadDeliveries();
  } catch (err) {
    console.error("Delivery completion failed:", err);
    setError("Unable to mark delivery as completed.");
  } finally {
    setActionLoading(false);
  }
};

const handleFailed = async (delivery: Delivery) => {
  const id = getId(delivery);

  if (!id || !["PICKED_UP", "OUT_FOR_DELIVERY"].includes(getStatus(delivery))) {
    return;
  }

  const reason = window.prompt(
    "Enter the reason why this delivery failed:",
  );

  const failureReason = reason?.trim();

  if (!failureReason) {
    setError("Failure reason is required.");
    return;
  }

  if (failureReason.length > 1000) {
    setError("Failure reason cannot exceed 1000 characters.");
    return;
  }

  try {
    setActionLoading(true);
    setError("");

    await deliveryApi.fail(id, {
      failureReason,
    });

    setSelectedDelivery(null);
    await loadDeliveries();
  } catch (err) {
    console.error("Delivery failure action failed:", err);
    setError("Unable to mark delivery as failed.");
  } finally {
    setActionLoading(false);
  }
};

const handleUpdateLocation = async (delivery: Delivery) => {
  const id = getId(delivery);
  const status = getStatus(delivery);

  if (!id) {
    setError("Invalid delivery ID.");
    return;
  }

  if (!["PICKED_UP", "OUT_FOR_DELIVERY"].includes(status)) {
    setError("Location can only be updated for an active delivery.");
    return;
  }

  if (!navigator.geolocation) {
    setError("Location services are not supported by this browser.");
    return;
  }

  try {
    setActionLoading(true);
    setError("");

    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      },
    );

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    if (latitude < -90 || latitude > 90) {
      setError("Invalid latitude received from your device.");
      return;
    }

    if (longitude < -180 || longitude > 180) {
      setError("Invalid longitude received from your device.");
      return;
    }

    await deliveryApi.addTracking(id, {
      latitude,
      longitude,
      remarks: "Location updated from Delivery Boy dashboard",
    });

    setError("");
  } catch (err) {
    console.error("Location update failed:", err);

    if (err instanceof GeolocationPositionError) {
      if (err.code === err.PERMISSION_DENIED) {
        setError("Location permission denied. Please allow location access.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError("Unable to determine your current location.");
      } else if (err.code === err.TIMEOUT) {
        setError("Location request timed out. Please try again.");
      } else {
        setError("Unable to get your current location.");
      }
    } else {
      setError("Unable to update delivery location.");
    }
  } finally {
    setActionLoading(false);
  }
};

  const openDirections = (delivery: Delivery) => {
    const address = getAddress(delivery);

    if (!address || address === "Address not available") return;

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address,
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const callCustomer = (delivery: Delivery) => {
    const phone = getPhone(delivery);

    if (!phone) return;

    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return (
      <div className="delivery-boy-state">
        <div className="delivery-boy-spinner" />
        <p>Loading your deliveries...</p>
      </div>
    );
  }

  return (
    <div className="delivery-dashboard">
      <div className="delivery-dashboard-top">
        <div>
          <span className="delivery-eyebrow">TODAY</span>
          <h2>My Delivery Dashboard</h2>
          <p>
            Manage your assigned deliveries and keep your customers updated.
          </p>
        </div>

        <button
          type="button"
          className="delivery-refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="delivery-alert">
          {error}
        </div>
      )}

      <div className="delivery-stats">
        <div className="delivery-stat-card">
          <span>Total Deliveries</span>
          <strong>{stats.total}</strong>
          <small>Assigned to you</small>
        </div>

        <div className="delivery-stat-card">
          <span>Delivered</span>
          <strong>{stats.delivered}</strong>
          <small>Completed successfully</small>
        </div>

        <div className="delivery-stat-card">
          <span>In Progress</span>
          <strong>{stats.active}</strong>
          <small>Active deliveries</small>
        </div>

        <div className="delivery-stat-card">
          <span>Failed / Returned</span>
          <strong>{stats.failed}</strong>
          <small>Needs attention</small>
        </div>
      </div>

      <div className="delivery-dashboard-grid">
        <section className="delivery-panel">
          <div className="delivery-panel-header">
            <div>
              <h3>Current Delivery</h3>
              <p>Your next priority</p>
            </div>

            {currentDelivery && (
              <span className={`delivery-status status-${getStatus(currentDelivery).toLowerCase()}`}>
                {formatStatus(getStatus(currentDelivery))}
              </span>
            )}
          </div>

          {currentDelivery ? (
            <div className="current-delivery">
              <div className="current-delivery-number">
                <span>Order</span>
                <strong>#{currentDelivery.OrderId ?? "—"}</strong>
              </div>

              <h4>{getCustomer(currentDelivery)}</h4>

              <p className="current-delivery-address">
                {getAddress(currentDelivery)}
              </p>

              <div className="current-delivery-meta">
                <span>
                  Delivery #{getId(currentDelivery) ?? "—"}
                </span>

                <span>
                  {formatDate(
                    currentDelivery.AssignedAt ??
                      currentDelivery.assignedAt,
                  )}
                </span>
              </div>

              <div className="delivery-action-row">
                {getPhone(currentDelivery) && (
                  <button
                    type="button"
                    className="delivery-secondary-button"
                    onClick={() => callCustomer(currentDelivery)}
                  >
                    Call Customer
                  </button>
                )}

                <button
                  type="button"
                  className="delivery-secondary-button"
                  onClick={() => openDirections(currentDelivery)}
                >
                  Get Directions
                </button>
              </div>

              <div className="delivery-primary-actions">
                {getStatus(currentDelivery) === "ASSIGNED" && (
                  <button
                    type="button"
                    onClick={() => handlePickup(currentDelivery)}
                    disabled={actionLoading}
                  >
                    Start Pickup
                  </button>
                )}

                {getStatus(currentDelivery) === "PICKED_UP" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOutForDelivery(currentDelivery)
                    }
                    disabled={actionLoading}
                  >
                    Start Delivery
                  </button>
                )}

                {getStatus(currentDelivery) === "OUT_FOR_DELIVERY" && (
                  <button
                    type="button"
                    onClick={() => handleDelivered(currentDelivery)}
                    disabled={actionLoading}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>

              {getStatus(currentDelivery) === "OUT_FOR_DELIVERY" && (
                <button
                  type="button"
                  className="delivery-failed-button"
                  onClick={() => handleFailed(currentDelivery)}
                  disabled={actionLoading}
                >
                  Mark Delivery Failed
                </button>
              )}
            </div>
          ) : (
            <div className="delivery-empty-current">
              <div className="delivery-empty-icon">✓</div>
              <h4>No active delivery</h4>
              <p>
                You currently don't have an active delivery to complete.
              </p>
            </div>
          )}
        </section>

        <section className="delivery-panel">
          <div className="delivery-panel-header">
            <div>
              <h3>Today's Route</h3>
              <p>Your assigned delivery stops</p>
            </div>
          </div>

          <div className="delivery-route-preview">
            <div className="route-map-placeholder">
              <div className="route-map-grid" />

              <div className="route-map-pin route-pin-one">1</div>
              <div className="route-map-pin route-pin-two">2</div>
              <div className="route-map-pin route-pin-three">3</div>

              <div className="route-current-location">
                <span />
                Your location
              </div>
            </div>

            <div className="route-info">
              <strong>{stats.active} active stops</strong>
              <span>Follow your assigned route and update each delivery.</span>
            </div>
          </div>
        </section>
      </div>

      <section className="delivery-panel">
        <div className="delivery-panel-header">
          <div>
            <h3>My Deliveries</h3>
            <p>Deliveries currently assigned to your account</p>
          </div>

          <span className="delivery-count">
            {deliveries.length} deliveries
          </span>
        </div>

        {deliveries.length === 0 ? (
          <div className="delivery-empty-list">
            <h4>No deliveries assigned</h4>
            <p>
              Once a delivery is assigned to you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="delivery-list">
            {deliveries.map((delivery) => {
              const status = getStatus(delivery);

              return (
                <article
                  className="delivery-card"
                  key={String(getId(delivery))}
                >
                  <div className="delivery-card-main">
                    <div className="delivery-order">
                      <span>Order</span>
                      <strong>
                        #{delivery.OrderId ?? "—"}
                      </strong>
                    </div>

                    <div className="delivery-customer">
                      <strong>{getCustomer(delivery)}</strong>
                      <span>{getAddress(delivery)}</span>
                    </div>

                    <span
                      className={`delivery-status status-${status.toLowerCase()}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  <div className="delivery-card-footer">
                    <span>
                      Delivery #{getId(delivery) ?? "—"}
                    </span>

                    <span>
                      {formatDate(
                        delivery.AssignedAt ?? delivery.assignedAt,
                      )}
                    </span>

                   <div className="delivery-card-actions">
                    <button
                        type="button"
                        onClick={() => setSelectedDelivery(delivery)}
                    >
                        View
                    </button>

                    {getPhone(delivery) && (
                        <button
                        type="button"
                        onClick={() => callCustomer(delivery)}
                        >
                        Call
                        </button>
                    )}

                    {getAddress(delivery) !== "Address not available" && (
                        <button
                        type="button"
                        onClick={() => openDirections(delivery)}
                        >
                        Directions
                        </button>
                    )}

                    {status === "ASSIGNED" && (
                        <button
                        type="button"
                        onClick={() => handlePickup(delivery)}
                        disabled={actionLoading}
                        >
                        Start Pickup
                        </button>
                    )}

                    {status === "PICKED_UP" && (
                        <>
                        <button
                            type="button"
                            onClick={() => handleUpdateLocation(delivery)}
                            disabled={actionLoading}
                        >
                            Update Location
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOutForDelivery(delivery)}
                            disabled={actionLoading}
                        >
                            Start Delivery
                        </button>
                        </>
                    )}

                    {status === "OUT_FOR_DELIVERY" && (
                        <>
                        <button
                            type="button"
                            onClick={() => handleUpdateLocation(delivery)}
                            disabled={actionLoading}
                        >
                            Update Location
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDelivered(delivery)}
                            disabled={actionLoading}
                        >
                            Delivered
                        </button>

                        <button
                            type="button"
                            className="delivery-danger-action"
                            onClick={() => handleFailed(delivery)}
                            disabled={actionLoading}
                        >
                            Failed
                        </button>
                        </>
                    )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedDelivery && (
        <div
          className="delivery-modal-backdrop"
          onClick={() => setSelectedDelivery(null)}
        >
          <div
            className="delivery-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delivery-modal-header">
              <div>
                <span>Delivery Details</span>
                <h3>
                  Order #{selectedDelivery.OrderId ?? "—"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
              >
                ×
              </button>
            </div>

            <div className="delivery-modal-body">
              <div>
                <span>Customer</span>
                <strong>{getCustomer(selectedDelivery)}</strong>
              </div>

              <div>
                <span>Address</span>
                <strong>{getAddress(selectedDelivery)}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{getPhone(selectedDelivery) || "—"}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {formatStatus(getStatus(selectedDelivery))}
                </strong>
              </div>
            </div>

            <div className="delivery-modal-actions">
              {getPhone(selectedDelivery) && (
                <button
                  type="button"
                  onClick={() => callCustomer(selectedDelivery)}
                >
                  Call Customer
                </button>
              )}

              <button
                type="button"
                onClick={() => openDirections(selectedDelivery)}
              >
                Directions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}