import type { Request, Response } from "express";

import type { CreateOrderInput } from "../domain/order/order.types.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { OrderService } from "../services/order.service.js";
import { createOrderSchema } from "../validators/order.validator.js";

const orderService = new OrderService(
  new OrderRepository(),
);

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const validation = createOrderSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });

    return;
  }

  try {
    const input: CreateOrderInput = {
      customerId: validation.data.customerId,
      shippingAddressLine1: validation.data.shippingAddressLine1,
      shippingCity: validation.data.shippingCity,
      shippingState: validation.data.shippingState,
      shippingPostalCode: validation.data.shippingPostalCode,
      items: validation.data.items,
      ...(validation.data.warehouseId !== undefined
        ? { warehouseId: validation.data.warehouseId }
        : {}),
      ...(validation.data.shippingAddressLine2 !== undefined
        ? { shippingAddressLine2: validation.data.shippingAddressLine2 }
        : {}),
    };

    const order = await orderService.createOrder(input);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

export const getOrders = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const orders = await orderService.getOrders();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid order id",
    });

    return;
  }

  try {
    const order = await orderService.getOrderById(id);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid order id",
    });

    return;
  }

  try {
    const order = await orderService.cancelOrder(id);

    if (!order) {
      res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled. It may not exist or is already beyond the CREATED status.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};
