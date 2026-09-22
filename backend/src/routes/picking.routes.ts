import { Router } from "express";

import {
  assignPickingTask,
  completePickingTask,
  updatePickingItem,
  createPickingTask,
  getPickingTaskById,
  getPickingTasks,
  startPickingTask,
} from "../controllers/picking.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermission("PICKING_CREATE"),
  createPickingTask,
);

router.get(
  "/",
  requirePermission("PICKING_VIEW"),
  getPickingTasks,
);

router.get(
  "/:id",
  requirePermission("PICKING_VIEW"),
  getPickingTaskById,
);

router.post(
  "/:id/assign",
  requirePermission("PICKING_ASSIGN"),
  assignPickingTask,
);

router.post(
  "/:id/start",
  requirePermission("PICKING_START"),
  startPickingTask,
);

router.post(
  "/:id/complete",
  requirePermission("PICKING_COMPLETE"),
  completePickingTask,
);

export default router;

router.patch(
  "/:id/items/:itemId",
  requirePermission("PICKING_UPDATE_ITEM"),
  updatePickingItem,
);
