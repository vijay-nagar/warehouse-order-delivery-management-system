import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import type {
  OrderStatusReport,
  OrderSummaryReport,
  TopProductReport,
} from "../domain/reports/report.types.js";

interface SummaryRow {
  TotalOrders: number;
  TotalSales: number;
  AverageOrderValue: number;
}

interface StatusRow {
  Status: string;
  OrderCount: number;
  TotalAmount: number;
}

interface ProductRow {
  ProductId: number;
  ProductName: string;
  SKU: string;
  QuantitySold: number;
  SalesAmount: number;
}

export class ReportRepository {
  async getOrderSummary(
    fromDate?: string,
    toDate?: string,
  ): Promise<OrderSummaryReport> {
    const pool = await getDatabasePool();
    const request = pool.request();

    request.input("fromDate", sql.Date, fromDate ?? null);
    request.input("toDate", sql.Date, toDate ?? null);

    const result = await request.query<
      SummaryRow | StatusRow | ProductRow
    >(`
    

      SELECT
        COUNT(*) AS TotalOrders,
        COALESCE(SUM(TotalAmount), 0) AS TotalSales,
        COALESCE(AVG(TotalAmount), 0) AS AverageOrderValue
      FROM dbo.Orders
      WHERE
        (@fromDate IS NULL OR CreatedAt >= @fromDate)
        AND
        (@toDate IS NULL OR CreatedAt < DATEADD(DAY, 1, @toDate));

      SELECT
        Status,
        COUNT(*) AS OrderCount,
        COALESCE(SUM(TotalAmount), 0) AS TotalAmount
      FROM dbo.Orders
      WHERE
        (@fromDate IS NULL OR CreatedAt >= @fromDate)
        AND
        (@toDate IS NULL OR CreatedAt < DATEADD(DAY, 1, @toDate))
      GROUP BY Status
      ORDER BY COUNT(*) DESC;

      SELECT TOP 10
        oi.ProductId,
        p.Name AS ProductName,
        p.SKU,
        SUM(oi.Quantity) AS QuantitySold,
        COALESCE(SUM(oi.TotalPrice), 0) AS SalesAmount
      FROM dbo.OrderItems oi
      INNER JOIN dbo.Orders o
        ON o.Id = oi.OrderId
      INNER JOIN dbo.Products p
        ON p.Id = oi.ProductId
      WHERE
        (@fromDate IS NULL OR o.CreatedAt >= @fromDate)
        AND
        (@toDate IS NULL OR o.CreatedAt < DATEADD(DAY, 1, @toDate))
      GROUP BY
        oi.ProductId,
        p.Name,
        p.SKU
      ORDER BY SUM(oi.Quantity) DESC;
    `);

    const summaryRecordset = result.recordsets[0] as SummaryRow[] | undefined;
    const summary = summaryRecordset?.[0];
    const statusRows = result.recordsets[1] as unknown as StatusRow[];
    const productRows = result.recordsets[2] as unknown as ProductRow[];

    return {
      fromDate: fromDate ?? null,
      toDate: toDate ?? null,
      totalOrders: Number(summary?.TotalOrders ?? 0),
      totalSales: Number(summary?.TotalSales ?? 0),
      averageOrderValue: Number(summary?.AverageOrderValue ?? 0),
      statusBreakdown: statusRows.map(
        (row): OrderStatusReport => ({
          status: row.Status,
          orderCount: Number(row.OrderCount),
          totalAmount: Number(row.TotalAmount),
        }),
      ),
      topProducts: productRows.map(
        (row): TopProductReport => ({
          productId: row.ProductId,
          productName: row.ProductName,
          sku: row.SKU,
          quantitySold: Number(row.QuantitySold),
          salesAmount: Number(row.SalesAmount),
        }),
      ),
    };
  }
}
