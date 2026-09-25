import type { Request, Response } from "express";

import { DeliveryRepository } from "../repositories/delivery.repository.js";
import { sendSafeErrorResponse } from "../utils/error-response.js";
import { DeliveryService } from "../services/delivery.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const deliveryService = new DeliveryService(
  new DeliveryRepository(),
);

// Create Delivery
export async function createDelivery(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.createDelivery(
      req.body.orderId,
      req.body.packageId,
    );

    res.status(201).json({
      success: true,
      message: "Delivery created successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to create delivery",
      400,
    );
  }
}

// Get All Deliveries
export async function getDeliveries(
  _req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.getDeliveries();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to get deliveries",
      500,
    );
  }
}

// Get My Assigned Deliveries - Delivery Boy
export async function getMyDeliveries(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result =
      await deliveryService.getDeliveriesByDeliveryBoy(
        req.user.userId,
      );

    return res.status(200).json({
      success: true,
      message: "Assigned deliveries fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get assigned deliveries",
    });
  }
}

// Get Delivery By ID
export async function getDeliveryById(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    const result = await deliveryService.getDeliveryById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendSafeErrorResponse(
      res,
      error,
      "Failed to get delivery",
      400,
    );
  }
}

// Get Delivery Tracking
export async function getDeliveryTracking(
  req: Request,
  res: Response,
) {
  try {
    const deliveryId = Number(req.params.id);

    if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    const result =
      await deliveryService.getTrackingByDeliveryId(
        deliveryId,
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Tracking not found",
    });
  }
}

// Assign Delivery
export async function assignDelivery(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.assign(
      Number(req.params.id),
      req.body.deliveryBoyUserId,
    );

    res.json({
      success: true,
      message: "Delivery assigned successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to assign delivery",
      400,
    );
  }
}

// Pickup Delivery
export async function pickupDelivery(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.pickup(
      Number(req.params.id),
    );

    res.json({
      success: true,
      message: "Delivery picked up successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to pickup delivery",
      400,
    );
  }
}

// Out For Delivery
export async function outForDelivery(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.outForDelivery(
      Number(req.params.id),
    );

    res.json({
      success: true,
      message: "Delivery marked out for delivery successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to update delivery",
      400,
    );
  }
}

// Complete Delivery
export async function deliverDelivery(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.deliver(
      Number(req.params.id),
    );

    res.json({
      success: true,
      message: "Delivery completed successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to complete delivery",
      400,
    );
  }
}

// Fail Delivery
export async function failDelivery(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.fail(
      Number(req.params.id),
      req.body.failureReason ?? req.body.reason,
    );

    res.json({
      success: true,
      message: "Delivery marked as failed",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to mark delivery failed",
      400,
    );
  }
}

// Return Delivery
export async function returnDelivery(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.returnDelivery(
      Number(req.params.id),
      req.body.returnReason ?? req.body.reason,
    );

    res.json({
      success: true,
      message: "Delivery returned successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to return delivery",
      400,
    );
  }
}

// Add Tracking
export async function addTracking(
  req: Request,
  res: Response,
) {
  try {
    const result = await deliveryService.addTracking(
      Number(req.params.id),
      req.body.latitude,
      req.body.longitude,
      req.body.remarks,
    );

    res.status(201).json({
      success: true,
      message: "Delivery tracking added successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(
      res,
      error,
      "Failed to add tracking",
      400,
    );
  }
}