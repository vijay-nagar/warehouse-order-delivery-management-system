import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import type {
  CreateInventoryInput,
  UpdateInventoryInput,
} from "../validators/inventory.validator.js";
// Columns + joined location path (Warehouse/Zone/Shelf/Bin) shared by every
// inventory read query, so the API can always surface exact storage location.
const INVENTORY_SELECT_WITH_LOCATION = `
  SELECT
    i.Id,
    i.WarehouseId,
    i.ProductId,
    i.BinId,
    i.AvailableQuantity,
    i.ReservedQuantity,
    i.ReorderLevel,
    i.IsActive,
    i.CreatedAt,
    i.UpdatedAt,
    w.Name AS WarehouseName,
    z.Id AS ZoneId,
    z.Name AS ZoneName,
    s.Id AS ShelfId,
    s.Name AS ShelfName,
    b.Name AS BinName
  FROM Inventory i
  INNER JOIN Warehouses w ON w.Id = i.WarehouseId
  LEFT JOIN Bins b ON b.Id = i.BinId
  LEFT JOIN Shelves s ON s.Id = b.ShelfId
  LEFT JOIN Zones z ON z.Id = s.ZoneId
`;

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
        BinId,
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

export const binExists = async (binId: number) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, binId)
    .query(`
      SELECT Id
      FROM Bins
      WHERE Id = @Id;
    `);

  return result.recordset.length > 0;
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
    .input("BinId", sql.Int, input.binId)
    .input("AvailableQuantity", sql.Int, input.availableQuantity)
    .input("ReservedQuantity", sql.Int, input.reservedQuantity)
    .input("ReorderLevel", sql.Int, input.reorderLevel)
    .query(`
      INSERT INTO Inventory (
        WarehouseId,
        ProductId,
        BinId,
        AvailableQuantity,
        ReservedQuantity,
        ReorderLevel,
        IsActive
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.WarehouseId,
        INSERTED.ProductId,
        INSERTED.BinId,
        INSERTED.AvailableQuantity,
        INSERTED.ReservedQuantity,
        INSERTED.ReorderLevel,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      VALUES (
        @WarehouseId,
        @ProductId,
        @BinId,
        @AvailableQuantity,
        @ReservedQuantity,
        @ReorderLevel,
        1
      );
    `);

  return result.recordset[0];
};

export const getAllInventory = async (filters?: { binId?: number }) => {
  const pool = await getDatabasePool();

  const request = pool.request();

  let whereClause = "";

  if (filters?.binId !== undefined) {
    request.input("BinId", sql.Int, filters.binId);
    whereClause = "WHERE i.BinId = @BinId";
  }

  const result = await request.query(`
    ${INVENTORY_SELECT_WITH_LOCATION}
    ${whereClause}
    ORDER BY i.Id DESC;
  `);

  return result.recordset;
};

export const getInventoryById = async (id: number) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(`
      ${INVENTORY_SELECT_WITH_LOCATION}
      WHERE i.Id = @Id;
    `);

  return result.recordset[0] ?? null;
};

// Wrapped in a locked transaction (UPDLOCK, ROWLOCK) so a concurrent
// reserve/release/pick-consume on the same row can't race this admin edit —
// previously this was a plain read-then-write with no lock, unlike every
// other inventory-mutating path in the codebase.
export const updateInventory = async (
  id: number,
  input: UpdateInventoryInput,
) => {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const lockRequest = new sql.Request(transaction);
    lockRequest.input("Id", sql.Int, id);

    const existingResult = await lockRequest.query(`
      SELECT Id, AvailableQuantity, ReservedQuantity
      FROM Inventory WITH (UPDLOCK, ROWLOCK)
      WHERE Id = @Id;
    `);

    const existing = existingResult.recordset[0];

    if (!existing) {
      await transaction.rollback();
      return null;
    }

    const newAvailableQuantity =
      input.availableQuantity ?? existing.AvailableQuantity;
    const newReservedQuantity =
      input.reservedQuantity ?? existing.ReservedQuantity;

    if (newReservedQuantity > newAvailableQuantity) {
      throw new Error(
        "Reserved quantity cannot be greater than available quantity",
      );
    }

    const updateRequest = new sql.Request(transaction);
    updateRequest.input("Id", sql.Int, id);

    const updates: string[] = [];

    if (input.binId !== undefined) {
      updateRequest.input("BinId", sql.Int, input.binId);
      updates.push("BinId = @BinId");
    }

    if (input.availableQuantity !== undefined) {
      updateRequest.input(
        "AvailableQuantity",
        sql.Int,
        input.availableQuantity,
      );
      updates.push("AvailableQuantity = @AvailableQuantity");
    }

    if (input.reservedQuantity !== undefined) {
      updateRequest.input(
        "ReservedQuantity",
        sql.Int,
        input.reservedQuantity,
      );
      updates.push("ReservedQuantity = @ReservedQuantity");
    }

    if (input.reorderLevel !== undefined) {
      updateRequest.input(
        "ReorderLevel",
        sql.Int,
        input.reorderLevel,
      );
      updates.push("ReorderLevel = @ReorderLevel");
    }

    if (updates.length === 0) {
      await transaction.commit();
      return getInventoryById(id);
    }

    const result = await updateRequest.query(`
      UPDATE Inventory
      SET
        ${updates.join(", ")},
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.WarehouseId,
        INSERTED.ProductId,
        INSERTED.BinId,
        INSERTED.AvailableQuantity,
        INSERTED.ReservedQuantity,
        INSERTED.ReorderLevel,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id;
    `);

    const previousQuantity = existing.AvailableQuantity;
    const updatedRow = result.recordset[0];

    if (updatedRow && updatedRow.AvailableQuantity !== previousQuantity) {
      const txnRequest = new sql.Request(transaction);
      txnRequest.input("InventoryId", sql.Int, id);
      txnRequest.input("Quantity", sql.Int, Math.abs(
        updatedRow.AvailableQuantity - previousQuantity,
      ));
      txnRequest.input("PreviousQuantity", sql.Int, previousQuantity);
      txnRequest.input("NewQuantity", sql.Int, updatedRow.AvailableQuantity);
      txnRequest.input(
        "Remarks",
        sql.NVarChar(500),
        "Manual inventory edit via PUT /api/inventory/:id",
      );

      await txnRequest.query(`
        INSERT INTO InventoryTransactions (
          InventoryId,
          TransactionType,
          Quantity,
          PreviousQuantity,
          NewQuantity,
          Remarks
        )
        VALUES (
          @InventoryId,
          'ADJUSTMENT',
          @Quantity,
          @PreviousQuantity,
          @NewQuantity,
          @Remarks
        );
      `);
    }

    await transaction.commit();

    return updatedRow ?? null;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
        INSERTED.BinId,
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