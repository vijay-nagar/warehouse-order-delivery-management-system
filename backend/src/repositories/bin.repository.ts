import sql from "mssql";

import { getDatabasePool } from "../config/database.js";

import type {
  CreateBinInput,
  UpdateBinInput,
} from "../domain/warehouse/bin.types.js";

// Check whether shelf exists
export const shelfExists = async (
  shelfId: number
): Promise<boolean> => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("ShelfId", sql.Int, shelfId)
    .query(`
      SELECT Id
      FROM Shelves
      WHERE Id = @ShelfId
    `);

  return result.recordset.length > 0;
};

// Find bin by shelf and code
export const findBinByShelfAndCode = async (
  shelfId: number,
  code: string
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("ShelfId", sql.Int, shelfId)
    .input("Code", sql.NVarChar(100), code)
    .query(`
      SELECT *
      FROM Bins
      WHERE ShelfId = @ShelfId
        AND Code = @Code
    `);

  return result.recordset[0] ?? null;
};

// Create bin
export const createBin = async (
  data: CreateBinInput
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("ShelfId", sql.Int, data.shelfId)
    .input("Name", sql.NVarChar(200), data.name)
    .input("Code", sql.NVarChar(100), data.code)
    .query(`
      INSERT INTO Bins (ShelfId, Name, Code)
      OUTPUT INSERTED.*
      VALUES (@ShelfId, @Name, @Code)
    `);

  return result.recordset[0];
};

// Get all bins
export const getAllBins = async () => {
  const pool = await getDatabasePool();

  const result = await pool.request().query(`
    SELECT *
    FROM Bins
    ORDER BY Id DESC
  `);

  return result.recordset;
};

// Get bin by ID
export const getBinById = async (
  id: number
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(`
      SELECT *
      FROM Bins
      WHERE Id = @Id
    `);

  return result.recordset[0] ?? null;
};

// Update bin
export const updateBin = async (
  id: number,
  data: UpdateBinInput
) => {
  const pool = await getDatabasePool();

  const request = pool
    .request()
    .input("Id", sql.Int, id);

  const updates: string[] = [];

  if (data.name !== undefined) {
    request.input("Name", sql.NVarChar(200), data.name);
    updates.push("Name = @Name");
  }

  if (data.code !== undefined) {
    request.input("Code", sql.NVarChar(100), data.code);
    updates.push("Code = @Code");
  }

  updates.push("UpdatedAt = SYSUTCDATETIME()");

  const result = await request.query(`
    UPDATE Bins
    SET ${updates.join(", ")}
    OUTPUT INSERTED.*
    WHERE Id = @Id
  `);

  return result.recordset[0] ?? null;
};

// Update bin status
export const updateBinStatus = async (
  id: number,
  isActive: boolean
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .input("IsActive", sql.Bit, isActive)
    .query(`
      UPDATE Bins
      SET
        IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE Id = @Id
    `);

  return result.recordset[0] ?? null;
};