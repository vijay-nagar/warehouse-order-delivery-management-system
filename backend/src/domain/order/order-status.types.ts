export const ORDER_STATUSES = [
  "CREATED",
  "STOCK_RESERVED",
  "PICKING",
  "PICKED",
  "PACKING",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "OUT_OF_STOCK",
  "CANCELLED",
  "FAILED",
  "RETURNED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
