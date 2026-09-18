export type PackingTaskStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PACKING"
  | "PACKED"
  | "CANCELLED";

export type PackageStatus =
  | "CREATED"
  | "PACKED"
  | "CANCELLED";

export interface PackingTaskItem {
  id: number;
  pickingTaskId: number;
  productId: number;
  requiredQuantity: number;
  pickedQuantity: number;
}

export interface PackingTask {
  id: number;
  orderId: number;
  pickingTaskId: number;
  packerUserId: number | null;
  status: PackingTaskStatus;
  packageCount: number;
  assignedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  id: number;
  packingTaskId: number;
  orderId: number;
  packageNumber: number;
  trackingCode: string;
  weight: number | null;
  status: PackageStatus;
  packedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePackingTaskInput {
  orderId: number;
  pickingTaskId: number;
  notes?: string;
}

export interface AssignPackingTaskInput {
  packerUserId: number;
}

export interface CompletePackingTaskInput {
  notes?: string;
}

export interface CreatePackageInput {
  weight?: number;
}
