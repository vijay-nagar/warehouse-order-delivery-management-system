import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getSafeErrorMessage } from "../utils/error-response.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";
import {
  stockInService,
  stockOutService,
  stockAdjustmentService,
  getTransactionHistoryService,
} from "../services/inventory-transaction.service.js";

import {
  stockInSchema,
  stockOutSchema,
  stockAdjustmentSchema,
} from "../validators/inventory-transaction.validator.js";

// Stock In
export const stockIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = stockInSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const result = await stockInService(validation.data, req.user?.userId);

    return res.status(201).json({
      message: "Stock added successfully",
      data: result,
    });
  } catch (error) {
    const message = getSafeErrorMessage(error, "Server error");

    return res.status(message === "Insufficient stock" ? 400 : 500).json({
      message,
    });
  }
};

// Stock Out
export const stockOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = stockOutSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const result = await stockOutService(validation.data, req.user?.userId);

    return res.status(201).json({
      message: "Stock removed successfully",
      data: result,
    });
  } catch (error) {
    const message = getSafeErrorMessage(error, "Server error");

    return res.status(
      message === "Insufficient stock" ||
        message === "Inventory not found"
        ? 400
        : 500,
    ).json({
      message,
    });
  }
};

// Stock Adjustment
export const stockAdjustment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = stockAdjustmentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const result = await stockAdjustmentService(validation.data, req.user?.userId);

    return res.status(201).json({
      message: "Stock adjusted successfully",
      data: result,
    });
  } catch (error) {
    const message = getSafeErrorMessage(error, "Server error");

    return res.status(500).json({
      message,
    });
  }
};

// Transaction History
export const getTransactionHistory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const inventoryId = Number(req.params.inventoryId);

    if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
      return res.status(400).json({
        message: "Invalid inventory ID",
      });
    }

    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );

    const result = await getTransactionHistoryService(inventoryId, pagination);

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: toPaginationMeta(result),
    });
  } catch (error) {
    const message = getSafeErrorMessage(error, "Server error");

    return res.status(500).json({
      message,
    });
  }
};