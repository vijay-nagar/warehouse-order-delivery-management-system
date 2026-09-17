import { Router } from "express";

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermission("CUSTOMER_CREATE"),
  createCustomer,
);

router.get(
  "/",
  requirePermission("CUSTOMER_VIEW"),
  getCustomers,
);

router.get(
  "/:id",
  requirePermission("CUSTOMER_VIEW"),
  getCustomerById,
);

router.put(
  "/:id",
  requirePermission("CUSTOMER_UPDATE"),
  updateCustomer,
);

router.delete(
  "/:id",
  requirePermission("CUSTOMER_DELETE"),
  deleteCustomer,
);

export default router;
