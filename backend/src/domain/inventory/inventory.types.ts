export interface Inventory {
  Id: number;
  WarehouseId: number;
  ProductId: number;
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
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export interface UpdateInventoryInput {
  availableQuantity?: number | undefined;
  reservedQuantity?: number | undefined;
  reorderLevel?: number | undefined;
}