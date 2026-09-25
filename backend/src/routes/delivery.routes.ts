import { Router } from "express";
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
  getMyDeliveries,
} from "../controllers/delivery.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { requirePositiveIntParam } from "../middleware/param-validation.middleware.js";

const router = Router();

router.use(authenticate);

// Create Delivery
router.post(
  "/",
  requirePermission("DELIVERY_CREATE"),
  createDelivery,
);

// Get All Deliveries
router.get(
  "/",
  requirePermission("DELIVERY_VIEW"),
  getDeliveries,
);

// Delivery Boy - My Assigned Deliveries
// Must be before /:id
router.get(
  "/my-deliveries",
  requirePermission("DELIVERY_VIEW"),
  getMyDeliveries,
);

// Get Delivery By ID
router.get(
  "/:id",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_VIEW"),
  getDeliveryById,
);

// Assign Delivery
router.post(
  "/:id/assign",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_ASSIGN"),
  assignDelivery,
);

// Pickup Delivery
router.post(
  "/:id/pickup",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_PICKUP"),
  requireRoles("Delivery Boy"),
  pickupDelivery,
);

// Out For Delivery
router.post(
  "/:id/out-for-delivery",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_OUT_FOR_DELIVERY"),
  requireRoles("Delivery Boy"),
  outForDelivery,
);

// Add Tracking
router.post(
  "/:id/tracking",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_TRACKING"),
  requireRoles("Delivery Boy"),
  addTracking,
);

// Complete Delivery
router.post(
  "/:id/delivered",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_COMPLETE"),
  requireRoles("Delivery Boy"),
  deliverDelivery,
);

// Fail Delivery
router.post(
  "/:id/failed",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_FAIL"),
  requireRoles("Delivery Boy"),
  failDelivery,
);

// Return Delivery
router.post(
  "/:id/returned",
  requirePositiveIntParam("id"),
  requirePermission("DELIVERY_RETURN"),
  requireRoles("Delivery Boy"),
  returnDelivery,
);

export default router;