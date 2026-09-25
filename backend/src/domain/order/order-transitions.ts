import { HttpError } from "../../utils/http-error.js";

import type { OrderStatus } from "./order-status.types.js";

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  CREATED: ["STOCK_RESERVED", "OUT_OF_STOCK", "CANCELLED"],
  STOCK_RESERVED: ["PICKING"],
  PICKING: ["PICKED"],
  PICKED: ["PACKING"],
  PACKING: ["PACKED"],
  PACKED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  // Not a dead end: staff can manually retry reservation (e.g. after
  // restocking) via POST /api/inventory-reservation/:orderId.
  OUT_OF_STOCK: ["STOCK_RESERVED"],
  CANCELLED: [],
  FAILED: ["RETURNED"],
  RETURNED: [],
};

export const isValidTransition = (
  from: OrderStatus,
  to: OrderStatus,
): boolean => ORDER_TRANSITIONS[from]?.includes(to) ?? false;

export const assertValidTransition = (
  from: OrderStatus,
  to: OrderStatus,
): void => {
  if (!isValidTransition(from, to)) {
    throw new HttpError(409, `Illegal order status transition: ${from} -> ${to}`);
  }
};
