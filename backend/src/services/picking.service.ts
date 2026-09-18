import { PickingRepository } from "../repositories/picking.repository.js";
import type {
  AssignPickingTaskInput,
  CompletePickingTaskInput,
  CreatePickingTaskInput,
} from "../validators/picking.validator.js";

export class PickingService {
  constructor(
    private readonly repository: PickingRepository,
  ) {}

  async createTask(input: CreatePickingTaskInput) {
    const existingTasks = await this.repository.findAll();

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

  async getTasks() {
    const tasks = await this.repository.findAll();

    return Promise.all(
      tasks.map(async (task) => ({
        ...task,
        items: await this.repository.findItems(task.Id),
      })),
    );
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

    const updated = await this.repository.assign(
      id,
      input.pickerUserId,
    );

    return updated;
  }

  async startTask(id: number) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Picking task not found");
    }

    if (task.Status !== "ASSIGNED") {
      throw new Error(
        `Picking task cannot be started from ${task.Status} status`,
      );
    }

    return this.repository.start(id);
  }

  async updatePickingItem(
    taskId: number,
    itemId: number,
    pickedQuantity: number,
  ) {
    const task = await this.repository.findById(taskId);

    if (!task) {
      throw new Error("Picking task not found");
    }

    if (task.Status !== "PICKING") {
      throw new Error("Picking task must be in PICKING status");
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
  ) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Picking task not found");
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

    return this.repository.complete(id, input.notes);
  }
}
