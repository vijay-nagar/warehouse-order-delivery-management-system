import { z } from "zod";

export const createInventorySchema = z.object({
  warehouseId: z.number().int().positive("Warehouse ID must be positive"),
  productId: z.number().int().positive("Product ID must be positive"),
  availableQuantity: z.number().int().min(0, "Available quantity cannot be negative"),
  reservedQuantity: z.number().int().min(0, "Reserved quantity cannot be negative"),
  reorderLevel: z.number().int().min(0, "Reorder level cannot be negative"),
});

export const updateInventorySchema = z.object({
  availableQuantity: z.number().int().min(0).optional(),
  reservedQuantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;