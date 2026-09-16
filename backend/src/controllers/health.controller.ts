import type { Request, Response } from "express";

import { checkDatabaseConnection } from "../config/database.js";

export const getHealth = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const databaseConnected = await checkDatabaseConnection();

  const status = databaseConnected ? "ok" : "degraded";

  res.status(databaseConnected ? 200 : 503).json({
    status,
    service: "warehouse-order-delivery-backend",
    database: databaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
};
