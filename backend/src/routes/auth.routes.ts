import { Router } from "express";

import { login, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

router.post("/login", loginRateLimiter, login);

router.get(
  "/me",
  authenticate,
  requirePermission("AUTH_VIEW_PROFILE"),
  me,
);

export default router;
