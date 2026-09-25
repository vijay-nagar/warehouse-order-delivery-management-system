import type { Request, Response } from "express";

import {
  createZoneService,
  getAllZonesService,
  getZoneByIdService,
  updateZoneService,
  updateZoneStatusService,
} from "../services/zone.service.js";

import {
  createZoneSchema,
  updateZoneSchema,
} from "../validators/zone.validator.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";

// Create Zone
export const createZone = async (
  req: Request,
  res: Response,
) => {
  try {
    const validation = createZoneSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const zone = await createZoneService(validation.data);

    return res.status(201).json({
      success: true,
      message: "Zone created successfully",
      data: zone,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Warehouse not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === "Zone already exists in this warehouse") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Create zone error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create zone",
    });
  }
};

// Get All Zones
export const getAllZones = async (
  req: Request,
  res: Response,
) => {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );
    const warehouseIdParam = req.query.warehouseId;
    const warehouseId =
      typeof warehouseIdParam === "string" && Number.isInteger(Number(warehouseIdParam))
        ? Number(warehouseIdParam)
        : undefined;

    const zones = await getAllZonesService(
      pagination,
      warehouseId !== undefined ? { warehouseId } : undefined,
    );

    return res.status(200).json({
      success: true,
      data: zones.items,
      pagination: toPaginationMeta(zones),
    });
  } catch (error) {
    console.error("Get zones error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch zones",
    });
  }
};

// Get Zone by ID
export const getZoneById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid zone ID",
      });
    }

    const zone = await getZoneByIdService(id);

    return res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Zone not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Get zone by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch zone",
    });
  }
};

// Update Zone
export const updateZone = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid zone ID",
      });
    }

    const validation = updateZoneSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const zone = await updateZoneService(
      id,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Zone updated successfully",
      data: zone,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Zone not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === "Zone code already exists in this warehouse") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Update zone error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update zone",
    });
  }
};

// Update Zone Status
export const updateZoneStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid zone ID",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const zone = await updateZoneStatusService(
      id,
      isActive,
    );

    return res.status(200).json({
      success: true,
      message: "Zone status updated successfully",
      data: zone,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Zone not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update zone status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update zone status",
    });
  }
};