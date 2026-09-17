import { Router } from "express";

import {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
  updateZoneStatus,
} from "../controllers/zone.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_CREATE"),
  createZone,
);

router.get(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getAllZones,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getZoneById,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_UPDATE"),
  updateZone,
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission("WAREHOUSE_STATUS_UPDATE"),
  updateZoneStatus,
);

export default router;