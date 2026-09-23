import sql from "mssql";

import { getDatabasePool } from "../config/database.js";

import type { TransactionType } from "../domain/inventory/inventory-transaction.types.js";

interface CreateTransactionInput {
  inventoryId: number;
  transactionType: TransactionType;
  quantity: number;
  remarks?: string | undefined;
}

export const executeInventoryTransaction = async (
  input: CreateTransactionInput
) => {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const request = new sql.Request(transaction);

    request.input("InventoryId", sql.Int, input.inventoryId);

    const inventoryResult = await request.query(`
      SELECT
        Id,
        AvailableQuantity,
        ReservedQuantity
      FROM Inventory WITH (UPDLOCK, ROWLOCK)
      WHERE Id = @InventoryId
        AND IsActive = 1;
    `);

    const inventory = inventoryResult.recordset[0];

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    const previousQuantity = inventory.AvailableQuantity;
    const reservedQuantity = inventory.ReservedQuantity;

    let newQuantity = previousQuantity;

    if (input.transactionType === "IN") {
      newQuantity = previousQuantity + input.quantity;
    }

    if (input.transactionType === "OUT") {
      if (input.quantity > previousQuantity) {
        throw new Error("Insufficient stock");
      }

      newQuantity = previousQuantity - input.quantity;
    }

    if (input.transactionType === "ADJUSTMENT") {
      if (input.quantity < reservedQuantity) {
        throw new Error(
          "Adjustment quantity cannot be less than reserved stock",
        );
      }

      newQuantity = input.quantity;
    }

    const updateRequest = new sql.Request(transaction);

    updateRequest.input("InventoryId", sql.Int, input.inventoryId);
    updateRequest.input("NewQuantity", sql.Int, newQuantity);

    await updateRequest.query(`
      UPDATE Inventory
      SET
        AvailableQuantity = @NewQuantity,
        UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @InventoryId;
    `);

    const transactionRequest = new sql.Request(transaction);

    transactionRequest.input(
      "InventoryId",
      sql.Int,
      input.inventoryId
    );

    transactionRequest.input(
      "TransactionType",
      sql.NVarChar(20),
      input.transactionType
    );

    transactionRequest.input(
      "Quantity",
      sql.Int,
      input.quantity
    );

    transactionRequest.input(
      "PreviousQuantity",
      sql.Int,
      previousQuantity
    );

    transactionRequest.input(
      "NewQuantity",
      sql.Int,
      newQuantity
    );

    transactionRequest.input(
      "Remarks",
      sql.NVarChar(500),
      input.remarks ?? null
    );

    const result = await transactionRequest.query(`
      INSERT INTO InventoryTransactions (
        InventoryId,
        TransactionType,
        Quantity,
        PreviousQuantity,
        NewQuantity,
        Remarks
      )
      OUTPUT INSERTED.*
      VALUES (
        @InventoryId,
        @TransactionType,
        @Quantity,
        @PreviousQuantity,
        @NewQuantity,
        @Remarks
      );
    `);

    await transaction.commit();

    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Get Transaction History
export const getInventoryTransactionHistory = async (
  inventoryId: number
) => {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("InventoryId", sql.Int, inventoryId)
    .query(`
      SELECT *
      FROM InventoryTransactions
      WHERE InventoryId = @InventoryId
      ORDER BY Id DESC;
    `);

  return result.recordset;
};