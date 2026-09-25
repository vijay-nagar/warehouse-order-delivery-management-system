import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

import { requirePermission } from "../middleware/permission.middleware.js";

import {
  getOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controller.js";

import {
  getDeliveries,
  getDeliveryById,
  getDeliveryTracking,
} from "../controllers/delivery.controller.js";

import {
  getCustomers,
  getCustomerById,
  updateCustomer,
} from "../controllers/customer.controller.js";

const router = Router();

router.use(authenticate);

// ==================== ORDERS ====================

// Get all orders
router.get(
  "/orders",
  requirePermission("ORDER_VIEW"),
  getOrders,
);

// Get order details
router.get(
  "/orders/:id",
  requirePermission("ORDER_VIEW_DETAILS"),
  getOrderById,
);

// Cancel order
router.post(
  "/orders/:id/cancel",
  requirePermission("ORDER_CANCEL"),
  cancelOrder,
);

// ==================== DELIVERIES ====================

// Get all deliveries
router.get(
  "/deliveries",
  requirePermission("DELIVERY_VIEW"),
  getDeliveries,
);

// Get delivery tracking
// IMPORTANT: This route must come before /deliveries/:id
router.get(
  "/deliveries/:id/tracking",
  requirePermission("DELIVERY_TRACKING"),
  getDeliveryTracking,
);

// Get delivery details
router.get(
  "/deliveries/:id",
  requirePermission("DELIVERY_VIEW"),
  getDeliveryById,
);

// ==================== CUSTOMERS ====================

// Get all customers
router.get(
  "/customers",
  requirePermission("CUSTOMER_VIEW"),
  getCustomers,
);

// Get customer by ID
router.get(
  "/customers/:id",
  requirePermission("CUSTOMER_VIEW"),
  getCustomerById,
);

// Update customer
router.patch(
  "/customers/:id",
  requirePermission("CUSTOMER_UPDATE"),
  updateCustomer,
);

export default router;