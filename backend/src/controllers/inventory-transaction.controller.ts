import type { Request, Response } from "express";

import { getSafeErrorMessage } from "../utils/error-response.js";
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
export const stockIn = async (req: Request, res: Response) => {
  try {
    const validation = stockInSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const result = await stockInService(validation.data);

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
export const stockOut = async (req: Request, res: Response) => {
  try {
    const validation = stockOutSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const result = await stockOutService(validation.data);

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
export const stockAdjustment = async (req: Request, res: Response) => {
  try {
    const validation = stockAdjustmentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const result = await stockAdjustmentService(validation.data);

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
  req: Request,
  res: Response,
) => {
  try {
    const inventoryId = Number(req.params.inventoryId);

    if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
      return res.status(400).json({
        message: "Invalid inventory ID",
      });
    }

    const result = await getTransactionHistoryService(inventoryId);

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    const message = getSafeErrorMessage(error, "Server error");

    return res.status(500).json({
      message,
    });
  }
};