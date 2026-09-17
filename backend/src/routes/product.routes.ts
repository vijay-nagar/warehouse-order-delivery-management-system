import { Router } from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requirePermission("PRODUCT_CREATE"),
  createProduct,
);

router.get(
  "/",
  requirePermission("PRODUCT_VIEW"),
  getProducts,
);

router.get(
  "/:id",
  requirePermission("PRODUCT_VIEW"),
  getProductById,
);

router.put(
  "/:id",
  requirePermission("PRODUCT_UPDATE"),
  updateProduct,
);

router.delete(
  "/:id",
  requirePermission("PRODUCT_DELETE"),
  deleteProduct,
);

export default router;
