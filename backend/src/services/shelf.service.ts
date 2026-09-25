import {
  zoneExists,
  findShelfByZoneAndCode,
  createShelf,
  getAllShelves,
  getShelfById,
  updateShelf,
  updateShelfStatus,
} from "../repositories/shelf.repository.js";

import type {
  CreateShelfInput,
  UpdateShelfInput,
} from "../domain/warehouse/shelf.types.js";
import type { PaginationRequest } from "../shared/pagination/pagination.types.js";

export const createShelfService = async (
  data: CreateShelfInput
) => {
  const zoneFound = await zoneExists(data.zoneId);

  if (!zoneFound) {
    throw new Error("Zone not found");
  }

  const existingShelf = await findShelfByZoneAndCode(
    data.zoneId,
    data.code
  );

  if (existingShelf) {
    throw new Error("Shelf already exists in this zone");
  }

  return createShelf(data);
};

export const getAllShelvesService = async (
  pagination: PaginationRequest,
  filters?: { zoneId?: number },
) => {
  return getAllShelves(pagination, filters);
};

export const getShelfByIdService = async (
  id: number
) => {
  return getShelfById(id);
};

export const updateShelfService = async (
  id: number,
  data: UpdateShelfInput
) => {
  const existingShelf = await getShelfById(id);

  if (!existingShelf) {
    throw new Error("Shelf not found");
  }

  if (data.code !== undefined) {
    const duplicateShelf = await findShelfByZoneAndCode(
      existingShelf.ZoneId,
      data.code
    );

    if (
      duplicateShelf &&
      duplicateShelf.Id !== id
    ) {
      throw new Error("Shelf already exists in this zone");
    }
  }

  return updateShelf(id, data);
};

export const updateShelfStatusService = async (
  id: number,
  isActive: boolean
) => {
  const existingShelf = await getShelfById(id);

  if (!existingShelf) {
    throw new Error("Shelf not found");
  }

  return updateShelfStatus(id, isActive);
};