import type { Request, Response, NextFunction } from "express";

export const requirePositiveIntParam =
  (paramName: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const value = Number(req.params[paramName]);

    if (!Number.isInteger(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
      });
    }

    return next();
  };
