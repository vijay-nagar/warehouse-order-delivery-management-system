import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { getOrderSummary } from "../controllers/report.controller.js";

const router = Router();

router.use(authenticate);

router.get("/orders/summary", getOrderSummary);

export default router;
