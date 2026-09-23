import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import {
  createNotification,
  getMyNotifications,
  getMyUnreadNotifications,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMyNotifications);

router.get("/me/unread", getMyUnreadNotifications);

router.patch("/:id/read", markNotificationAsRead);

router.post("/", requireRoles("Super Admin"), createNotification);

export default router;
