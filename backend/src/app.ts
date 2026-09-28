import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { gatewayErrorHandler } from "./gateway/gateway.error.js";
import createGatewayRouter from "./gateway/gateway.routes.js";
import healthRouter from "./routes/health.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);

  // API routes must be registered before the frontend fallback.
  app.use("/api", createGatewayRouter());

  // Serve React production build.
  const frontendDistPath = path.resolve(
    __dirname,
    "../../frontend/dist",
  );

  app.use(express.static(frontendDistPath));

  // React SPA fallback.
  app.use((req, res, next) => {
  if (
    req.method !== "GET" ||
    req.path.startsWith("/api") ||
    req.path.startsWith("/health")
  ) {
    return next();
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"));
});

  app.use(gatewayErrorHandler);

  return app;
};

export default createApp;