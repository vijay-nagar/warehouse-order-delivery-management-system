import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

import {
  stockIn,
  stockOut,
  stockAdjustment,
  getTransactionHistory,
} from "../controllers/inventory-transaction.controller.js";

const router = Router();

// Stock In
router.post(
  "/stock-in",
  authenticate,
  requirePermission("INVENTORY_UPDATE"),
  stockIn,
);

// Stock Out
router.post(
  "/stock-out",
  authenticate,
  requirePermission("INVENTORY_UPDATE"),
  stockOut,
);

// Stock Adjustment
router.post(
  "/adjustment",
  authenticate,
  requirePermission("INVENTORY_UPDATE"),
  stockAdjustment,
);

// Transaction History
router.get(
  "/history/:inventoryId",
  authenticate,
  requirePermission("INVENTORY_VIEW"),
  getTransactionHistory,
);

export default router;