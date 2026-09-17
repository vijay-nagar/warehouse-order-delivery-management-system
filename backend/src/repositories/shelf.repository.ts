import sql from "mssql";

import { getDatabasePool } from "../config/database.js";

import type {
  CreateShelfInput,
  UpdateShelfInput,
} from "../domain/warehouse/shelf.types.js";

// Check whether zone exists
export const zoneExists = async (
  zoneId: number
): Promise<boolean> => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("ZoneId", sql.Int, zoneId)
    .query(`
      SELECT Id
      FROM Zones
      WHERE Id = @ZoneId
    `);

  return result.recordset.length > 0;
};

// Find shelf by zone and code
export const findShelfByZoneAndCode = async (
  zoneId: number,
  code: string
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("ZoneId", sql.Int, zoneId)
    .input("Code", sql.NVarChar(100), code)
    .query(`
      SELECT *
      FROM Shelves
      WHERE ZoneId = @ZoneId
        AND Code = @Code
    `);

  return result.recordset[0] ?? null;
};

// Create shelf
export const createShelf = async (
  data: CreateShelfInput
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("ZoneId", sql.Int, data.zoneId)
    .input("Name", sql.NVarChar(200), data.name)
    .input("Code", sql.NVarChar(100), data.code)
    .query(`
      INSERT INTO Shelves (ZoneId, Name, Code)
      OUTPUT INSERTED.*
      VALUES (@ZoneId, @Name, @Code)
    `);

  return result.recordset[0];
};

// Get all shelves
export const getAllShelves = async () => {
  const pool = await getDatabasePool();

  const result = await pool.request().query(`
    SELECT *
    FROM Shelves
    ORDER BY Id DESC
  `);

  return result.recordset;
};

// Get shelf by ID
export const getShelfById = async (
  id: number
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(`
      SELECT *
      FROM Shelves
      WHERE Id = @Id
    `);

  return result.recordset[0] ?? null;
};

// Update shelf
export const updateShelf = async (
  id: number,
  data: UpdateShelfInput
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
    UPDATE Shelves
    SET ${updates.join(", ")}
    OUTPUT INSERTED.*
    WHERE Id = @Id
  `);

  return result.recordset[0] ?? null;
};

// Update shelf status
export const updateShelfStatus = async (
  id: number,
  isActive: boolean
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .input("IsActive", sql.Bit, isActive)
    .query(`
      UPDATE Shelves
      SET
        IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE Id = @Id
    `);

  return result.recordset[0] ?? null;
};