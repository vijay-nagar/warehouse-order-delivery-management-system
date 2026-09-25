import type { Request, Response } from "express";

import { CustomerRepository } from "../repositories/customer.repository.js";
import { CustomerService } from "../services/customer.service.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/customer.validator.js";
import { parsePagination, toPaginationMeta } from "../shared/pagination/pagination.js";

const customerService = new CustomerService(
  new CustomerRepository(),
);

export const createCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const validation = createCustomerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const input = {
      name: validation.data.name,
      phone: validation.data.phone,
      ...(validation.data.email !== undefined
        ? { email: validation.data.email }
        : {}),
      addressLine1: validation.data.addressLine1,
      ...(validation.data.addressLine2 !== undefined
        ? { addressLine2: validation.data.addressLine2 }
        : {}),
      city: validation.data.city,
      state: validation.data.state,
      postalCode: validation.data.postalCode,
    };

    const customer =
      await customerService.createCustomer(input);

    res.status(201).json(customer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create customer";

    if (
      message ===
      "Customer with this phone already exists"
    ) {
      res.status(409).json({ message });
      return;
    }

    res.status(500).json({
      message: "Failed to create customer",
    });
  }
};

export const getCustomers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const pagination = parsePagination(
      req.query.page as string | undefined,
      req.query.pageSize as string | undefined,
    );
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const customers = await customerService.getCustomers(pagination, search);

    res.status(200).json({
      success: true,
      data: customers.items,
      pagination: toPaginationMeta(customers),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      message: "Invalid customer ID",
    });
    return;
  }

  try {
    const customer =
      await customerService.getCustomerById(id);

    if (!customer) {
      res.status(404).json({
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json(customer);
  } catch {
    res.status(500).json({
      message: "Failed to fetch customer",
    });
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      message: "Invalid customer ID",
    });
    return;
  }

  const validation = updateCustomerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const input = {
      ...(validation.data.name !== undefined
        ? { name: validation.data.name }
        : {}),
      ...(validation.data.phone !== undefined
        ? { phone: validation.data.phone }
        : {}),
      ...(validation.data.email !== undefined
        ? { email: validation.data.email }
        : {}),
      ...(validation.data.addressLine1 !== undefined
        ? { addressLine1: validation.data.addressLine1 }
        : {}),
      ...(validation.data.addressLine2 !== undefined
        ? { addressLine2: validation.data.addressLine2 }
        : {}),
      ...(validation.data.city !== undefined
        ? { city: validation.data.city }
        : {}),
      ...(validation.data.state !== undefined
        ? { state: validation.data.state }
        : {}),
      ...(validation.data.postalCode !== undefined
        ? { postalCode: validation.data.postalCode }
        : {}),
      ...(validation.data.isActive !== undefined
        ? { isActive: validation.data.isActive }
        : {}),
    };

    const customer =
      await customerService.updateCustomer(id, input);

    if (!customer) {
      res.status(404).json({
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json(customer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update customer";

    if (
      message ===
      "Customer with this phone already exists"
    ) {
      res.status(409).json({ message });
      return;
    }

    res.status(500).json({
      message: "Failed to update customer",
    });
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      message: "Invalid customer ID",
    });
    return;
  }

  try {
    const deleted =
      await customerService.deleteCustomer(id);

    if (!deleted) {
      res.status(404).json({
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch {
    res.status(500).json({
      message: "Failed to delete customer",
    });
  }
};
