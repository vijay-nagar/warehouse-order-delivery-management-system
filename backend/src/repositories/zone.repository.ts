import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import {
  getPaginationOffset,
  getTotalPages,
} from "../shared/pagination/pagination.js";

import type {
  CreateZoneInput,
  UpdateZoneInput,
} from "../validators/zone.validator.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

// Find Zone by Warehouse and Code
export const findZoneByWarehouseAndCode = async (
  warehouseId: number,
  code: string,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("WarehouseId", sql.Int, warehouseId)
    .input("Code", sql.NVarChar(100), code)
    .query(`
      SELECT
        Id,
        WarehouseId,
        Name,
        Code,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Zones
      WHERE WarehouseId = @WarehouseId
        AND Code = @Code;
    `);

  return result.recordset[0] ?? null;
};

// Check Warehouse Exists
export const warehouseExists = async (warehouseId: number) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, warehouseId)
    .query(`
      SELECT Id
      FROM Warehouses
      WHERE Id = @Id;
    `);

  return result.recordset.length > 0;
};

// Create Zone
export const createZone = async (
  input: CreateZoneInput,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("WarehouseId", sql.Int, input.warehouseId)
    .input("Name", sql.NVarChar(200), input.name)
    .input("Code", sql.NVarChar(100), input.code)
    .query(`
      INSERT INTO Zones (
        WarehouseId,
        Name,
        Code,
        IsActive
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.WarehouseId,
        INSERTED.Name,
        INSERTED.Code,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      VALUES (
        @WarehouseId,
        @Name,
        @Code,
        1
      );
    `);

  return result.recordset[0];
};

// Get All Zones
export const getAllZones = async (
  pagination: PaginationRequest,
  filters?: { warehouseId?: number },
): Promise<PaginationResult<Record<string, unknown>>> => {
  const pool = await getDatabasePool();
  const offset = getPaginationOffset(pagination.page, pagination.pageSize);

  const whereClause = filters?.warehouseId !== undefined ? "WHERE WarehouseId = @WarehouseId" : "";

  const countRequest = pool.request();
  if (filters?.warehouseId !== undefined) {
    countRequest.input("WarehouseId", sql.Int, filters.warehouseId);
  }

  const countResult = await countRequest.query(`
    SELECT COUNT(*) AS TotalCount FROM Zones ${whereClause};
  `);

  const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);

  const listRequest = pool
    .request()
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pagination.pageSize);
  if (filters?.warehouseId !== undefined) {
    listRequest.input("WarehouseId", sql.Int, filters.warehouseId);
  }

  const result = await listRequest.query(`
    SELECT
      Id,
      WarehouseId,
      Name,
      Code,
      IsActive,
      CreatedAt,
      UpdatedAt
    FROM Zones
    ${whereClause}
    ORDER BY Id DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
  `);

  return {
    items: result.recordset,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalCount,
    totalPages,
  };
};

// Get Zone by ID
export const getZoneById = async (id: number) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(`
      SELECT
        Id,
        WarehouseId,
        Name,
        Code,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Zones
      WHERE Id = @Id;
    `);

  return result.recordset[0] ?? null;
};

// Update Zone
export const updateZone = async (
  id: number,
  input: UpdateZoneInput,
) => {
  const pool = await getDatabasePool();

  const request = pool.request().input("Id", sql.Int, id);

  const updates: string[] = [];

  if (input.name !== undefined) {
    request.input("Name", sql.NVarChar(200), input.name);
    updates.push("Name = @Name");
  }

  if (input.code !== undefined) {
    request.input("Code", sql.NVarChar(100), input.code);
    updates.push("Code = @Code");
  }

  if (updates.length === 0) {
    return getZoneById(id);
  }

  const result = await request.query(`
    UPDATE Zones
    SET
      ${updates.join(", ")},
      UpdatedAt = SYSUTCDATETIME()
    OUTPUT
      INSERTED.Id,
      INSERTED.WarehouseId,
      INSERTED.Name,
      INSERTED.Code,
      INSERTED.IsActive,
      INSERTED.CreatedAt,
      INSERTED.UpdatedAt
    WHERE Id = @Id;
  `);

  return result.recordset[0] ?? null;
};

// Update Zone Status
export const updateZoneStatus = async (
  id: number,
  isActive: boolean,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .input("IsActive", sql.Bit, isActive)
    .query(`
      UPDATE Zones
      SET
        IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.WarehouseId,
        INSERTED.Name,
        INSERTED.Code,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id;
    `);

  return result.recordset[0] ?? null;
};