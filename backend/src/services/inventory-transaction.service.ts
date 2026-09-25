import {
  executeInventoryTransaction,
  getInventoryTransactionHistory,
} from "../repositories/inventory-transaction.repository.js";

import type {
  StockInInput,
  StockOutInput,
  StockAdjustmentInput,
} from "../validators/inventory-transaction.validator.js";

// Stock In
export const stockInService = async (
  input: StockInInput,
  actorUserId?: number | null,
) => {
  return executeInventoryTransaction({
    inventoryId: input.inventoryId,
    transactionType: "IN",
    quantity: input.quantity,
    remarks: input.remarks,
    userId: actorUserId,
  });
};

// Stock Out
export const stockOutService = async (
  input: StockOutInput,
  actorUserId?: number | null,
) => {
  return executeInventoryTransaction({
    inventoryId: input.inventoryId,
    transactionType: "OUT",
    quantity: input.quantity,
    remarks: input.remarks,
    userId: actorUserId,
  });
};

// Stock Adjustment
export const stockAdjustmentService = async (
  input: StockAdjustmentInput,
  actorUserId?: number | null,
) => {
  return executeInventoryTransaction({
    inventoryId: input.inventoryId,
    transactionType: "ADJUSTMENT",
    quantity: input.quantity,
    remarks: input.remarks,
    userId: actorUserId,
  });
};

// Transaction History
export const getTransactionHistoryService = async (
  inventoryId: number
) => {
  return getInventoryTransactionHistory(inventoryId);
};