export type PickingTaskStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKING"
  | "PICKED"
  | "CANCELLED";

export type PickingItemStatus =
  | "PENDING"
  | "PICKED"
  | "PARTIAL"
  | "SHORT";

export interface PickingTaskItem {
  id: number;
  pickingTaskId: number;
  productId: number;
  requiredQuantity: number;
  pickedQuantity: number;
  status: PickingItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PickingTask {
  id: number;
  orderId: number;
  pickerUserId: number | null;
  status: PickingTaskStatus;
  assignedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  items?: PickingTaskItem[];
}

export interface CreatePickingTaskInput {
  orderId: number;
  items: {
    productId: number;
    requiredQuantity: number;
  }[];
  notes?: string;
}

export interface AssignPickingTaskInput {
  pickerUserId: number;
}

export interface CompletePickingTaskInput {
  notes?: string;
}
