import type {
  Request,
  Response,
} from "express";

import { gatewayRoutes } from "./gateway.config.js";
import { getGatewayTarget } from "./gateway.proxy.js";

export const gatewayHandler = (
  req: Request,
  res: Response,
): void => {
  const path = req.originalUrl;

  const matchedRoute = Object.values(gatewayRoutes).find(
    (route) => path.startsWith(route.prefix),
  );

  if (!matchedRoute) {
    res.status(404).json({
      success: false,
      message: "Gateway route not found",
      code: "GATEWAY_ROUTE_NOT_FOUND",
      requestId: res.locals.requestId,
    });

    return;
  }

  const target = getGatewayTarget(
    matchedRoute.service,
  );

  if (!target) {
    res.status(502).json({
      success: false,
      message: "Gateway service target not configured",
      code: "SERVICE_TARGET_NOT_CONFIGURED",
      service: matchedRoute.service,
      requestId: res.locals.requestId,
    });

    return;
  }

  res.status(200).json({
    success: true,
    service: target.name,
    target: target.baseUrl,
    path,
    method: req.method,
    requestId: res.locals.requestId,
  });
};