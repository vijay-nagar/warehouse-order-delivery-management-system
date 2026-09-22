import { Router } from "express";

import authRoutes from "../routes/auth.routes.js";
import inventoryRoutes from "../routes/inventory.routes.js";
import warehouseRoutes from "../routes/warehouse.routes.js";
import orderRoutes from "../routes/order.routes.js";
import pickingRoutes from "../routes/picking.routes.js";
import packingRoutes from "../routes/packing.routes.js";
import deliveryRoutes from "../routes/delivery.routes.js";
import supportRoutes from "../routes/support.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/orders", orderRoutes);
router.use("/picking", pickingRoutes);
router.use("/packing", packingRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/support", supportRoutes);

export default router;