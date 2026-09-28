import type { Request, Response } from "express";

import { UserRepository } from "../repositories/user.repository.js";

const userRepository = new UserRepository();

const ASSIGNABLE_ROLES = new Set(["Picker", "Packer", "Delivery Boy"]);

export async function getEligibleUsers(req: Request, res: Response) {
  const role = typeof req.query.role === "string" ? req.query.role : undefined;

  if (!role || !ASSIGNABLE_ROLES.has(role)) {
    res.status(400).json({
      success: false,
      message: "A valid role query param is required (Picker, Packer, or Delivery Boy)",
    });
    return;
  }

  try {
    const users = await userRepository.findActiveByRole(role);

    console.log("[ELIGIBLE USERS]", {
      requestedRole: role,
      users,
    });

    res.status(200).json({
      success: true,
      message: "Eligible users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Get eligible users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch eligible users",
    });
  }
}
