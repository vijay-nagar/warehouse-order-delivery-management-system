import type { Request, Response } from "express";

import {
  createBinService,
  getAllBinsService,
  getBinByIdService,
  updateBinService,
  updateBinStatusService,
} from "../services/bin.service.js";

import {
  createBinSchema,
  updateBinSchema,
} from "../validators/bin.validator.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";

// Create Bin
export const createBin = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createBinSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const bin = await createBinService(validation.data);

    return res.status(201).json({
      success: true,
      message: "Bin created successfully",
      data: bin,
    });
  } catch (error: any) {
    if (error.message === "Shelf not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Bin already exists on this shelf") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create bin error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Bins
export const getAllBins = async (
  req: Request,
  res: Response
) => {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );
    const shelfIdParam = req.query.shelfId;
    const shelfId =
      typeof shelfIdParam === "string" && Number.isInteger(Number(shelfIdParam))
        ? Number(shelfIdParam)
        : undefined;

    const bins = await getAllBinsService(
      pagination,
      shelfId !== undefined ? { shelfId } : undefined,
    );

    return res.status(200).json({
      success: true,
      data: bins.items,
      pagination: toPaginationMeta(bins),
    });
  } catch (error) {
    console.error("Get all bins error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Bin By ID
export const getBinById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid bin ID",
      });
    }

    const bin = await getBinByIdService(id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: "Bin not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: bin,
    });
  } catch (error) {
    console.error("Get bin by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Bin
export const updateBin = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid bin ID",
      });
    }

    const validation = updateBinSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const bin = await updateBinService(
      id,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Bin updated successfully",
      data: bin,
    });
  } catch (error: any) {
    if (error.message === "Bin not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Bin already exists on this shelf") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update bin error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Bin Status
export const updateBinStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid bin ID",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const bin = await updateBinStatusService(
      id,
      isActive
    );

    return res.status(200).json({
      success: true,
      message: "Bin status updated successfully",
      data: bin,
    });
  } catch (error: any) {
    if (error.message === "Bin not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update bin status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};