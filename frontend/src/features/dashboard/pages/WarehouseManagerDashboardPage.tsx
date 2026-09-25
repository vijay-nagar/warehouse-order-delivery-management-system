import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { pickingApi } from "../../picking/api/pickingApi";
import { packingApi } from "../../packing/api/packingApi";
import { deliveryApi } from "../../delivery/api/deliveryApi";
import { toApiError } from "../../../shared/api/errors";

type Row = Record<string, unknown>;

function extractRows(payload: unknown): Row[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Row =>
        !!item && typeof item === "object",
    );
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const object = payload as Record<string, unknown>;

  for (const key of ["data", "items", "results", "rows"]) {
    const value = object[key];

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is Row =>
          !!item && typeof item === "object",
      );
    }

    if (value && typeof value === "object") {
      const nested = extractRows(value);

      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

function getStatus(row: Row): string {
  const key = Object.keys(row).find(
    (item) => item.toLowerCase() === "status",
  );

  return key
    ? String(row[key] ?? "").toLowerCase()
    : "";
}

function isActiveStatus(status: string) {
  return ![
    "completed",
    "complete",
    "delivered",
    "cancelled",
    "canceled",
    "returned",
    "failed",
    "closed",
    "picked",
    "packed",
  ].includes(status);
}

export default function WarehouseManagerDashboardPage() {
  const navigate = useNavigate();

  const [picking, setPicking] = useState<Row[]>([]);
  const [packing, setPacking] = useState<Row[]>([]);
  const [delivery, setDelivery] = useState<Row[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        pickingResponse,
        packingResponse,
        deliveryResponse,
      ] = await Promise.all([
        pickingApi.list(),
        packingApi.list(),
        deliveryApi.list(),
      ]);

      setPicking(extractRows(pickingResponse));
      setPacking(extractRows(packingResponse));
      setDelivery(extractRows(deliveryResponse));
    } catch (requestError) {
      setError(toApiError(requestError).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const activePicking = picking.filter((task) =>
      isActiveStatus(getStatus(task)),
    ).length;

    const activePacking = packing.filter((task) =>
      isActiveStatus(getStatus(task)),
    ).length;

    const activeDeliveries = delivery.filter((item) =>
      isActiveStatus(getStatus(item)),
    ).length;

    return {
      picking: picking.length,
      packing: packing.length,
      delivery: delivery.length,
      activePicking,
      activePacking,
      activeDeliveries,
    };
  }, [picking, packing, delivery]);

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="module-state">
          Loading warehouse dashboard...
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      {/* Header */}
      <div className="dashboard-heading">
        <div>
          <h1>Warehouse Manager</h1>

          <p>
            Operational overview of picking, packing and
            delivery activities.
          </p>
        </div>

        <button
          type="button"
          className="module-refresh-button"
          onClick={() => void loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="module-alert module-alert-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadDashboard()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Operational Cards */}
      <div
        className="dashboard-stats-grid"
        style={{
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        }}
      >
        {/* Picking */}
        <article className="dashboard-stat-card stat-card-blue">
          <div className="dashboard-stat-card-top">
            <div className="stat-card-icon">
              📦
            </div>

            <span>Picking Tasks</span>
          </div>

          <strong>
            {summary.picking.toLocaleString("en-IN")}
          </strong>


          <button
            type="button"
            className="dashboard-view-all-button"
            onClick={() => navigate("/picking")}
          >
            View All
          </button>
        </article>

        {/* Packing */}
        <article className="dashboard-stat-card stat-card-orange">
          <div className="dashboard-stat-card-top">
            <div className="stat-card-icon">
              📋
            </div>

            <span>Packing Tasks</span>
          </div>

          <strong>
            {summary.packing.toLocaleString("en-IN")}
          </strong>


          <button
            type="button"
            className="dashboard-view-all-button"
            onClick={() => navigate("/packing")}
          >
            View All
          </button>
        </article>

        {/* Delivery */}
        <article className="dashboard-stat-card stat-card-green">
          <div className="dashboard-stat-card-top">
            <div className="stat-card-icon">
              🚚
            </div>

            <span>Deliveries</span>
          </div>

          <strong>
            {summary.delivery.toLocaleString("en-IN")}
          </strong>

          <button
            type="button"
            className="dashboard-view-all-button"
            onClick={() => navigate("/delivery")}
          >
            View All
          </button>
        </article>
      </div>

      {/* Delivery Overview */}
      <div className="dashboard-section-heading">
        <div>
          <h2>Delivery Overview</h2>

          <p>
            Current delivery activity across the warehouse.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-section-link"
          onClick={() => navigate("/delivery")}
        >
          View All Deliveries →
        </button>
      </div>

      <div className="dashboard-status-grid">
        <div className="dashboard-status-card">
          <div className="dashboard-status-card-top">
            <span>Active Deliveries</span>

            <strong>
              {summary.activeDeliveries.toLocaleString("en-IN")}
            </strong>
          </div>

          <p>
            Assigned, picked up or out for delivery
          </p>
        </div>

        <div className="dashboard-status-card">
          <div className="dashboard-status-card-top">
            <span>Active Picking</span>

            <strong>
              {summary.activePicking.toLocaleString("en-IN")}
            </strong>
          </div>

          <p>
            Picking tasks currently in progress
          </p>
        </div>

        <div className="dashboard-status-card">
          <div className="dashboard-status-card-top">
            <span>Active Packing</span>

            <strong>
              {summary.activePacking.toLocaleString("en-IN")}
            </strong>
          </div>

          <p>
            Packing tasks currently in progress
          </p>
        </div>
      </div>
    </section>
  );
}