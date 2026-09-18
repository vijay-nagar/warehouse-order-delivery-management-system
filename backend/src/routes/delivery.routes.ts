import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  assignDelivery,
  pickupDelivery,
  outForDelivery,
  deliverDelivery,
  failDelivery,
  returnDelivery,
  addTracking,
} from "../controllers/delivery.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("DELIVERY_CREATE"), createDelivery);
router.get("/", requirePermission("DELIVERY_VIEW"), getDeliveries);
router.get("/:id", requirePermission("DELIVERY_VIEW"), getDeliveryById);
router.post("/:id/assign", requirePermission("DELIVERY_ASSIGN"), assignDelivery);
router.post("/:id/pickup", requirePermission("DELIVERY_PICKUP"), pickupDelivery);
router.post("/:id/out-for-delivery", requirePermission("DELIVERY_OUT_FOR_DELIVERY"), outForDelivery);
router.post("/:id/tracking", requirePermission("DELIVERY_TRACKING"), addTracking);
router.post("/:id/delivered", requirePermission("DELIVERY_COMPLETE"), deliverDelivery);
router.post("/:id/failed", requirePermission("DELIVERY_FAIL"), failDelivery);
router.post("/:id/returned", requirePermission("DELIVERY_RETURN"), returnDelivery);

export default router;
