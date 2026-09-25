import sql from "mssql";
import { getDatabasePool } from "../config/database.js";
import {
  getPaginationOffset,
  getTotalPages,
} from "../shared/pagination/pagination.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "../validators/warehouse.validator.js";

export const findWarehouseByCode = async (code: string) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Code", sql.VarChar, code)
    .query(`
      SELECT
        Id,
        Name,
        Code,
        AddressLine1,
        AddressLine2,
        City,
        State,
        PostalCode,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Warehouses
      WHERE Code = @Code;
    `);

  return result.recordset[0] ?? null;
};

export const createWarehouse = async (
  input: CreateWarehouseInput,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Name", sql.VarChar, input.name)
    .input("Code", sql.VarChar, input.code)
    .input("AddressLine1", sql.VarChar, input.addressLine1)
    .input("AddressLine2", sql.VarChar, input.addressLine2 ?? null)
    .input("City", sql.VarChar, input.city)
    .input("State", sql.VarChar, input.state)
    .input("PostalCode", sql.VarChar, input.postalCode)
    .query(`
      INSERT INTO Warehouses (
        Name,
        Code,
        AddressLine1,
        AddressLine2,
        City,
        State,
        PostalCode,
        IsActive,
        CreatedAt
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.Name,
        INSERTED.Code,
        INSERTED.AddressLine1,
        INSERTED.AddressLine2,
        INSERTED.City,
        INSERTED.State,
        INSERTED.PostalCode,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      VALUES (
        @Name,
        @Code,
        @AddressLine1,
        @AddressLine2,
        @City,
        @State,
        @PostalCode,
        1,
        SYSUTCDATETIME()
      );
    `);

  return result.recordset[0];
};

export const getAllWarehouses = async (
  pagination: PaginationRequest,
  search?: string,
): Promise<PaginationResult<Record<string, unknown>>> => {
  const pool = await getDatabasePool();
  const offset = getPaginationOffset(pagination.page, pagination.pageSize);

  const searchClause = search ? "WHERE Name LIKE @Search OR Code LIKE @Search" : "";

  const countRequest = pool.request();
  if (search) countRequest.input("Search", sql.NVarChar(250), `%${search}%`);

  const countResult = await countRequest.query(`
    SELECT COUNT(*) AS TotalCount FROM Warehouses ${searchClause};
  `);

  const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);

  const listRequest = pool
    .request()
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pagination.pageSize);
  if (search) listRequest.input("Search", sql.NVarChar(250), `%${search}%`);

  const result = await listRequest.query(`
    SELECT
      Id,
      Name,
      Code,
      AddressLine1,
      AddressLine2,
      City,
      State,
      PostalCode,
      IsActive,
      CreatedAt,
      UpdatedAt
    FROM Warehouses
    ${searchClause}
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

export const getWarehouseById = async (id: number) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(`
      SELECT
        Id,
        Name,
        Code,
        AddressLine1,
        AddressLine2,
        City,
        State,
        PostalCode,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Warehouses
      WHERE Id = @Id;
    `);

  return result.recordset[0] ?? null;
};

export const updateWarehouse = async (
  id: number,
  input: UpdateWarehouseInput,
) => {
  const pool = await getDatabasePool();

  const request = pool.request().input("Id", sql.Int, id);

  const updates: string[] = [];

  if (input.name !== undefined) {
    request.input("Name", sql.VarChar, input.name);
    updates.push("Name = @Name");
  }

  if (input.code !== undefined) {
    request.input("Code", sql.VarChar, input.code);
    updates.push("Code = @Code");
  }

  if (input.addressLine1 !== undefined) {
    request.input("AddressLine1", sql.VarChar, input.addressLine1);
    updates.push("AddressLine1 = @AddressLine1");
  }

  if (input.addressLine2 !== undefined) {
    request.input("AddressLine2", sql.VarChar, input.addressLine2);
    updates.push("AddressLine2 = @AddressLine2");
  }

  if (input.city !== undefined) {
    request.input("City", sql.VarChar, input.city);
    updates.push("City = @City");
  }

  if (input.state !== undefined) {
    request.input("State", sql.VarChar, input.state);
    updates.push("State = @State");
  }

  if (input.postalCode !== undefined) {
    request.input("PostalCode", sql.VarChar, input.postalCode);
    updates.push("PostalCode = @PostalCode");
  }

  if (updates.length === 0) {
    return getWarehouseById(id);
  }

  const result = await request.query(`
    UPDATE Warehouses
    SET
      ${updates.join(", ")},
      UpdatedAt = SYSUTCDATETIME()
    OUTPUT
      INSERTED.Id,
      INSERTED.Name,
      INSERTED.Code,
      INSERTED.AddressLine1,
      INSERTED.AddressLine2,
      INSERTED.City,
      INSERTED.State,
      INSERTED.PostalCode,
      INSERTED.IsActive,
      INSERTED.CreatedAt,
      INSERTED.UpdatedAt
    WHERE Id = @Id;
  `);

  return result.recordset[0] ?? null;
};

export const updateWarehouseStatus = async (
  id: number,
  isActive: boolean,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .input("IsActive", sql.Bit, isActive)
    .query(`
      UPDATE Warehouses
      SET
        IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.Name,
        INSERTED.Code,
        INSERTED.AddressLine1,
        INSERTED.AddressLine2,
        INSERTED.City,
        INSERTED.State,
        INSERTED.PostalCode,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id;
    `);

  return result.recordset[0] ?? null;
};