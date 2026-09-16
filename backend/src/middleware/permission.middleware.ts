import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./auth.middleware.js";
import { UserRepository } from "../repositories/user.repository.js";

const userRepository = new UserRepository();

export const requirePermission = (permissionName: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    try {
      const hasPermission = await userRepository.hasPermission(
        req.user.userId,
        permissionName,
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: "Permission denied",
        });

        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
