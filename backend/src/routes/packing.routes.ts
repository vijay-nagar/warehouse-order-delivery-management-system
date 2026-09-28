import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { requirePositiveIntParam } from "../middleware/param-validation.middleware.js";
import {
  createPackingTask,
  getPackingTasks,
  getMyPackingTasks,
  getPackingTaskById,
  assignPackingTask,
  reassignPackingTask,
  startPackingTask,
  createPackage,
  completePackingTask,
} from "../controllers/packing.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("PACKING_CREATE"), createPackingTask);
router.get("/", requirePermission("PACKING_VIEW"), getPackingTasks);
// Packer - My Assigned Packing Tasks
// Must be before /:id
router.get("/my-tasks", requirePermission("PACKING_VIEW"), getMyPackingTasks);
router.get("/:id",
  requirePositiveIntParam("id"), requirePermission("PACKING_VIEW"), getPackingTaskById);
router.post("/:id/assign",
  requirePositiveIntParam("id"), requirePermission("PACKING_ASSIGN"), requireRoles("Super Admin", "Warehouse Manager"), assignPackingTask);
router.post("/:id/reassign",
  requirePositiveIntParam("id"), requirePermission("PACKING_ASSIGN"), requireRoles("Super Admin", "Warehouse Manager"), reassignPackingTask);
router.post("/:id/start",
  requirePositiveIntParam("id"), requirePermission("PACKING_START"), requireRoles("Packer"), startPackingTask);
router.post("/:id/packages",
  requirePositiveIntParam("id"), requirePermission("PACKING_CREATE_PACKAGE"), requireRoles("Packer"), createPackage);
router.post("/:id/complete",
  requirePositiveIntParam("id"), requirePermission("PACKING_COMPLETE"), requireRoles("Packer"), completePackingTask);

export default router;
