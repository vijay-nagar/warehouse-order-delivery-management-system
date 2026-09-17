import { z } from "zod";

export const createBinSchema = z.object({
  shelfId: z
    .number()
    .int("Shelf ID must be an integer")
    .positive("Shelf ID must be positive"),

  name: z
    .string()
    .trim()
    .min(2, "Bin name must be at least 2 characters")
    .max(200, "Bin name cannot exceed 200 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Bin code must be at least 2 characters")
    .max(100, "Bin code cannot exceed 100 characters"),
});

export const updateBinSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Bin name must be at least 2 characters")
      .max(200, "Bin name cannot exceed 200 characters")
      .optional(),

    code: z
      .string()
      .trim()
      .min(2, "Bin code must be at least 2 characters")
      .max(100, "Bin code cannot exceed 100 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type CreateBinInput = z.infer<typeof createBinSchema>;
export type UpdateBinInput = z.infer<typeof updateBinSchema>;