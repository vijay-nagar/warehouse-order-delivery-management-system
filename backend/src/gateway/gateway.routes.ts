import { Router } from "express";
import { gatewayRequestLogger } from "./gateway.middleware.js";
import { gatewayRoutes } from "./gateway.config.js";

import authRoutes from "../routes/auth.routes.js";
import inventoryRoutes from "../routes/inventory.routes.js";
import warehouseRoutes from "../routes/warehouse.routes.js";
import orderRoutes from "../routes/order.routes.js";
import pickingRoutes from "../routes/picking.routes.js";
import packingRoutes from "../routes/packing.routes.js";
import deliveryRoutes from "../routes/delivery.routes.js";
import inventoryReservationRoutes from "../routes/inventory-reservation.routes.js";

const router = Router();

router.use(gatewayRequestLogger);

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    services: Object.values(gatewayRoutes).map((route) => route.service),
  });
});

router.get("/routes", (_req, res) => {
  res.json({
    service: "api-gateway",
    routes: gatewayRoutes,
  });
});

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/orders", orderRoutes);
router.use("/picking", pickingRoutes);
router.use("/packing", packingRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/inventory-reservation", inventoryReservationRoutes);

export default router;
