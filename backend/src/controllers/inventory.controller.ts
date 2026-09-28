 import type { Request, Response } from "express";

import {
  createInventoryService,
  getAllInventoryService,
  getInventoryByIdService,
  updateInventoryService,
  updateInventoryStatusService,
} from "../services/inventory.service.js";

import {
  createInventorySchema,
  updateInventorySchema,
} from "../validators/inventory.validator.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";

export const createInventory = async (
  req: Request,
  res: Response,
) => {
  try {
    const validation = createInventorySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const inventory = await createInventoryService(validation.data);

    return res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: inventory,
    });
   } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Warehouse not found" ||
        error.message === "Product not found" ||
        error.message === "Bin not found"
      ) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message ===
        "Inventory already exists for this warehouse and product"
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Create inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create inventory",
    });
  }
};
export const getAllInventory = async (
  req: Request,
  res: Response,
) => {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );
    const parseIntParam = (value: unknown): number | undefined =>
      typeof value === "string" && Number.isInteger(Number(value))
        ? Number(value)
        : undefined;

    const binId = parseIntParam(req.query.binId);
    const warehouseId = parseIntParam(req.query.warehouseId);
    const productId = parseIntParam(req.query.productId);

    const filters =
      binId !== undefined || warehouseId !== undefined || productId !== undefined
        ? {
            ...(binId !== undefined ? { binId } : {}),
            ...(warehouseId !== undefined ? { warehouseId } : {}),
            ...(productId !== undefined ? { productId } : {}),
          }
        : undefined;

    const inventory = await getAllInventoryService(pagination, filters);

    return res.status(200).json({
      success: true,
      data: inventory.items,
      pagination: toPaginationMeta(inventory),
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

export const getInventoryById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory ID",
      });
    }

    const inventory = await getInventoryByIdService(id);

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Inventory not found") {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    console.error("Get inventory by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

export const updateInventory = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory ID",
      });
    }

    const validation = updateInventorySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const inventory = await updateInventoryService(
      id,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Inventory not found" ||
        error.message === "Bin not found"
      ) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message ===
        "Reserved quantity cannot be greater than available quantity"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Update inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update inventory",
    });
  }
};

export const updateInventoryStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory ID",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const inventory = await updateInventoryStatusService(
      id,
      isActive,
    );

    return res.status(200).json({
      success: true,
      message: "Inventory status updated successfully",
      data: inventory,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Inventory not found") {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    console.error("Update inventory status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update inventory status",
    });
  }
};
