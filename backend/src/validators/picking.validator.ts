import { z } from "zod";

export const createPickingTaskSchema = z.object({
  orderId: z.number().int().positive(),

  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        requiredQuantity: z.number().int().positive(),
      }),
    )
    .min(1),

  notes: z.string().max(1000).optional(),
});

export const assignPickingTaskSchema = z.object({
  pickerUserId: z.number().int().positive(),
});

export const completePickingTaskSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export type CreatePickingTaskInput = z.infer<
  typeof createPickingTaskSchema
>;

export type AssignPickingTaskInput = z.infer<
  typeof assignPickingTaskSchema
>;

export type CompletePickingTaskInput = z.infer<
  typeof completePickingTaskSchema
>;


export const updatePickingItemSchema = z.object({
  pickedQuantity: z.number().int().min(0),
  pickedBinId: z.number().int().positive().optional(),
});
