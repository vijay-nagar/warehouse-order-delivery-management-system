import {
  binExists,
  createInventory,
  findInventoryByWarehouseAndProduct,
  getAllInventory,
  getInventoryById,
  productExists,
  updateInventory,
  updateInventoryStatus,
  warehouseExists,
} from "../repositories/inventory.repository.js";

import type {
  CreateInventoryInput,
  UpdateInventoryInput,
} from "../validators/inventory.validator.js";
import type { PaginationRequest } from "../shared/pagination/pagination.types.js";

export const createInventoryService = async (
  input: CreateInventoryInput,
) => {
  const warehouseExistsResult = await warehouseExists(input.warehouseId);

  if (!warehouseExistsResult) {
    throw new Error("Warehouse not found");
  }

  const productExistsResult = await productExists(input.productId);

  if (!productExistsResult) {
    throw new Error("Product not found");
  }

  const binExistsResult = await binExists(input.binId);

  if (!binExistsResult) {
    throw new Error("Bin not found");
  }

  const existingInventory = await findInventoryByWarehouseAndProduct(
    input.warehouseId,
    input.productId,
  );

  if (existingInventory) {
    throw new Error(
      "Inventory already exists for this warehouse and product",
    );
  }

  return createInventory(input);
};

export const getAllInventoryService = async (
  pagination: PaginationRequest,
  filters?: { binId?: number },
) => {
  return getAllInventory(pagination, filters);
};

export const getInventoryByIdService = async (id: number) => {
  const inventory = await getInventoryById(id);

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return inventory;
};

export const updateInventoryService = async (
  id: number,
  input: UpdateInventoryInput,
) => {
  const existingInventory = await getInventoryById(id);

  if (!existingInventory) {
    throw new Error("Inventory not found");
  }

  if (input.binId !== undefined) {
    const binExistsResult = await binExists(input.binId);

    if (!binExistsResult) {
      throw new Error("Bin not found");
    }
  }

  const newAvailableQuantity =
    input.availableQuantity ?? existingInventory.AvailableQuantity;

  const newReservedQuantity =
    input.reservedQuantity ?? existingInventory.ReservedQuantity;

  if (newReservedQuantity > newAvailableQuantity) {
    throw new Error(
      "Reserved quantity cannot be greater than available quantity",
    );
  }

  return updateInventory(id, input);
};

export const updateInventoryStatusService = async (
  id: number,
  isActive: boolean,
) => {
  const existingInventory = await getInventoryById(id);

  if (!existingInventory) {
    throw new Error("Inventory not found");
  }

  return updateInventoryStatus(id, isActive);
};