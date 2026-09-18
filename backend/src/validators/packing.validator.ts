import { z } from "zod";

export const createPackingTaskSchema = z.object({
  orderId: z.number().int().positive(),
  pickingTaskId: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
});

export const assignPackingTaskSchema = z.object({
  packerUserId: z.number().int().positive(),
});

export const completePackingTaskSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const createPackageSchema = z.object({
  weight: z.number().positive().optional(),
});
