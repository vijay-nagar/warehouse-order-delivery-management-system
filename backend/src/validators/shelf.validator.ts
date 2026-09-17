import { z } from "zod";

export const createShelfSchema = z.object({
  zoneId: z
    .number()
    .int("Zone ID must be an integer")
    .positive("Zone ID must be positive"),

  name: z
    .string()
    .trim()
    .min(2, "Shelf name must be at least 2 characters")
    .max(200, "Shelf name cannot exceed 200 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Shelf code must be at least 2 characters")
    .max(100, "Shelf code cannot exceed 100 characters"),
});

export const updateShelfSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Shelf name must be at least 2 characters")
      .max(200, "Shelf name cannot exceed 200 characters")
      .optional(),

    code: z
      .string()
      .trim()
      .min(2, "Shelf code must be at least 2 characters")
      .max(100, "Shelf code cannot exceed 100 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type CreateShelfInput = z.infer<typeof createShelfSchema>;
export type UpdateShelfInput = z.infer<typeof updateShelfSchema>;