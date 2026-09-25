import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { PickingRepository } from "../repositories/picking.repository.js";
import { PickingService } from "../services/picking.service.js";
import { HttpError } from "../utils/http-error.js";
import { sendSafeErrorResponse } from "../utils/error-response.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";
import {
  assignPickingTaskSchema,
  completePickingTaskSchema,
  updatePickingItemSchema,
  createPickingTaskSchema,
} from "../validators/picking.validator.js";

const pickingService = new PickingService(
  new PickingRepository(),
);

export const createPickingTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const validation = createPickingTaskSchema.safeParse(
    req.body,
  );

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const task = await pickingService.createTask(
      validation.data,
    );

    res.status(201).json({
      success: true,
      message: "Picking task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create picking task error:", error);
    sendSafeErrorResponse(res, error, "Failed to create picking task", 400);
  }
};

export const getPickingTasks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    const tasks = await pickingService.getTasks(
      pagination,
      status !== undefined ? { status } : undefined,
    );

    res.status(200).json({
      success: true,
      message: "Picking tasks fetched successfully",
      data: tasks.items,
      pagination: toPaginationMeta(tasks),
    });
  } catch (error) {
    console.error("Get picking tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch picking tasks",
    });
  }
};

export const getPickingTaskById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid picking task ID",
    });
    return;
  }

  try {
    const task = await pickingService.getTaskById(id);

    res.status(200).json({
      success: true,
      message: "Picking task fetched successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch picking task";

    res.status(message === "Picking task not found" ? 404 : 500).json({
      success: false,
      message,
    });
  }
};

export const assignPickingTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid picking task ID",
    });
    return;
  }

  const validation = assignPickingTaskSchema.safeParse(
    req.body,
  );

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const task = await pickingService.assignTask(
      id,
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Picking task assigned successfully",
      data: task,
    });
  } catch (error) {
    console.error("Assign picking task error:", error);
    sendSafeErrorResponse(res, error, "Failed to assign picking task", 400);
  }
};

export const startPickingTask = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid picking task ID",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const task = await pickingService.startTask(id, req.user.userId);

    res.status(200).json({
      success: true,
      message: "Picking task started successfully",
      data: task,
    });
  } catch (error) {
    console.error("Start picking task error:", error);
    sendSafeErrorResponse(res, error, "Failed to start picking task", 400);
  }
};

export const completePickingTask = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid picking task ID",
    });
    return;
  }

  const validation = completePickingTaskSchema.safeParse(
    req.body,
  );

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const task = await pickingService.completeTask(
      id,
      validation.data,
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      message: "Picking task completed successfully",
      data: task,
    });
  } catch (error) {
    console.error("Complete picking task error:", error);
    sendSafeErrorResponse(res, error, "Failed to complete picking task", 400);
  }
};


export const updatePickingItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const taskId = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    if (
      !Number.isInteger(taskId) ||
      taskId <= 0 ||
      !Number.isInteger(itemId) ||
      itemId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid picking task or item ID",
      });
      return;
    }

    const validation = updatePickingItemSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const item = await pickingService.updatePickingItem(
      taskId,
      itemId,
      validation.data.pickedQuantity,
      req.user.userId,
      validation.data.pickedBinId,
    );

    res.status(200).json({
      success: true,
      message: "Picking item updated successfully",
      data: item,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof Error) {
      if (
        error.message === "Picking task not found" ||
        error.message === "Picking item not found"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message === "Picking task must be in PICKING status") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    console.error("Update picking item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update picking item",
    });
  }
};
