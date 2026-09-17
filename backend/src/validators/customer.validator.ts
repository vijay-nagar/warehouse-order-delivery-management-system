import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Customer name is required"),

  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional(),

  addressLine1: z
    .string()
    .trim()
    .min(1, "Address line 1 is required"),

  addressLine2: z
    .string()
    .trim()
    .optional(),

  city: z
    .string()
    .trim()
    .min(1, "City is required"),

  state: z
    .string()
    .trim()
    .min(1, "State is required"),

  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required"),
});

export const updateCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .optional(),

  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional(),

  addressLine1: z
    .string()
    .trim()
    .min(1, "Address line 1 is required")
    .optional(),

  addressLine2: z
    .string()
    .trim()
    .optional(),

  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .optional(),

  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .optional(),

  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});
