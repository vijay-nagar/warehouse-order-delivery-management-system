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
  // Status is derived server-side from the delivery's current state
  // (see DeliveryService.addTracking), not client-supplied.
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  remarks: z.string().max(500).optional(),
});
