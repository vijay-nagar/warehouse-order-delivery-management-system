import type { Request, Response } from "express";
import { gatewayRoutes } from "./gateway.config.js";
import { getGatewayTarget } from "./gateway.proxy.js";

export const gatewayHandler = (req: Request, res: Response) => {
  const servicePath = req.originalUrl.replace(/^\/api\/gateway\/proxy/, "");

  const matchedRoute = Object.values(gatewayRoutes).find((route) =>
    servicePath.startsWith(route.prefix),
  );

  if (!matchedRoute) {
    return res.status(404).json({
      success: false,
      message: "Gateway route not found",
    });
  }

  const target = getGatewayTarget(matchedRoute.service);

  if (!target) {
    return res.status(502).json({
      success: false,
      message: "Gateway service target not configured",
    });
  }

  return res.json({
    success: true,
    gateway: "api-gateway",
    service: target.name,
    target: target.baseUrl,
    path: servicePath,
    method: req.method,
  });
};
