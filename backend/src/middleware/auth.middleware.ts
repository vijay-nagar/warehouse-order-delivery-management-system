import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../utils/jwt.js";
import { UserRepository } from "../repositories/user.repository.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    roles: string[];
  };
}

const userRepository = new UserRepository();

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  const token = authorization.substring("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    const userIsActive = await userRepository.isActive(payload.userId);

    if (!userIsActive) {
      res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      username: payload.username,
      roles: payload.roles,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
