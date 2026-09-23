import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { requirePositiveIntParam } from "../middleware/param-validation.middleware.js";
import {
  createPackingTask,
  getPackingTasks,
  getPackingTaskById,
  assignPackingTask,
  startPackingTask,
  createPackage,
  completePackingTask,
} from "../controllers/packing.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("PACKING_CREATE"), createPackingTask);
router.get("/", requirePermission("PACKING_VIEW"), getPackingTasks);
router.get("/:id",
  requirePositiveIntParam("id"), requirePermission("PACKING_VIEW"), getPackingTaskById);
router.post("/:id/assign",
  requirePositiveIntParam("id"), requirePermission("PACKING_ASSIGN"), requireRoles("Packer"), assignPackingTask);
router.post("/:id/start",
  requirePositiveIntParam("id"), requirePermission("PACKING_START"), requireRoles("Packer"), startPackingTask);
router.post("/:id/packages",
  requirePositiveIntParam("id"), requirePermission("PACKING_CREATE_PACKAGE"), requireRoles("Packer"), createPackage);
router.post("/:id/complete",
  requirePositiveIntParam("id"), requirePermission("PACKING_COMPLETE"), requireRoles("Packer"), completePackingTask);

export default router;
