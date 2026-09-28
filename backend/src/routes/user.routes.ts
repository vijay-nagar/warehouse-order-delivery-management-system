import { Router } from "express";

import { getEligibleUsers } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

// Eligible assignees for Picker/Packer/Delivery Boy assignment dropdowns.
// Restricted to roles that are allowed to assign/reassign workers.
router.get(
  "/eligible",
  requireRoles(
    "Super Admin",
    "Warehouse Manager",
    "Delivery Manager",
  ),
  getEligibleUsers,
);

export default router;
