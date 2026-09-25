import type { Request, Response } from "express";

import {
  createWarehouseService,
  getAllWarehousesService,
  getWarehouseByIdService,
  updateWarehouseService,
  updateWarehouseStatusService,
} from "../services/warehouse.service.js";

import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from "../validators/warehouse.validator.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";

export const createWarehouse = async (
  req: Request,
  res: Response,
) => {
  try {
    const validation = createWarehouseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const warehouse = await createWarehouseService(validation.data);

    return res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Warehouse code already exists"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create warehouse error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create warehouse",
    });
  }
};

export const getAllWarehouses = async (
  req: Request,
  res: Response,
) => {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const warehouses = await getAllWarehousesService(pagination, search);

    return res.status(200).json({
      success: true,
      data: warehouses.items,
      pagination: toPaginationMeta(warehouses),
    });
  } catch (error) {
    console.error("Get warehouses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch warehouses",
    });
  }
};

export const getWarehouseById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid warehouse ID",
      });
    }

    const warehouse = await getWarehouseByIdService(id);

    return res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Warehouse not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    console.error("Get warehouse by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch warehouse",
    });
  }
};

export const updateWarehouse = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid warehouse ID",
      });
    }

    const validation = updateWarehouseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const warehouse = await updateWarehouseService(
      id,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: warehouse,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Warehouse not found") {
        return res.status(404).json({
          success: false,
          message: "Warehouse not found",
        });
      }

      if (error.message === "Warehouse code already exists") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Update warehouse error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update warehouse",
    });
  }
};

export const updateWarehouseStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid warehouse ID",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const warehouse = await updateWarehouseStatusService(
      id,
      isActive,
    );

    return res.status(200).json({
      success: true,
      message: "Warehouse status updated successfully",
      data: warehouse,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Warehouse not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    console.error("Update warehouse status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update warehouse status",
    });
  }
};