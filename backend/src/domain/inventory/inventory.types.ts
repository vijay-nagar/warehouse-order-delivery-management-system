export interface Inventory {
  id: number;
  warehouseId: number;
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateInventoryInput {
  warehouseId: number;
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export interface UpdateInventoryInput {
  availableQuantity?: number;
  reservedQuantity?: number;
  reorderLevel?: number;
}