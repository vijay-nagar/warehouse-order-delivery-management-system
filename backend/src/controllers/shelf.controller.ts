import type { Request, Response } from "express";

import {
  createShelfService,
  getAllShelvesService,
  getShelfByIdService,
  updateShelfService,
  updateShelfStatusService,
} from "../services/shelf.service.js";

import {
  createShelfSchema,
  updateShelfSchema,
} from "../validators/shelf.validator.js";

// Create Shelf
export const createShelf = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createShelfSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const shelf = await createShelfService(validation.data);

    return res.status(201).json({
      success: true,
      message: "Shelf created successfully",
      data: shelf,
    });
  } catch (error: any) {
    if (error.message === "Zone not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Shelf already exists in this zone") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create shelf error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Shelves
export const getAllShelves = async (
  _req: Request,
  res: Response
) => {
  try {
    const shelves = await getAllShelvesService();

    return res.status(200).json({
      success: true,
      data: shelves,
    });
  } catch (error) {
    console.error("Get all shelves error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Shelf By ID
export const getShelfById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid shelf ID",
      });
    }

    const shelf = await getShelfByIdService(id);

    if (!shelf) {
      return res.status(404).json({
        success: false,
        message: "Shelf not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: shelf,
    });
  } catch (error) {
    console.error("Get shelf by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Shelf
export const updateShelf = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid shelf ID",
      });
    }

    const validation = updateShelfSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const shelf = await updateShelfService(
      id,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Shelf updated successfully",
      data: shelf,
    });
  } catch (error: any) {
    if (error.message === "Shelf not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Shelf already exists in this zone") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update shelf error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Shelf Status
export const updateShelfStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid shelf ID",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const shelf = await updateShelfStatusService(
      id,
      isActive
    );

    return res.status(200).json({
      success: true,
      message: "Shelf status updated successfully",
      data: shelf,
    });
  } catch (error: any) {
    if (error.message === "Shelf not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update shelf status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};