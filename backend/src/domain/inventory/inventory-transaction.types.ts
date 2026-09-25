export type TransactionType =
  | "IN"
  | "OUT"
  | "ADJUSTMENT"
  | "RETURN_RECOVERY"
  | "RESERVE"
  | "RELEASE"
  | "PICK_CONSUME";

export interface InventoryTransaction {
  Id: number;
  InventoryId: number;
  TransactionType: TransactionType;
  Quantity: number;
  PreviousQuantity: number;
  NewQuantity: number;
  Remarks: string | null;
  OrderId: number | null;
  OrderItemId: number | null;
  ReferenceType: string | null;
  ReferenceId: number | null;
  UserId: number | null;
  BinId: number | null;
  CreatedAt: Date;
}

export interface StockInInput {
  inventoryId: number;
  quantity: number;
  remarks?: string | undefined;
}

export interface StockOutInput {
  inventoryId: number;
  quantity: number;
  remarks?: string | undefined;
}

export interface StockAdjustmentInput {
  inventoryId: number;
  quantity: number;
  remarks?: string | undefined;
}