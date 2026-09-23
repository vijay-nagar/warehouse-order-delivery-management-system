interface Order {
  [key: string]: unknown;
}

interface RecentOrdersProps {
  orders: Order[];
}

function getValue(order: Order, keys: string[]) {
  const key = keys.find((item) => item in order);
  return key ? order[key] : undefined;
}

function formatStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(value: unknown) {
  const status = String(value ?? "").toLowerCase();

  if (status === "created" || status === "pending") {
    return "status-created";
  }

  if (status === "cancelled" || status === "canceled") {
    return "status-cancelled";
  }

  if (status === "picked" || status === "packed") {
    return "status-processing";
  }

  if (status === "delivered" || status === "completed") {
    return "status-delivered";
  }

  return "status-default";
}

function formatAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function RecentOrders({
  orders,
}: RecentOrdersProps) {
  return (
    <div className="dashboard-panel recent-orders-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2>📋 Recent Orders</h2>
          <p>Latest customer orders from the system.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="module-state">
          No orders found.
        </div>
      ) : (
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order, index) => {
                const orderNumber = getValue(order, [
                  "orderNumber",
                  "OrderNumber",
                  "orderNo",
                  "OrderNo",
                  "id",
                  "Id",
                ]);

                const customer = getValue(order, [
                  "customerId",
                  "CustomerId",
                  "customer",
                  "Customer",
                ]);

                const warehouse = getValue(order, [
                  "warehouseId",
                  "WarehouseId",
                  "warehouse",
                  "Warehouse",
                ]);

                const status = getValue(order, [
                  "status",
                  "Status",
                ]);

                const amount = getValue(order, [
                  "totalAmount",
                  "TotalAmount",
                  "amount",
                  "Amount",
                ]);

                return (
                  <tr
                    key={String(
                      order.id ?? order.Id ?? index,
                    )}
                  >
                    <td className="order-index">
                      {index + 1}
                    </td>

                    <td className="order-number">
                      {String(orderNumber ?? "-")}
                    </td>

                    <td>
                      {String(customer ?? "-")}
                    </td>

                    <td>
                      {String(warehouse ?? "-")}
                    </td>

                    <td>
                      <span
                        className={`dashboard-status-badge ${getStatusClass(
                          status,
                        )}`}
                      >
                        {formatStatus(status)}
                      </span>
                    </td>

                    <td className="order-amount">
                      {formatAmount(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}