import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required"),

  sku: z
    .string()
    .trim()
    .min(1, "SKU is required"),

  description: z
    .string()
    .trim()
    .optional(),

  price: z
    .number()
    .positive("Price must be greater than 0"),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .optional(),

  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .optional(),

  description: z
    .string()
    .trim()
    .optional(),

  price: z
    .number()
    .positive("Price must be greater than 0")
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});
