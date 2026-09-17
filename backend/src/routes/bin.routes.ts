import { Router } from "express";

import {
  createBin,
  getAllBins,
  getBinById,
  updateBin,
  updateBinStatus,
} from "../controllers/bin.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_CREATE"),
  createBin
);

router.get(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getAllBins
);

router.get(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getBinById
);

router.put(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_UPDATE"),
  updateBin
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission("WAREHOUSE_STATUS_UPDATE"),
  updateBinStatus
);

export default router;