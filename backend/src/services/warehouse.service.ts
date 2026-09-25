import {
  createWarehouse,
  findWarehouseByCode,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  updateWarehouseStatus,
} from "../repositories/warehouse.repository.js";

import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "../validators/warehouse.validator.js";
import type { PaginationRequest } from "../shared/pagination/pagination.types.js";

export const createWarehouseService = async (
  input: CreateWarehouseInput,
) => {
  const existingWarehouse = await findWarehouseByCode(input.code);

  if (existingWarehouse) {
    throw new Error("Warehouse code already exists");
  }

  return createWarehouse(input);
};

export const getAllWarehousesService = async (
  pagination: PaginationRequest,
  search?: string,
) => {
  return getAllWarehouses(pagination, search);
};

export const getWarehouseByIdService = async (id: number) => {
  const warehouse = await getWarehouseById(id);

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  return warehouse;
};

export const updateWarehouseService = async (
  id: number,
  input: UpdateWarehouseInput,
) => {
  const existingWarehouse = await getWarehouseById(id);

  if (!existingWarehouse) {
    throw new Error("Warehouse not found");
  }

  if (
    input.code !== undefined &&
    input.code !== existingWarehouse.Code
  ) {
    const warehouseWithSameCode = await findWarehouseByCode(input.code);

    if (
      warehouseWithSameCode &&
      warehouseWithSameCode.Id !== id
    ) {
      throw new Error("Warehouse code already exists");
    }
  }

  return updateWarehouse(id, input);
};

export const updateWarehouseStatusService = async (
  id: number,
  isActive: boolean,
) => {
  const existingWarehouse = await getWarehouseById(id);

  if (!existingWarehouse) {
    throw new Error("Warehouse not found");
  }

  return updateWarehouseStatus(id, isActive);
};  