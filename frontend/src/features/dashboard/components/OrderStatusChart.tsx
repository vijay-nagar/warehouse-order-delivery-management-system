interface OrderStatusReport {
  status: string;
  orderCount: number;
  totalAmount: number;
}

interface OrderStatusChartProps {
  statusBreakdown: OrderStatusReport[];
  totalOrders: number;
}

const statusColors: Record<string, string> = {
  created: "#f59e0b",
  pending: "#f59e0b",
  processing: "#22c55e",
  picked: "#10b981",
  packed: "#2563eb",
  assigned: "#8b5cf6",
  out_for_delivery: "#06b6d4",
  delivered: "#14b8a6",
  cancelled: "#ef4444",
  canceled: "#ef4444",
  returned: "#f97316",
};

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusColor(status: string) {
  return statusColors[status.toLowerCase()] ?? "#64748b";
}

function formatPercentage(value: number, total: number) {
  if (!total) return "0.00";

  return ((value / total) * 100).toFixed(2);
}

export default function OrderStatusChart({
  statusBreakdown,
  totalOrders,
}: OrderStatusChartProps) {
  const chartTotal = statusBreakdown.reduce(
    (total, item) => total + item.orderCount,
    0,
  );

  let currentPercentage = 0;

  const gradientParts = statusBreakdown.map((item) => {
    const percentage = chartTotal
      ? (item.orderCount / chartTotal) * 100
      : 0;

    const start = currentPercentage;
    const end = currentPercentage + percentage;

    currentPercentage = end;

    return `${getStatusColor(item.status)} ${start}% ${end}%`;
  });

  const gradient = gradientParts.length
    ? `conic-gradient(${gradientParts.join(", ")})`
    : "#e5e7eb";

  return (
    <section className="dashboard-panel dashboard-chart-panel">
      <div className="dashboard-panel-header dashboard-chart-header">
        <div>
          <h2>Order Status</h2>
          <p>Current distribution of orders by status</p>
        </div>
      </div>

      <div className="dashboard-chart-content">
        <div
          className="dashboard-donut"
          style={{ background: gradient }}
          aria-label="Order status distribution"
        >
          <div className="dashboard-donut-inner">
            <strong>
              {totalOrders.toLocaleString("en-IN")}
            </strong>

            <span>Total Orders</span>
          </div>
        </div>

        <div className="dashboard-chart-legend">
          {statusBreakdown.map((item) => (
            <div
              className="dashboard-legend-item"
              key={item.status}
            >
              <div className="dashboard-legend-name">
                <span
                  className="dashboard-legend-dot"
                  style={{
                    backgroundColor: getStatusColor(item.status),
                  }}
                />

                <span>{formatStatus(item.status)}</span>
              </div>

              <strong>
                {item.orderCount.toLocaleString("en-IN")}
              </strong>

              <small>
                {formatPercentage(
                  item.orderCount,
                  chartTotal,
                )}
                %
              </small>
            </div>
          ))}
        </div>
      </div>

      {statusBreakdown.length === 0 && (
        <div className="module-state">
          No order status data found.
        </div>
      )}
    </section>
  );
}