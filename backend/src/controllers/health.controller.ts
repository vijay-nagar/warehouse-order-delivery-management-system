import type { Request, Response } from "express";

import { checkDatabaseConnection } from "../config/database.js";
import { redisService } from "../infrastructure/redis/redis.service.js";

export const getHealth = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const databaseConnected = await checkDatabaseConnection();
  const redisConnected = await redisService.ping();

  const isHealthy = databaseConnected && redisConnected;
  const status = isHealthy ? "ok" : "degraded";

  res.status(isHealthy ? 200 : 503).json({
    status,
    service: "warehouse-order-delivery-backend",
    database: databaseConnected ? "connected" : "disconnected",
    redis: redisConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
};