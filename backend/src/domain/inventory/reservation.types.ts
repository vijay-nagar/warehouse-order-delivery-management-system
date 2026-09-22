export type InventoryReservationStatus =
  | "RESERVED"
  | "RELEASED"
  | "CONSUMED";

export interface InventoryReservation {
  id: number;
  orderId: number;
  orderItemId: number;
  inventoryId: number;
  productId: number;
  quantity: number;
  status: InventoryReservationStatus;
  createdAt: Date;
  updatedAt: Date | null;
}
