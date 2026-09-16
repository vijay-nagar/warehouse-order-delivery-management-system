import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.number().int().positive(),
  warehouseId: z.number().int().positive().optional(),

  shippingAddressLine1: z.string().trim().min(1).max(500),
  shippingAddressLine2: z.string().trim().max(500).optional(),
  shippingCity: z.string().trim().min(1).max(100),
  shippingState: z.string().trim().min(1).max(100),
  shippingPostalCode: z.string().trim().min(3).max(20),

  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "At least one order item is required"),
});

export const orderIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
