import { PackingRepository } from "../repositories/packing.repository.js";
import { PickingRepository } from "../repositories/picking.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { HttpError } from "../utils/http-error.js";
import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";
import type { PaginationRequest } from "../shared/pagination/pagination.types.js";

export class PackingService {
  constructor(
    private readonly repository: PackingRepository,
    private readonly pickingRepository = new PickingRepository(),
    private readonly userRepository = new UserRepository(),
  ) {}

  async createTask(
    orderId: number,
    pickingTaskId: number,
    notes?: string,
  ) {
    const picking = await this.pickingRepository.findById(pickingTaskId);

    if (!picking) {
      throw new Error("Picking task not found");
    }

    if (picking.Status !== "PICKED") {
      throw new Error(
        "Picking task must be PICKED before a packing task can be created",
      );
    }

    if (picking.OrderId !== orderId) {
      throw new Error("Picking task does not belong to the order");
    }

    return this.repository.createTask(
      orderId,
      pickingTaskId,
      notes ?? "",
    );
  }

  async getTasks(pagination: PaginationRequest) {
    return this.repository.findAll(pagination);
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
      throw new HttpError(409, "Packing task must be in PENDING status");
    }

    const [isActive, hasRole] = await Promise.all([
      this.userRepository.isActive(packerUserId),
      this.userRepository.hasRole(packerUserId, "Packer"),
    ]);

    if (!isActive || !hasRole) {
      throw new HttpError(400, "Target user is not an active Packer");
    }

    const result = await this.repository.assign(id, packerUserId);

    if (!result) {
      throw new HttpError(409, "Packing task must be in PENDING status");
    }

    return result;
  }

  async startTask(id: number, actorUserId: number) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Packing task not found");
    }

    if (task.PackerUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this packing task");
    }

    if (task.Status !== "ASSIGNED") {
      throw new Error("Packing task must be in ASSIGNED status");
    }

    const result = await this.repository.start(id, actorUserId);

    if (!result) {
      throw new HttpError(
        409,
        "Packing task could not be started (already started or task state changed)",
      );
    }

    return result;
  }

  async createPackage(
    packingTaskId: number,
    weight: number | undefined,
    actorUserId: number,
  ) {
    const task = await this.repository.findById(packingTaskId);

    if (!task) {
      throw new Error("Packing task not found");
    }

    if (task.PackerUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this packing task");
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

  async completeTask(id: number, notes: string | undefined, actorUserId: number) {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new Error("Packing task not found");
    }

    if (task.PackerUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this packing task");
    }

    if (task.Status !== "PACKING") {
      throw new Error("Packing task must be in PACKING status");
    }

    const packageCount = await this.repository.getPackageCount(id);

    if (packageCount === 0) {
      throw new Error("At least one package is required before completing packing");
    }

    const result = await this.repository.complete(id, notes, actorUserId);

    if (!result) {
      throw new HttpError(
        409,
        "Packing task could not be completed (already completed or task state changed)",
      );
    }

    rabbitMQService
      .publish("PACKING_COMPLETED", {
        event: "PACKING_COMPLETED",
        packingTaskId: result.Id,
        orderId: result.OrderId,
      })
      .catch((error) =>
        console.error("[PACKING] Failed to publish PACKING_COMPLETED:", error),
      );

    return result;
  }
}
