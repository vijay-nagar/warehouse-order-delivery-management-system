import { HttpError } from "../../utils/http-error.js";

import type { OrderStatus } from "./order-status.types.js";

// Assumption: cancellation is only modeled from CREATED. Once stock is
// reserved (or picking/packing/delivery has started) there is no cancel
// transition in this table by design — cancelOrderWithReservationRelease
// (inventory-reservation.repository.ts) reads the order's real current
// status and relies on assertValidTransition to reject a cancel attempt
// past CREATED with a clear 409, rather than silently no-op'ing.
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
