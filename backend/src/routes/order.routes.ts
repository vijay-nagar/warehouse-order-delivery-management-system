import { Router } from "express";

import {
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
} from "../controllers/order.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermission("ORDER_CREATE"),
  createOrder,
);

router.get(
  "/",
  requirePermission("ORDER_VIEW"),
  getOrders,
);

router.get(
  "/:id",
  requirePermission("ORDER_VIEW_DETAILS"),
  getOrderById,
);

router.post(
  "/:id/cancel",
  requirePermission("ORDER_CANCEL"),
  cancelOrder,
);

export default router;
