import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

import {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  updateWarehouseStatus,
} from "../controllers/warehouse.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_CREATE"),
  createWarehouse,
);

router.get(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getAllWarehouses,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getWarehouseById,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_UPDATE"),
  updateWarehouse,
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission("WAREHOUSE_STATUS_UPDATE"),
  updateWarehouseStatus,
);

export default router;