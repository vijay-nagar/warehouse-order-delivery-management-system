import type { Request, Response } from "express";
import { loginSchema } from "../validators/auth.validator.js";
import { AuthService } from "../services/auth.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const authService = new AuthService(
  new UserRepository(),
);

export const login = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });

    return;
  }

  try {
    const result = await authService.login(validation.data);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid username or password"
    ) {
      res.status(401).json({
        success: false,
        message: error.message,
      });

      return;
    }

    throw error;
  }
};

export const getMe = (
  req: AuthenticatedRequest,
  res: Response,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  res.status(200).json({
    success: true,
    data: {
      userId: req.user.userId,
      username: req.user.username,
      roles: req.user.roles,
    },
  });
};
export const me = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};
