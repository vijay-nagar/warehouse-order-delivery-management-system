import { z } from "zod";

export const createDeliverySchema = z.object({
  orderId: z.number().int().positive(),
  packageId: z.number().int().positive(),
});

export const assignDeliverySchema = z.object({
  deliveryBoyUserId: z.number().int().positive(),
});

export const failureSchema = z.object({
  failureReason: z.string().min(1).max(1000),
});

export const returnSchema = z.object({
  returnReason: z.string().min(1).max(1000),
});

export const trackingSchema = z.object({
  status: z.enum(["PICKED_UP", "OUT_FOR_DELIVERY"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  remarks: z.string().max(500).optional(),
});
