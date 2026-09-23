import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { getOrderSummary } from "../controllers/report.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/orders/summary",
  requirePermission("REPORT_ORDER_SUMMARY"),
  getOrderSummary,
);

export default router;
