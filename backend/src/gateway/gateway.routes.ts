import { Router } from "express";

import {
  gatewayAuthenticate,
  createGatewayLoginRateLimiter,
  createGatewayRateLimiter,
  gatewayRequestId,
  gatewayRequestLogger,
} from "./gateway.middleware.js";

import authRoutes from "../routes/auth.routes.js";
import customerRoutes from "../routes/customer.routes.js";
import productRoutes from "../routes/product.routes.js";
import warehouseRoutes from "../routes/warehouse.routes.js";
import zoneRoutes from "../routes/zone.routes.js";
import shelfRoutes from "../routes/shelf.routes.js";
import binRoutes from "../routes/bin.routes.js";
import inventoryRoutes from "../routes/inventory.routes.js";
import inventoryReservationRoutes from "../routes/inventory-reservation.routes.js";
import inventoryTransactionRoutes from "../routes/inventory-transaction.routes.js";
import orderRoutes from "../routes/order.routes.js";
import pickingRoutes from "../routes/picking.routes.js";
import packingRoutes from "../routes/packing.routes.js";
import deliveryRoutes from "../routes/delivery.routes.js";
import notificationRoutes from "../routes/notification.routes.js";
import reportRoutes from "../routes/report.routes.js";
import supportRoutes from "../routes/support.routes.js";

export const createGatewayRouter = (): Router => {
  const router = Router();

  /*
   * ---------------------------------------------------------
   * Gateway-wide middleware
   * ---------------------------------------------------------
   */

  router.use(gatewayRequestId);
  router.use(createGatewayRateLimiter());
  router.use(gatewayRequestLogger);

  /*
   * ---------------------------------------------------------
   * Gateway health
   * ---------------------------------------------------------
   */

  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "api-gateway",
      instance: process.env.INSTANCE_NAME ?? "unknown",
    });
  });

  /*
   * ---------------------------------------------------------
   * Authentication
   * ---------------------------------------------------------
   *
   * Login is public but strictly rate limited.
   * /auth/me remains protected inside auth.routes.ts.
   */

  router.use(
    "/auth/login",
    createGatewayLoginRateLimiter(),
  );

  router.use("/auth", authRoutes);

  /*
   * ---------------------------------------------------------
   * Protected domain routes
   * ---------------------------------------------------------
   */

  router.use(
    "/customers",
    gatewayAuthenticate,
    customerRoutes,
  );

  router.use(
    "/products",
    gatewayAuthenticate,
    productRoutes,
  );

  router.use(
    "/orders",
    gatewayAuthenticate,
    orderRoutes,
  );

  router.use(
    "/warehouses",
    gatewayAuthenticate,
    warehouseRoutes,
  );

  router.use(
    "/zones",
    gatewayAuthenticate,
    zoneRoutes,
  );

  router.use(
    "/shelves",
    gatewayAuthenticate,
    shelfRoutes,
  );

  router.use(
    "/bins",
    gatewayAuthenticate,
    binRoutes,
  );

  router.use(
    "/inventory",
    gatewayAuthenticate,
    inventoryRoutes,
  );

  router.use(
    "/inventory-reservation",
    gatewayAuthenticate,
    inventoryReservationRoutes,
  );

  router.use(
    "/inventory-transactions",
    gatewayAuthenticate,
    inventoryTransactionRoutes,
  );

  router.use(
    "/picking",
    gatewayAuthenticate,
    pickingRoutes,
  );

  router.use(
    "/packing",
    gatewayAuthenticate,
    packingRoutes,
  );

  router.use(
    "/delivery",
    gatewayAuthenticate,
    deliveryRoutes,
  );

  router.use(
    "/notifications",
    gatewayAuthenticate,
    notificationRoutes,
  );

  router.use(
    "/reports",
    gatewayAuthenticate,
    reportRoutes,
  );

  router.use(
    "/support",
    gatewayAuthenticate,
    supportRoutes,
  );

  /*
   * ---------------------------------------------------------
   * Unknown API route
   * ---------------------------------------------------------
   */

  router.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: "API route not found",
      code: "API_ROUTE_NOT_FOUND",
      requestId: res.locals.requestId,
    });
  });

  return router;
};

export default createGatewayRouter;