import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import type {
  CreateInventoryInput,
  UpdateInventoryInput,
} from "../validators/inventory.validator.js";
export const findInventoryByWarehouseAndProduct = async (
  warehouseId: number,
  productId: number,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("WarehouseId", sql.Int, warehouseId)
    .input("ProductId", sql.Int, productId)
    .query(`
      SELECT
        Id,
        WarehouseId,
        ProductId,
        AvailableQuantity,
        ReservedQuantity,
        ReorderLevel,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Inventory
      WHERE WarehouseId = @WarehouseId
        AND ProductId = @ProductId;
    `);

  return result.recordset[0] ?? null;
};

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

export const productExists = async (productId: number) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, productId)
    .query(`
      SELECT Id
      FROM Products
      WHERE Id = @Id;
    `);

  return result.recordset.length > 0;
};

export const createInventory = async (
  input: CreateInventoryInput,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("WarehouseId", sql.Int, input.warehouseId)
    .input("ProductId", sql.Int, input.productId)
    .input("AvailableQuantity", sql.Int, input.availableQuantity)
    .input("ReservedQuantity", sql.Int, input.reservedQuantity)
    .input("ReorderLevel", sql.Int, input.reorderLevel)
    .query(`
      INSERT INTO Inventory (
        WarehouseId,
        ProductId,
        AvailableQuantity,
        ReservedQuantity,
        ReorderLevel,
        IsActive
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.WarehouseId,
        INSERTED.ProductId,
        INSERTED.AvailableQuantity,
        INSERTED.ReservedQuantity,
        INSERTED.ReorderLevel,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      VALUES (
        @WarehouseId,
        @ProductId,
        @AvailableQuantity,
        @ReservedQuantity,
        @ReorderLevel,
        1
      );
    `);

  return result.recordset[0];
};

export const getAllInventory = async () => {
  const pool = await getDatabasePool();

  const result = await pool.request().query(`
    SELECT
      Id,
      WarehouseId,
      ProductId,
      AvailableQuantity,
      ReservedQuantity,
      ReorderLevel,
      IsActive,
      CreatedAt,
      UpdatedAt
    FROM Inventory
    ORDER BY Id DESC;
  `);

  return result.recordset;
};

export const getInventoryById = async (id: number) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(`
      SELECT
        Id,
        WarehouseId,
        ProductId,
        AvailableQuantity,
        ReservedQuantity,
        ReorderLevel,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Inventory
      WHERE Id = @Id;
    `);

  return result.recordset[0] ?? null;
};

export const updateInventory = async (
  id: number,
  input: UpdateInventoryInput,
) => {
  const pool = await getDatabasePool();

  const request = pool.request().input("Id", sql.Int, id);

  const updates: string[] = [];

  if (input.availableQuantity !== undefined) {
    request.input(
      "AvailableQuantity",
      sql.Int,
      input.availableQuantity,
    );
    updates.push("AvailableQuantity = @AvailableQuantity");
  }

  if (input.reservedQuantity !== undefined) {
    request.input(
      "ReservedQuantity",
      sql.Int,
      input.reservedQuantity,
    );
    updates.push("ReservedQuantity = @ReservedQuantity");
  }

  if (input.reorderLevel !== undefined) {
    request.input(
      "ReorderLevel",
      sql.Int,
      input.reorderLevel,
    );
    updates.push("ReorderLevel = @ReorderLevel");
  }

  if (updates.length === 0) {
    return getInventoryById(id);
  }

  const result = await request.query(`
    UPDATE Inventory
    SET
      ${updates.join(", ")},
      UpdatedAt = SYSUTCDATETIME()
    OUTPUT
      INSERTED.Id,
      INSERTED.WarehouseId,
      INSERTED.ProductId,
      INSERTED.AvailableQuantity,
      INSERTED.ReservedQuantity,
      INSERTED.ReorderLevel,
      INSERTED.IsActive,
      INSERTED.CreatedAt,
      INSERTED.UpdatedAt
    WHERE Id = @Id;
  `);

  return result.recordset[0] ?? null;
};

export const updateInventoryStatus = async (
  id: number,
  isActive: boolean,
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .input("IsActive", sql.Bit, isActive)
    .query(`
      UPDATE Inventory
      SET
        IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.WarehouseId,
        INSERTED.ProductId,
        INSERTED.AvailableQuantity,
        INSERTED.ReservedQuantity,
        INSERTED.ReorderLevel,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id;
    `);

  return result.recordset[0] ?? null;
};