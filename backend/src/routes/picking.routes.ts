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
import { requireRoles } from "../middleware/role.middleware.js";
import { requirePositiveIntParam } from "../middleware/param-validation.middleware.js";

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
  requirePositiveIntParam("id"),
  requirePermission("PICKING_VIEW"),
  getPickingTaskById,
);

router.post(
  "/:id/assign",
  requirePositiveIntParam("id"),
  requirePermission("PICKING_ASSIGN"),
  requireRoles("Picker"),
  assignPickingTask,
);

router.post(
  "/:id/start",
  requirePositiveIntParam("id"),
  requirePermission("PICKING_START"),
  requireRoles("Picker"),
  startPickingTask,
);

router.post(
  "/:id/complete",
  requirePositiveIntParam("id"),
  requirePermission("PICKING_COMPLETE"),
  requireRoles("Picker"),
  completePickingTask,
);

router.patch(
  "/:id/items/:itemId",
  requirePositiveIntParam("id"),
  requirePositiveIntParam("itemId"),
  requirePermission("PICKING_UPDATE_ITEM"),
  requireRoles("Picker"),
  updatePickingItem,
);

export default router;
