export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

export interface Delivery {
  id: number;
  orderId: number;
  packageId: number;
  deliveryBoyUserId: number | null;
  status: DeliveryStatus;
  assignedAt: Date | null;
  pickedUpAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  returnedAt: Date | null;
  failureReason: string | null;
  returnReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryTracking {
  id: number;
  deliveryId: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  remarks: string | null;
  createdAt: Date;
}

export interface CreateDeliveryInput {
  orderId: number;
  packageId: number;
}

export interface AssignDeliveryInput {
  deliveryBoyUserId: number;
}

export interface FailureInput {
  failureReason: string;
}

export interface ReturnInput {
  returnReason: string;
}

export interface TrackingInput {
  latitude?: number;
  longitude?: number;
  remarks?: string;
}
