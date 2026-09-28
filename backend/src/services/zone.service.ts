import {
  createZone,
  findZoneByWarehouseAndCode,
  getAllZones,
  getZoneById,
  updateZone,
  updateZoneStatus,
  warehouseExists,
} from "../repositories/zone.repository.js";

import type {
  CreateZoneInput,
  UpdateZoneInput,
} from "../validators/zone.validator.js";
import type { PaginationRequest } from "../shared/pagination/pagination.types.js";

// Create Zone
export const createZoneService = async (
  input: CreateZoneInput,
) => {
  const warehouseExistsResult = await warehouseExists(
    input.warehouseId,
  );

  if (!warehouseExistsResult) {
    throw new Error("Warehouse not found");
  }

  const existingZone = await findZoneByWarehouseAndCode(
    input.warehouseId,
    input.code,
  );

  if (existingZone) {
    throw new Error(
      "Zone already exists in this warehouse",
    );
  }

  return createZone(input);
};

// Get All Zones
export const getAllZonesService = async (
  pagination: PaginationRequest,
  filters?: { warehouseId?: number; search?: string },
) => {
  return getAllZones(pagination, filters);
};

// Get Zone by ID
export const getZoneByIdService = async (id: number) => {
  const zone = await getZoneById(id);

  if (!zone) {
    throw new Error("Zone not found");
  }

  return zone;
};

// Update Zone
export const updateZoneService = async (
  id: number,
  input: UpdateZoneInput,
) => {
  const existingZone = await getZoneById(id);

  if (!existingZone) {
    throw new Error("Zone not found");
  }

  if (input.code !== undefined) {
    const existingZoneWithCode =
      await findZoneByWarehouseAndCode(
        existingZone.WarehouseId,
        input.code,
      );

    if (
      existingZoneWithCode &&
      existingZoneWithCode.Id !== id
    ) {
      throw new Error(
        "Zone code already exists in this warehouse",
      );
    }
  }

  return updateZone(id, input);
};

// Update Zone Status
export const updateZoneStatusService = async (
  id: number,
  isActive: boolean,
) => {
  const existingZone = await getZoneById(id);

  if (!existingZone) {
    throw new Error("Zone not found");
  }

  return updateZoneStatus(id, isActive);
};