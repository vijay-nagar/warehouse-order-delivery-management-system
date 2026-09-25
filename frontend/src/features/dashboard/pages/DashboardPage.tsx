import { useEffect, useMemo, useState } from "react";
import { deliveryApi } from "../../delivery/api/deliveryApi";
import { inventoryApi } from "../../inventory/api/inventoryApi";
import { ordersApi } from "../../orders/api/ordersApi";
import { packingApi } from "../../packing/api/packingApi";
import { pickingApi } from "../../picking/api/pickingApi";
import { reportsApi } from "../../reports/api/reportsApi";
import { toApiError } from "../../../shared/api/errors";
import StatCard from "../components/StatCard";
import StatusCard from "../components/StatusCard";
import RecentOrders from "../components/RecentOrders";
import OrderStatusChart from "../components/OrderStatusChart";

type Row = Record<string, unknown>;

interface OrderStatusReport {
  status: string;
  orderCount: number;
  totalAmount: number;
}

interface OrderSummaryReport {
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  statusBreakdown: OrderStatusReport[];
}

interface DashboardData {
  orders: Row[];
  inventory: Row[];
  picking: Row[];
  packing: Row[];
  delivery: Row[];
  report: OrderSummaryReport;
}

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
    "picked",
    "packed",
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

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    orders: [],
    inventory: [],
    picking: [],
    packing: [],
    delivery: [],
    report: {
      totalOrders: 0,
      totalSales: 0,
      averageOrderValue: 0,
      statusBreakdown: [],
    },
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
        reportResponse,
      ] = await Promise.all([
        ordersApi.list(),
        inventoryApi.list(),
        pickingApi.list(),
        packingApi.list(),
        deliveryApi.list(),
        reportsApi.orderSummary(),
      ]);

      const report = reportResponse ?? {};

      setData({
        orders: extractRows(ordersResponse),
        inventory: extractRows(inventoryResponse),
        picking: extractRows(pickingResponse),
        packing: extractRows(packingResponse),
        delivery: extractRows(deliveryResponse),
        report: {
          totalOrders: Number(report.totalOrders ?? 0),
          totalSales: Number(report.totalSales ?? 0),
          averageOrderValue: Number(
            report.averageOrderValue ?? 0,
          ),
          statusBreakdown: Array.isArray(
            report.statusBreakdown,
          )
            ? report.statusBreakdown
            : [],
        },
      });
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

    const cancelledOrders =
      data.report.statusBreakdown
        .filter(
          (item) =>
            item.status.toLowerCase() === "cancelled" ||
            item.status.toLowerCase() === "canceled",
        )
        .reduce((total, item) => total + item.orderCount, 0);

    return {
      totalOrders: data.report.totalOrders,
      totalSales: data.report.totalSales,
      averageOrderValue: data.report.averageOrderValue,
      pendingOrders,
      cancelledOrders,
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
        <div className="module-state">
          Loading dashboard...
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>
            Overview of orders, inventory and warehouse
            operations.
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

      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Orders"
          value={summary.totalOrders.toLocaleString("en-IN")}
          description="Orders in database"
          icon="🛒"
          color="blue"
        />

        <StatCard
          title="Total Sales"
          value={formatCurrency(summary.totalSales)}
          description="Total order revenue"
          icon="💰"
          color="green"
        />

        <StatCard
          title="Average Order Value"
          value={formatCurrency(summary.averageOrderValue)}
          description="Average order amount"
          icon="📈"
          color="purple"
        />

        <StatCard
          title="Cancelled Orders"
          value={summary.cancelledOrders.toLocaleString("en-IN")}
          description="Cancelled orders"
          icon="⚠️"
          color="red"
        />
      </div>
      <div className="dashboard-charts-grid">
        <OrderStatusChart
          statusBreakdown={data.report.statusBreakdown}
          totalOrders={summary.totalOrders}
        />

        <section className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-header dashboard-chart-header">
            <div>
              <h2>Warehouse Operations</h2>
              <p>Tasks across different operational stages</p>
            </div>
          </div>

          <div className="dashboard-operation-bars">
            {[
              {
                label: "Picking",
                value: summary.activePicking,
                className: "picking",
              },
              {
                label: "Packing",
                value: summary.activePacking,
                className: "packing",
              },
              {
                label: "Delivery",
                value: summary.activeDeliveries,
                className: "delivery",
              },
              {
                label: "Returns",
                value: summary.returns,
                className: "returns",
              },
            ].map((item) => (
              <div
                className="dashboard-operation-bar-item"
                key={item.label}
              >
                <strong>{item.value}</strong>

                <div className="dashboard-operation-bar-track">
                  <div
                    className={`dashboard-operation-bar ${item.className}`}
                    style={{
                      height: `${Math.max(item.value * 3, 4)}px`,
                    }}
                  />
                </div>

                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="dashboard-section-heading">
        <div>
          <h2>Warehouse Operations</h2>
          <p>
            Current activity across operational stages.
          </p>
        </div>
      </div>

      <div className="dashboard-status-grid">
        <StatusCard
          title="Pending Orders"
          value={summary.pendingOrders}
          description="Currently processing"
        />

        <StatusCard
          title="Inventory Items"
          value={summary.inventoryItems}
          description="Current stock records"
        />

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
