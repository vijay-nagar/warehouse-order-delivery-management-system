import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { PackingRepository } from "../repositories/packing.repository.js";
import { sendSafeErrorResponse } from "../utils/error-response.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";
import { PackingService } from "../services/packing.service.js";
import {
  assignPackingTaskSchema,
  completePackingTaskSchema,
  createPackageSchema,
  createPackingTaskSchema,
} from "../validators/packing.validator.js";

const packingService = new PackingService(new PackingRepository());

export async function createPackingTask(req: Request, res: Response) {
  const validation = createPackingTaskSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });
  }

  try {
    const result = await packingService.createTask(
      validation.data.orderId,
      validation.data.pickingTaskId,
      validation.data.notes,
    );

    return res.status(201).json({
      success: true,
      message: "Packing task created successfully",
      data: result,
    });
  } catch (error) {
    return sendSafeErrorResponse(res, error, "Failed to create packing task", 400);
  }
}

export async function getPackingTasks(req: Request, res: Response) {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    const result = await packingService.getTasks(
      pagination,
      status !== undefined ? { status } : undefined,
    );

    res.json({
      success: true,
      data: result.items,
      pagination: toPaginationMeta(result),
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to get packing tasks", 500);
  }
}

export async function getPackingTaskById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const result = await packingService.getTaskById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Packing task not found",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendSafeErrorResponse(res, error, "Failed to get packing task", 400);
  }
}

export async function assignPackingTask(req: Request, res: Response) {
  const validation = assignPackingTaskSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });
  }

  try {
    const id = Number(req.params.id);

    const result = await packingService.assignTask(
      id,
      validation.data.packerUserId,
    );

    return res.json({
      success: true,
      message: "Packing task assigned successfully",
      data: result,
    });
  } catch (error) {
    return sendSafeErrorResponse(res, error, "Failed to assign packing task", 400);
  }
}

export async function startPackingTask(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const id = Number(req.params.id);

    const result = await packingService.startTask(id, req.user.userId);

    return res.json({
      success: true,
      message: "Packing task started successfully",
      data: result,
    });
  } catch (error) {
    return sendSafeErrorResponse(res, error, "Failed to start packing task", 400);
  }
}

export async function createPackage(req: AuthenticatedRequest, res: Response) {
  const validation = createPackageSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const id = Number(req.params.id);

    const result = await packingService.createPackage(
      id,
      validation.data.weight,
      req.user.userId,
    );

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: result,
    });
  } catch (error) {
    return sendSafeErrorResponse(res, error, "Failed to create package", 400);
  }
}

export async function completePackingTask(req: AuthenticatedRequest, res: Response) {
  const validation = completePackingTaskSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const id = Number(req.params.id);

    const result = await packingService.completeTask(
      id,
      validation.data.notes,
      req.user.userId,
    );

    return res.json({
      success: true,
      message: "Packing task completed successfully",
      data: result,
    });
  } catch (error) {
    return sendSafeErrorResponse(res, error, "Failed to complete packing task", 400);
  }
}
