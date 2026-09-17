import {
  shelfExists,
  findBinByShelfAndCode,
  createBin,
  getAllBins,
  getBinById,
  updateBin,
  updateBinStatus,
} from "../repositories/bin.repository.js";

import type {
  CreateBinInput,
  UpdateBinInput,
} from "../domain/warehouse/bin.types.js";

export const createBinService = async (
  data: CreateBinInput
) => {
  const shelfFound = await shelfExists(data.shelfId);

  if (!shelfFound) {
    throw new Error("Shelf not found");
  }

  const existingBin = await findBinByShelfAndCode(
    data.shelfId,
    data.code
  );

  if (existingBin) {
    throw new Error("Bin already exists on this shelf");
  }

  return createBin(data);
};

export const getAllBinsService = async () => {
  return getAllBins();
};

export const getBinByIdService = async (id: number) => {
  return getBinById(id);
};

export const updateBinService = async (
  id: number,
  data: UpdateBinInput
) => {
  const existingBin = await getBinById(id);

  if (!existingBin) {
    throw new Error("Bin not found");
  }

  if (data.code !== undefined) {
    const duplicateBin = await findBinByShelfAndCode(
      existingBin.ShelfId,
      data.code
    );

    if (duplicateBin && duplicateBin.Id !== id) {
      throw new Error("Bin already exists on this shelf");
    }
  }

  return updateBin(id, data);
};

export const updateBinStatusService = async (
  id: number,
  isActive: boolean
) => {
  const existingBin = await getBinById(id);

  if (!existingBin) {
    throw new Error("Bin not found");
  }

  return updateBinStatus(id, isActive);
};