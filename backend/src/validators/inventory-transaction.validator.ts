import { z } from "zod";

// Common Stock Validation
const stockSchema = z.object({
  inventoryId: z
    .number()
    .int("Inventory ID must be an integer")
    .positive("Inventory ID must be positive"),

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than zero"),

  remarks: z
    .string()
    .trim()
    .max(500, "Remarks cannot exceed 500 characters")
    .optional(),
});

// Stock In Validation
export const stockInSchema = stockSchema;

// Stock Out Validation
export const stockOutSchema = stockSchema;

// Stock Adjustment Validation
export const stockAdjustmentSchema = stockSchema;

export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
export type StockAdjustmentInput = z.infer<
  typeof stockAdjustmentSchema
>;