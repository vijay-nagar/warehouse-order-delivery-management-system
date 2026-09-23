import { useEffect, useState } from "react";
import { reportsApi } from "../../../services/api/backend";
import { toApiError } from "../../../services/api/errors";

interface StatusReport {
  status: string;
  orderCount: number;
  totalAmount: number;
}

interface TopProductReport {
  productId: number;
  productName: string;
  sku: string;
  quantitySold: number;
  salesAmount: number;
}

interface OrderSummaryReport {
  fromDate: string | null;
  toDate: string | null;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  statusBreakdown: StatusReport[];
  topProducts: TopProductReport[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<OrderSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await reportsApi.orderSummary();
      setReport(response as unknown as OrderSummaryReport);
    } catch (requestError) {
      setError(toApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="module-page">
        <div className="module-panel">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="module-page">
        <div className="module-page-header">
          <div>
            <h1>Order Reports</h1>
            <p>Order summary and sales performance.</p>
          </div>
          <button className="module-refresh-button" onClick={loadReport}>
            Refresh
          </button>
        </div>

        <div className="module-alert">{error}</div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <h1>Order Reports</h1>
          <p>Order summary, sales performance, status breakdown, and top products.</p>
        </div>

        <button className="module-refresh-button" onClick={loadReport}>
          Refresh
        </button>
      </div>

      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-title">Total Orders</div>
          <div className="stat-card-value">{report.totalOrders}</div>
          <div className="stat-card-description">Orders in selected period</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Total Sales</div>
          <div className="stat-card-value">
            ₹{report.totalSales.toLocaleString("en-IN")}
          </div>
          <div className="stat-card-description">Total order sales</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Average Order Value</div>
          <div className="stat-card-value">
            ₹{report.averageOrderValue.toLocaleString("en-IN")}
          </div>
          <div className="stat-card-description">Average order amount</div>
        </div>
      </div>

      <div className="module-panel">
        <div className="module-page-header">
          <div>
            <h2>Status Breakdown</h2>
            <p>Orders grouped by current status.</p>
          </div>
        </div>

        {report.statusBreakdown.length === 0 ? (
          <div className="module-alert">No status data available.</div>
        ) : (
          <div className="module-table-wrapper">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.statusBreakdown.map((item) => (
                  <tr key={item.status}>
                    <td>
                      <span className="module-status">{item.status}</span>
                    </td>
                    <td>{item.orderCount}</td>
                    <td>₹{item.totalAmount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="module-panel">
        <div className="module-page-header">
          <div>
            <h2>Top Products</h2>
            <p>Top 10 products by quantity sold.</p>
          </div>
        </div>

        {report.topProducts.length === 0 ? (
          <div className="module-alert">No product sales data available.</div>
        ) : (
          <div className="module-table-wrapper">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity Sold</th>
                  <th>Sales Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td>{item.sku}</td>
                    <td>{item.quantitySold}</td>
                    <td>₹{item.salesAmount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
