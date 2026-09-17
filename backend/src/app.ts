import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRouter from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import orderRoutes from "./routes/order.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import productRoutes from "./routes/product.routes.js";
import zoneRoutes from "./routes/zone.routes.js";
import shelfRoutes from "./routes/shelf.routes.js";
import binRoutes from "./routes/bin.routes.js";
import inventoryTransactionRoutes from "./routes/inventory-transaction.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/auth", authRoutes);

app.use("/api/inventory", inventoryRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/products", productRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/shelves", shelfRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/inventory-transactions", inventoryTransactionRoutes);


export default app;
