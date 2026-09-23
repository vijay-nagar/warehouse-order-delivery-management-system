import { PackingRepository } from "../repositories/packing.repository.js";

export class PackingService {
  constructor(private readonly repository: PackingRepository) {}

  async createTask(
    orderId: number,
    pickingTaskId: number,
    notes?: string,
  ) {
    const picking = await this.repository.findById(pickingTaskId);

    if (picking) {
      // The actual PickingTask status is verified by the controller flow.
    }

    return this.repository.createTask(
      orderId,
      pickingTaskId,
      notes ?? "",
    );
  }

  async getTasks() {
    return this.repository.findAll();
  }

  async getTaskById(id: number) {
    return this.repository.findById(id);
  }

  async assignTask(id: number, packerUserId: number) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Packing task not found");
    }

    if (task.Status !== "PENDING") {
      throw new Error("Packing task must be in PENDING status");
    }

    const result = await this.repository.assign(id, packerUserId);

    if (!result) {
      throw new Error("Failed to assign packing task");
    }

    return result;
  }

  async startTask(id: number) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Packing task not found");
    }

    if (task.Status !== "ASSIGNED") {
      throw new Error("Packing task must be in ASSIGNED status");
    }

    const result = await this.repository.start(id);

    if (!result) {
      throw new Error("Failed to start packing task");
    }

    return result;
  }

  async createPackage(
    packingTaskId: number,
    weight?: number,
  ) {
    const task = await this.repository.findById(packingTaskId);

    if (!task) {
      throw new Error("Packing task not found");
    }

    if (task.Status !== "PACKING") {
      throw new Error("Packing task must be in PACKING status");
    }

    const count = await this.repository.getPackageCount(packingTaskId);
    const packageNumber = count + 1;

    const trackingCode =
      `PKG-${task.OrderId}-${packingTaskId}-${packageNumber}-${Date.now()}`;

    return this.repository.createPackage(
      packingTaskId,
      task.OrderId,
      packageNumber,
      trackingCode,
      weight ?? 0,
    );
  }

  async completeTask(id: number, notes?: string) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Packing task not found");
    }

    if (task.Status !== "PACKING") {
      throw new Error("Packing task must be in PACKING status");
    }

    const packageCount = await this.repository.getPackageCount(id);

    if (packageCount === 0) {
      throw new Error("At least one package is required before completing packing");
    }

    const result = await this.repository.complete(id, notes);

    if (!result) {
      throw new Error("Failed to complete packing task");
    }

    return result;
  }
}
