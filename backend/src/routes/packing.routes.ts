import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
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
router.get("/:id", requirePermission("PACKING_VIEW"), getPackingTaskById);
router.post("/:id/assign", requirePermission("PACKING_ASSIGN"), assignPackingTask);
router.post("/:id/start", requirePermission("PACKING_START"), startPackingTask);
router.post("/:id/packages", requirePermission("PACKING_CREATE_PACKAGE"), createPackage);
router.post("/:id/complete", requirePermission("PACKING_COMPLETE"), completePackingTask);

export default router;
