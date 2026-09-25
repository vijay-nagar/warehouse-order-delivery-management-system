import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { CreateOrderInput } from "../domain/order/order.types.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { OrderService } from "../services/order.service.js";
import { createOrderSchema } from "../validators/order.validator.js";
import { redisService } from "../infrastructure/redis/redis.service.js";
import { parsePagination } from "../shared/pagination/pagination.js";

const orderService = new OrderService(
  new OrderRepository(),
);

const IDEMPOTENCY_TTL_SECONDS = 86400;

export const createOrder = async (
  req: AuthenticatedRequest,
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

  const idempotencyKey = req.header("Idempotency-Key");
  const idempotencyRedisKey = idempotencyKey
    ? `order:idem:${idempotencyKey}`
    : null;

  try {
    if (idempotencyRedisKey) {
      const claimed = await redisService.setIfNotExists(
        idempotencyRedisKey,
        "PENDING",
        IDEMPOTENCY_TTL_SECONDS,
      );

      if (!claimed) {
        const existing = await redisService.get(idempotencyRedisKey);
        const existingOrderId = existing ? Number(existing) : NaN;

        if (Number.isInteger(existingOrderId)) {
          const existingOrder = await orderService.getOrderById(existingOrderId);

          if (existingOrder) {
            res.status(200).json({
              success: true,
              message: "Order already created for this idempotency key",
              data: existingOrder,
            });

            return;
          }
        }

        res.status(409).json({
          success: false,
          message: "A request with this idempotency key is already in progress",
        });

        return;
      }
    }

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

    const order = await orderService.createOrder(
      input,
      req.user?.userId ?? null,
    );

    if (idempotencyRedisKey) {
      await redisService.set(
        idempotencyRedisKey,
        String(order.id),
        IDEMPOTENCY_TTL_SECONDS,
      );
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    if (idempotencyRedisKey) {
      await redisService.delete(idempotencyRedisKey).catch(() => {
        // Best-effort cleanup so the key can be retried.
      });
    }

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
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );

    const orders = await orderService.getOrders(pagination);

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
  req: AuthenticatedRequest,
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
  req: AuthenticatedRequest,
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
    const order = await orderService.cancelOrder(id, req.user?.userId ?? null);

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
