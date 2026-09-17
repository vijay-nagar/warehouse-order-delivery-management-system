import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive number"),

  type: z.enum([
    "INFO",
    "ORDER",
    "INVENTORY",
    "DELIVERY",
    "SYSTEM",
  ]),

  title: z
    .string()
    .trim()
    .min(1, "Notification title is required")
    .max(200, "Notification title must not exceed 200 characters"),

  message: z
    .string()
    .trim()
    .min(1, "Notification message is required")
    .max(1000, "Notification message must not exceed 1000 characters"),
});
