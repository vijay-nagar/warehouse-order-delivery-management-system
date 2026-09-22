import { Router } from "express";
import reservationRoutes from "./inventory-reservation.routes.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

import {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
  updateInventoryStatus,
} from "../controllers/inventory.controller.js";

const router = Router();

router.use("/reservations", reservationRoutes);

router.post(
  "/",
  authenticate,
  requirePermission("INVENTORY_CREATE"),
  createInventory,
);

router.get(
  "/",
  authenticate,
  requirePermission("INVENTORY_VIEW"),
  getAllInventory,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("INVENTORY_VIEW"),
  getInventoryById,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("INVENTORY_UPDATE"),
  updateInventory,
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission("INVENTORY_STATUS_UPDATE"),
  updateInventoryStatus,
);

export default router;