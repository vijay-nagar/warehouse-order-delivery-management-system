import { z } from "zod";

// Create Inventory Validation
export const createInventorySchema = z
  .object({
    warehouseId: z
      .number()
      .int("Warehouse ID must be an integer")
      .positive("Warehouse ID must be positive"),

    productId: z
      .number()
      .int("Product ID must be an integer")
      .positive("Product ID must be positive"),

    availableQuantity: z
      .number()
      .int("Available quantity must be an integer")
      .min(0, "Available quantity cannot be negative"),

    reservedQuantity: z
      .number()
      .int("Reserved quantity must be an integer")
      .min(0, "Reserved quantity cannot be negative"),

    reorderLevel: z
      .number()
      .int("Reorder level must be an integer")
      .min(0, "Reorder level cannot be negative"),
  })
  .refine(
    (data) => data.reservedQuantity <= data.availableQuantity,
    {
      message:
        "Reserved quantity cannot be greater than available quantity",
      path: ["reservedQuantity"],
    },
  );

// Update Inventory Validation
export const updateInventorySchema = z
  .object({
    availableQuantity: z
      .number()
      .int("Available quantity must be an integer")
      .min(0, "Available quantity cannot be negative")
      .optional(),

    reservedQuantity: z
      .number()
      .int("Reserved quantity must be an integer")
      .min(0, "Reserved quantity cannot be negative")
      .optional(),

    reorderLevel: z
      .number()
      .int("Reorder level must be an integer")
      .min(0, "Reorder level cannot be negative")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required for update",
    },
  );

// Type Definitions
export type CreateInventoryInput = z.infer<
  typeof createInventorySchema
>;

export type UpdateInventoryInput = z.infer<
  typeof updateInventorySchema
>;