import { PickingRepository } from "../repositories/picking.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { HttpError } from "../utils/http-error.js";
import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";
import type {
  AssignPickingTaskInput,
  CompletePickingTaskInput,
  CreatePickingTaskInput,
} from "../validators/picking.validator.js";
import type { PaginationRequest } from "../shared/pagination/pagination.types.js";

export class PickingService {
  constructor(
    private readonly repository: PickingRepository,
    private readonly userRepository = new UserRepository(),
  ) {}

  async createTask(input: CreatePickingTaskInput) {
    const existingTasks = await this.repository.findByOrderId(input.orderId);

    const existing = existingTasks.find(
      (task) =>
        task.OrderId === input.orderId &&
        !["PICKED", "CANCELLED"].includes(task.Status),
    );

    if (existing) {
      throw new Error(
        "An active picking task already exists for this order",
      );
    }

    const taskId = await this.repository.createTask(
      input.orderId,
      input.notes ?? "",
    );

    for (const item of input.items) {
      await this.repository.createItem(
        taskId,
        item.productId,
        item.requiredQuantity,
      );
    }

    return this.getTaskById(taskId);
  }

  async getStatusSummary(): Promise<Record<string, number>> {
    return this.repository.getStatusSummary();
  }

  async getTasks(
    pagination: PaginationRequest,
    filters?: { status?: string; pickerUserId?: number },
  ) {
    const result = await this.repository.findAll(pagination, filters);

    const items = await Promise.all(
      result.items.map(async (task) => ({
        ...task,
        items: await this.repository.findItems(task.Id),
      })),
    );

    return { ...result, items };
  }

  async getMyTasks(
    pickerUserId: number,
    pagination: PaginationRequest,
    status?: string,
  ) {
    return this.getTasks(pagination, {
      pickerUserId,
      ...(status !== undefined ? { status } : {}),
    });
  }

  async getTaskById(id: number) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Picking task not found");
    }

    const items = await this.repository.findItems(id);

    return {
      ...task,
      items,
    };
  }

  async assignTask(
    id: number,
    input: AssignPickingTaskInput,
  ) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Picking task not found");
    }

    if (task.Status !== "PENDING") {
      throw new Error(
        `Picking task cannot be assigned from ${task.Status} status`,
      );
    }

    const [isActive, hasRole] = await Promise.all([
      this.userRepository.isActive(input.pickerUserId),
      this.userRepository.hasRole(input.pickerUserId, "Picker"),
    ]);

    if (!isActive || !hasRole) {
      throw new HttpError(400, "Target user is not an active Picker");
    }

    const updated = await this.repository.assign(
      id,
      input.pickerUserId,
    );

    return updated;
  }

  async reassignTask(
    id: number,
    input: AssignPickingTaskInput,
  ) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Picking task not found");
    }

    if (task.Status !== "ASSIGNED") {
      throw new HttpError(
        409,
        `Picking task cannot be reassigned from ${task.Status} status`,
      );
    }

    const [isActive, hasRole] = await Promise.all([
      this.userRepository.isActive(input.pickerUserId),
      this.userRepository.hasRole(input.pickerUserId, "Picker"),
    ]);

    if (!isActive || !hasRole) {
      throw new HttpError(400, "Target user is not an active Picker");
    }

    const updated = await this.repository.reassign(
      id,
      input.pickerUserId,
    );

    if (!updated) {
      throw new HttpError(
        409,
        "Picking task could not be reassigned (already started or completed)",
      );
    }

    return updated;
  }

  async startTask(id: number, actorUserId: number) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Picking task not found");
    }

    if (task.PickerUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this picking task");
    }

    if (task.Status !== "ASSIGNED") {
      throw new Error(
        `Picking task cannot be started from ${task.Status} status`,
      );
    }

    const result = await this.repository.start(id, actorUserId);

    if (!result) {
      throw new HttpError(
        409,
        "Picking task could not be started (already started or reassigned)",
      );
    }

    return result;
  }

  async updatePickingItem(
    taskId: number,
    itemId: number,
    pickedQuantity: number,
    actorUserId: number,
    pickedBinId?: number,
  ) {
    const task = await this.repository.findById(taskId);

    if (!task) {
      throw new Error("Picking task not found");
    }

    if (task.PickerUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this picking task");
    }

    if (task.Status !== "PICKING") {
      throw new Error("Picking task must be in PICKING status");
    }

    // If the item has a known expected bin and the picker reports picking
    // from a different one, reject before recording the pick — bin-based
    // picking must not silently accept stock pulled from the wrong location.
    if (pickedBinId !== undefined) {
      const items = await this.repository.findItems(taskId);
      const targetItem = items.find((existing) => existing.Id === itemId);

      if (
        targetItem?.BinId != null &&
        targetItem.BinId !== pickedBinId
      ) {
        throw new HttpError(
          409,
          `Picked from the wrong bin. Expected bin ${targetItem.BinId}, got ${pickedBinId}.`,
        );
      }
    }

    const item = await this.repository.updateItem(
      taskId,
      itemId,
      pickedQuantity,
    );

    if (!item) {
      throw new Error("Picking item not found");
    }

    return item;
  }

  async completeTask(
    id: number,
    input: CompletePickingTaskInput,
    actorUserId: number,
  ) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Picking task not found");
    }

    if (task.PickerUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this picking task");
    }

    if (task.Status !== "PICKING") {
      throw new Error(
        `Picking task cannot be completed from ${task.Status} status`,
      );
    }

    const items = await this.repository.findItems(id);

    if (items.length === 0) {
      throw new Error("Picking task has no items");
    }

    const incompleteItem = items.find(
      (item) =>
        item.PickedQuantity < item.RequiredQuantity,
    );

    if (incompleteItem) {
      throw new Error(
        "All picking items must be completed before completing the task",
      );
    }

    const result = await this.repository.complete(id, input.notes, actorUserId);

    if (!result) {
      throw new HttpError(
        409,
        "Picking task could not be completed (already completed or task state changed)",
      );
    }

    rabbitMQService
      .publish("PICKING_COMPLETED", {
        event: "PICKING_COMPLETED",
        pickingTaskId: result.Id,
        orderId: result.OrderId,
      })
      .catch((error) =>
        console.error("[PICKING] Failed to publish PICKING_COMPLETED:", error),
      );

    return result;
  }
}
