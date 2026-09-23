import { useEffect, useMemo, useState } from "react";
import { deliveryApi, inventoryApi, ordersApi, packingApi, pickingApi } from "../../../services/api/backend";
import StatCard from "../components/StatCard";
import StatusCard from "../components/StatusCard";
import RecentOrders from "../components/RecentOrders";

type Row = Record<string, unknown>;

interface DashboardData {
  orders: Row[];
  inventory: Row[];
  picking: Row[];
  packing: Row[];
  delivery: Row[];
}

function extractRows(payload: unknown): Row[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Row => !!item && typeof item === "object",
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
        (item): item is Row => !!item && typeof item === "object",
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

  return key ? String(row[key] ?? "").toLowerCase() : "";
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
  ].includes(status);
}

function isPendingOrder(status: string) {
  return [
    "pending",
    "processing",
    "created",
    "confirmed",
    "assigned",
    "picked",
    "packed",
  ].includes(status);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    orders: [],
    inventory: [],
    picking: [],
    packing: [],
    delivery: [],
  });

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
        ordersResponse,
        inventoryResponse,
        pickingResponse,
        packingResponse,
        deliveryResponse,
      ] = await Promise.all([
        ordersApi.list(),
        inventoryApi.list(),
        pickingApi.list(),
        packingApi.list(),
        deliveryApi.list(),
      ]);

      setData({
        orders: extractRows(ordersResponse),
        inventory: extractRows(inventoryResponse),
        picking: extractRows(pickingResponse),
        packing: extractRows(packingResponse),
        delivery: extractRows(deliveryResponse),
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to load dashboard data. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const pendingOrders = data.orders.filter((order) =>
      isPendingOrder(getStatus(order)),
    ).length;

    const activeDeliveries = data.delivery.filter((delivery) =>
      isActiveStatus(getStatus(delivery)),
    ).length;

    const activePicking = data.picking.filter((task) =>
      isActiveStatus(getStatus(task)),
    ).length;

    const activePacking = data.packing.filter((task) =>
      isActiveStatus(getStatus(task)),
    ).length;

    const returns = data.delivery.filter(
      (delivery) => getStatus(delivery) === "returned",
    ).length;

    return {
      totalOrders: data.orders.length,
      pendingOrders,
      inventoryItems: data.inventory.length,
      activeDeliveries,
      activePicking,
      activePacking,
      returns,
    };
  }, [data]);

  const recentOrders = useMemo(() => {
    return data.orders.slice(0, 5);
  }, [data.orders]);

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="module-state">Loading dashboard...</div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of orders, inventory and warehouse operations.</p>
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

      {error && (
        <div className="module-alert module-alert-error">
          <span>{error}</span>
          <button type="button" onClick={() => void loadDashboard()}>
            Retry
          </button>
        </div>
      )}

      <div className="dashboard-stats">
        <StatCard
          title="Total Orders"
          value={summary.totalOrders.toLocaleString()}
          description="Orders in system"
        />

        <StatCard
          title="Pending Orders"
          value={summary.pendingOrders.toLocaleString()}
          description="Currently processing"
        />

        <StatCard
          title="Inventory Items"
          value={summary.inventoryItems.toLocaleString()}
          description="Current stock records"
        />

        <StatCard
          title="Active Deliveries"
          value={summary.activeDeliveries}
          description="Currently active"
        />
      </div>

      <div className="dashboard-section-heading">
        <div>
          <h2>Warehouse Operations</h2>
          <p>Current activity across operational stages.</p>
        </div>
      </div>

      <div className="dashboard-status-grid">
        <StatusCard
          title="Picking"
          value={summary.activePicking}
          description="Tasks in progress"
        />

        <StatusCard
          title="Packing"
          value={summary.activePacking}
          description="Tasks in progress"
        />

        <StatusCard
          title="Delivery"
          value={summary.activeDeliveries}
          description="Active deliveries"
        />

        <StatusCard
          title="Returns"
          value={summary.returns}
          description="Returned deliveries"
        />
      </div>

      <RecentOrders orders={recentOrders} />
    </section>
  );
}
