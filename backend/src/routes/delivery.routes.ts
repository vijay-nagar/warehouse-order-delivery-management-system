import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { requirePositiveIntParam } from "../middleware/param-validation.middleware.js";
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
router.get("/:id",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_VIEW"), getDeliveryById);
router.post("/:id/assign",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_ASSIGN"), assignDelivery);
router.post("/:id/pickup",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_PICKUP"), requireRoles("Delivery Boy"), pickupDelivery);
router.post("/:id/out-for-delivery",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_OUT_FOR_DELIVERY"), requireRoles("Delivery Boy"), outForDelivery);
router.post("/:id/tracking",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_TRACKING"), requireRoles("Delivery Boy"), addTracking);
router.post("/:id/delivered",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_COMPLETE"), requireRoles("Delivery Boy"), deliverDelivery);
router.post("/:id/failed",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_FAIL"), requireRoles("Delivery Boy"), failDelivery);
router.post("/:id/returned",
  requirePositiveIntParam("id"), requirePermission("DELIVERY_RETURN"), requireRoles("Delivery Boy"), returnDelivery);

export default router;
