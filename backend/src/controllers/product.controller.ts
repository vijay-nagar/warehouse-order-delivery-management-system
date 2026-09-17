import type { Request, Response } from "express";

import { ProductService } from "../services/product.service.js";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

const productService = new ProductService(
  new ProductRepository(),
);

export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const validation = createProductSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });

    return;
  }

  try {
    const input = {
      name: validation.data.name,
      sku: validation.data.sku,
      price: validation.data.price,
      ...(validation.data.description !== undefined
        ? { description: validation.data.description }
        : {}),
    };

    const product = await productService.createProduct(input);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Product with this SKU already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });

      return;
    }

    throw error;
  }
};

export const getProducts = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const products = await productService.getProducts();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid product id",
    });

    return;
  }

  try {
    const product = await productService.getProductById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid product id",
    });

    return;
  }

  const validation = updateProductSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: validation.error.flatten(),
    });

    return;
  }

  try {
    const input = {
      ...(validation.data.name !== undefined
        ? { name: validation.data.name }
        : {}),
      ...(validation.data.sku !== undefined
        ? { sku: validation.data.sku }
        : {}),
      ...(validation.data.description !== undefined
        ? { description: validation.data.description }
        : {}),
      ...(validation.data.price !== undefined
        ? { price: validation.data.price }
        : {}),
      ...(validation.data.isActive !== undefined
        ? { isActive: validation.data.isActive }
        : {}),
    };

    const product = await productService.updateProduct(id, input);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Product with this SKU already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });

      return;
    }

    throw error;
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid product id",
    });

    return;
  }

  try {
    const deleted = await productService.deleteProduct(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};
