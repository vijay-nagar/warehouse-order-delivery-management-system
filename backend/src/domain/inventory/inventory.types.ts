export interface Inventory {
  Id: number;
  WarehouseId: number;
  ProductId: number;
  BinId: number | null;
  AvailableQuantity: number;
  ReservedQuantity: number;
  ReorderLevel: number;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateInventoryInput {
  warehouseId: number;
  productId: number;
  binId: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export interface UpdateInventoryInput {
  binId?: number | undefined;
  availableQuantity?: number | undefined;
  reservedQuantity?: number | undefined;
  reorderLevel?: number | undefined;
}