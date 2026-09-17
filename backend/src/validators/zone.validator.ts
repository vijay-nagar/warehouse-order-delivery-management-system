import { z } from "zod";

export const createZoneSchema = z.object({
  warehouseId: z
    .number()
    .int("Warehouse ID must be an integer")
    .positive("Warehouse ID must be positive"),

  name: z
    .string()
    .trim()
    .min(2, "Zone name must be at least 2 characters")
    .max(200, "Zone name cannot exceed 200 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Zone code must be at least 2 characters")
    .max(100, "Zone code cannot exceed 100 characters"),
});

export const updateZoneSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Zone name must be at least 2 characters")
      .max(200, "Zone name cannot exceed 200 characters")
      .optional(),

    code: z
      .string()
      .trim()
      .min(2, "Zone code must be at least 2 characters")
      .max(100, "Zone code cannot exceed 100 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type CreateZoneInput = z.infer<typeof createZoneSchema>;

export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;