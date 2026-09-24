import { getDatabasePool } from "../config/database.js";

export const runOrderMonitorJob = async (): Promise<void> => {
  console.log("[JOB] Order monitor job started");

  try {
    const pool = await getDatabasePool();

    const result = await pool.request().query<{
      Id: number;
      OrderNumber: string;
      Status: string;
      CreatedAt: Date;
    }>(`
      SELECT
        Id,
        OrderNumber,
        Status,
        CreatedAt
      FROM dbo.Orders
      WHERE Status = 'CREATED'
        AND CreatedAt < DATEADD(MINUTE, -15, SYSUTCDATETIME())
      ORDER BY CreatedAt ASC;
    `);

    const staleOrders = result.recordset;

    console.log(
      `[JOB] Stale CREATED orders found: ${staleOrders.length}`,
    );

    for (const order of staleOrders) {
      console.log(
        `[JOB] Stale order → ${order.OrderNumber} | ` +
          `ID: ${order.Id} | ` +
          `CreatedAt: ${order.CreatedAt.toISOString()}`,
      );
    }

    console.log("[JOB] Order monitor job completed");
  } catch (error) {
    console.error("[JOB] Order monitor job failed:", error);
  }
};