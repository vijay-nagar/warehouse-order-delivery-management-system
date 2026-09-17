import { Router } from "express";

import {
  createShelf,
  getAllShelves,
  getShelfById,
  updateShelf,
  updateShelfStatus,
} from "../controllers/shelf.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_CREATE"),
  createShelf
);

router.get(
  "/",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getAllShelves
);

router.get(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_VIEW"),
  getShelfById
);

router.put(
  "/:id",
  authenticate,
  requirePermission("WAREHOUSE_UPDATE"),
  updateShelf
);

router.patch(
  "/:id/status",
  authenticate,
  requirePermission("WAREHOUSE_STATUS_UPDATE"),
  updateShelfStatus
);

export default router;