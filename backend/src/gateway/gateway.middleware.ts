import type { Request, Response, NextFunction } from "express";

export const gatewayRequestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  console.log(
    `[API GATEWAY] ${req.method} ${req.originalUrl}`,
  );

  next();
};
