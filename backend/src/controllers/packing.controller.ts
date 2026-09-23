import type { Request, Response } from "express";
import { PackingRepository } from "../repositories/packing.repository.js";
import { sendSafeErrorResponse } from "../utils/error-response.js";
import { PackingService } from "../services/packing.service.js";

const packingService = new PackingService(new PackingRepository());

export async function createPackingTask(req: Request, res: Response) {
  try {
    const result = await packingService.createTask(
      req.body.orderId,
      req.body.pickingTaskId,
      req.body.notes,
    );

    res.status(201).json({
      success: true,
      message: "Packing task created successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to create packing task", 400);
  }
}

export async function getPackingTasks(_req: Request, res: Response) {
  try {
    const result = await packingService.getTasks();

    res.json({
      success: true,
      data: result,
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
  try {
    const id = Number(req.params.id);

    const result = await packingService.assignTask(
      id,
      req.body.packerUserId,
    );

    res.json({
      success: true,
      message: "Packing task assigned successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to assign packing task", 400);
  }
}

export async function startPackingTask(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const result = await packingService.startTask(id);

    res.json({
      success: true,
      message: "Packing task started successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to start packing task", 400);
  }
}

export async function createPackage(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const result = await packingService.createPackage(
      id,
      req.body.weight,
    );

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to create package", 400);
  }
}

export async function completePackingTask(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const result = await packingService.completeTask(
      id,
      req.body.notes,
    );

    res.json({
      success: true,
      message: "Packing task completed successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to complete packing task", 400);
  }
}
