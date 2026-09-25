import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import {
  getPaginationOffset,
  getTotalPages,
} from "../shared/pagination/pagination.js";

import type { TransactionType } from "../domain/inventory/inventory-transaction.types.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

interface CreateTransactionInput {
  inventoryId: number;
  transactionType: TransactionType;
  quantity: number;
  remarks?: string | undefined;
  userId?: number | null | undefined;
}

// Reusable insert for callers that already hold an open sql.Transaction
// (reserve/release/pick-consume/return-recovery) and just need to append the
// audit row alongside their own guarded UPDATE, without opening a second
// transaction.
export interface InsertTransactionRefInput {
  inventoryId: number;
  transactionType: TransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  remarks?: string | null | undefined;
  orderId?: number | null | undefined;
  orderItemId?: number | null | undefined;
  referenceType?: string | null | undefined;
  referenceId?: number | null | undefined;
  userId?: number | null | undefined;
  binId?: number | null | undefined;
}

export const insertInventoryTransactionInTransaction = async (
  transaction: sql.Transaction,
  input: InsertTransactionRefInput,
) => {
  const request = new sql.Request(transaction);

  request.input("InventoryId", sql.Int, input.inventoryId);
  request.input("TransactionType", sql.NVarChar(20), input.transactionType);
  request.input("Quantity", sql.Int, input.quantity);
  request.input("PreviousQuantity", sql.Int, input.previousQuantity);
  request.input("NewQuantity", sql.Int, input.newQuantity);
  request.input("Remarks", sql.NVarChar(500), input.remarks ?? null);
  request.input("OrderId", sql.Int, input.orderId ?? null);
  request.input("OrderItemId", sql.Int, input.orderItemId ?? null);
  request.input("ReferenceType", sql.NVarChar(30), input.referenceType ?? null);
  request.input("ReferenceId", sql.Int, input.referenceId ?? null);
  request.input("UserId", sql.Int, input.userId ?? null);
  request.input("BinId", sql.Int, input.binId ?? null);

  await request.query(`
    INSERT INTO InventoryTransactions (
      InventoryId,
      TransactionType,
      Quantity,
      PreviousQuantity,
      NewQuantity,
      Remarks,
      OrderId,
      OrderItemId,
      ReferenceType,
      ReferenceId,
      UserId,
      BinId
    )
    VALUES (
      @InventoryId,
      @TransactionType,
      @Quantity,
      @PreviousQuantity,
      @NewQuantity,
      @Remarks,
      @OrderId,
      @OrderItemId,
      @ReferenceType,
      @ReferenceId,
      @UserId,
      @BinId
    );
  `);
};

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

    transactionRequest.input("UserId", sql.Int, input.userId ?? null);

    const result = await transactionRequest.query(`
      INSERT INTO InventoryTransactions (
        InventoryId,
        TransactionType,
        Quantity,
        PreviousQuantity,
        NewQuantity,
        Remarks,
        UserId
      )
      OUTPUT INSERTED.*
      VALUES (
        @InventoryId,
        @TransactionType,
        @Quantity,
        @PreviousQuantity,
        @NewQuantity,
        @Remarks,
        @UserId
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
  inventoryId: number,
  pagination: PaginationRequest,
): Promise<PaginationResult<Record<string, unknown>>> => {
  const pool = await getDatabasePool();
  const offset = getPaginationOffset(pagination.page, pagination.pageSize);

  const countResult = await pool
    .request()
    .input("InventoryId", sql.Int, inventoryId)
    .query<{ TotalCount: number }>(`
      SELECT COUNT(*) AS TotalCount
      FROM InventoryTransactions
      WHERE InventoryId = @InventoryId;
    `);

  const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);

  const result = await pool
    .request()
    .input("InventoryId", sql.Int, inventoryId)
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pagination.pageSize)
    .query(`
      SELECT *
      FROM InventoryTransactions
      WHERE InventoryId = @InventoryId
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