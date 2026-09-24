import express from "express";
import cors from "cors";
import helmet from "helmet";

import { gatewayErrorHandler } from "./gateway/gateway.error.js";
import createGatewayRouter from "./gateway/gateway.routes.js";
import healthRouter from "./routes/health.routes.js";

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

  app.use("/api", createGatewayRouter());

  app.use(gatewayErrorHandler);

  return app;
};

export default createApp;
