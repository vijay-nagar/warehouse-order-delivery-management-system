import type { Request, Response } from "express";
import { DeliveryRepository } from "../repositories/delivery.repository.js";
import { sendSafeErrorResponse } from "../utils/error-response.js";
import { DeliveryService } from "../services/delivery.service.js";

const deliveryService = new DeliveryService(new DeliveryRepository());

export async function createDelivery(req: Request, res: Response) {
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
    sendSafeErrorResponse(res, error, "Failed to create delivery", 400);
  }
}

export async function getDeliveries(_req: Request, res: Response) {
  try {
    const result = await deliveryService.getDeliveries();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to get deliveries", 500);
  }
}

export async function getDeliveryById(req: Request, res: Response) {
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
    return sendSafeErrorResponse(res, error, "Failed to get delivery", 400);
  }
}

export async function assignDelivery(req: Request, res: Response) {
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
    sendSafeErrorResponse(res, error, "Failed to assign delivery", 400);
  }
}

export async function pickupDelivery(req: Request, res: Response) {
  try {
    const result = await deliveryService.pickup(Number(req.params.id));

    res.json({
      success: true,
      message: "Delivery picked up successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to pickup delivery", 400);
  }
}

export async function outForDelivery(req: Request, res: Response) {
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
    sendSafeErrorResponse(res, error, "Failed to update delivery", 400);
  }
}

export async function deliverDelivery(req: Request, res: Response) {
  try {
    const result = await deliveryService.deliver(Number(req.params.id));

    res.json({
      success: true,
      message: "Delivery completed successfully",
      data: result,
    });
  } catch (error) {
    sendSafeErrorResponse(res, error, "Failed to complete delivery", 400);
  }
}

export async function failDelivery(req: Request, res: Response) {
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
    sendSafeErrorResponse(res, error, "Failed to mark delivery failed", 400);
  }
}

export async function returnDelivery(req: Request, res: Response) {
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
    sendSafeErrorResponse(res, error, "Failed to return delivery", 400);
  }
}

export async function addTracking(req: Request, res: Response) {
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
    sendSafeErrorResponse(res, error, "Failed to add tracking", 400);
  }
}
