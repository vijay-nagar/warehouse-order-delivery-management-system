import type { Request, Response, NextFunction } from "express";

export const gatewayErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("[API GATEWAY ERROR]", err);

  res.status(500).json({
    success: false,
    message: "API Gateway error",
  });
};
