import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

import {
  createDelivery,
  getDeliveries,
  getMyDeliveries,
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
  requirePermission("DELIVERY_VIEW"),
  getDeliveryById,
);

// Assign Delivery
router.post(
  "/:id/assign",
  requirePermission("DELIVERY_ASSIGN"),
  assignDelivery,
);

// Pickup Delivery
router.post(
  "/:id/pickup",
  requirePermission("DELIVERY_PICKUP"),
  pickupDelivery,
);

// Out For Delivery
router.post(
  "/:id/out-for-delivery",
  requirePermission("DELIVERY_OUT_FOR_DELIVERY"),
  outForDelivery,
);

// Add Tracking
router.post(
  "/:id/tracking",
  requirePermission("DELIVERY_TRACKING"),
  addTracking,
);

// Complete Delivery
router.post(
  "/:id/delivered",
  requirePermission("DELIVERY_COMPLETE"),
  deliverDelivery,
);

// Fail Delivery
router.post(
  "/:id/failed",
  requirePermission("DELIVERY_FAIL"),
  failDelivery,
);

// Return Delivery
router.post(
  "/:id/returned",
  requirePermission("DELIVERY_RETURN"),
  returnDelivery,
);

export default router;