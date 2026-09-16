import { Router } from "express";

import { login, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.post("/login", login);

router.get(
  "/me",
  authenticate,
  requirePermission("AUTH_VIEW_PROFILE"),
  me,
);

export default router;
