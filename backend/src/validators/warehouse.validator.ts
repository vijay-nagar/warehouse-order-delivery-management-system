import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1, "Warehouse name is required"),
  code: z.string().trim().min(1, "Warehouse code is required"),
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Postal code must be 6 digits"),
});

export const updateWarehouseSchema = z.object({
  name: z.string().trim().min(1, "Warehouse name is required").optional(),
  code: z.string().trim().min(1, "Warehouse code is required").optional(),
  addressLine1: z.string().trim().min(1, "Address is required").optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required").optional(),
  state: z.string().trim().min(1, "State is required").optional(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Postal code must be 6 digits")
    .optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;