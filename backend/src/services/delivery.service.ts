import { DeliveryRepository } from "../repositories/delivery.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { HttpError } from "../utils/http-error.js";
import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";
import type { PaginationRequest } from "../shared/pagination/pagination.types.js";

export class DeliveryService {
  constructor(
    private readonly repository: DeliveryRepository,
    private readonly userRepository = new UserRepository(),
  ) {}

  async createDelivery(orderId: number, packageId: number) {
    const pkg = await this.repository.findPackage(packageId);

    if (!pkg) {
      throw new Error("Package not found");
    }

    if (pkg.OrderId !== orderId) {
      throw new Error("Package does not belong to the specified order");
    }

    if (pkg.Status !== "PACKED") {
      throw new Error("Package is not ready for delivery");
    }

    if (pkg.PackingStatus !== "PACKED") {
      throw new Error("Packing task must be PACKED before delivery");
    }

    const existingDeliveries = await this.repository.findByOrderId(orderId);

    const activeDelivery = existingDeliveries.find(
      (delivery) =>
        delivery.PackageId === packageId &&
        delivery.Status !== "DELIVERED" &&
        delivery.Status !== "RETURNED",
    );

    if (activeDelivery) {
      throw new Error("An active delivery already exists for this package");
    }

    return this.repository.create(orderId, packageId);
  }

  async getDeliveries(pagination: PaginationRequest, filters?: { status?: string }) {
    return this.repository.findAll(pagination, filters);
  }

  async getTrackingByDeliveryId(deliveryId: number) {
    const delivery = await this.repository.findById(deliveryId);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    return this.repository.getTrackingByDeliveryId(deliveryId);
  }

  async getAttemptsByDeliveryId(deliveryId: number) {
    const delivery = await this.repository.findById(deliveryId);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    return this.repository.getAttemptsByDeliveryId(deliveryId);
  }

  async getDeliveriesByDeliveryBoy(
    deliveryBoyUserId: number,
    pagination: PaginationRequest,
  ) {
    return this.repository.findByDeliveryBoyUserId(
      deliveryBoyUserId,
      pagination,
    );
  }

  async getDeliveryById(id: number) {
    return this.repository.findById(id);
  }

  async assign(id: number, deliveryBoyUserId: number) {
    const delivery = await this.repository.findById(id);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (delivery.Status !== "PENDING") {
      throw new Error("Delivery must be in PENDING status");
    }

    const [isActive, hasRole] = await Promise.all([
      this.userRepository.isActive(deliveryBoyUserId),
      this.userRepository.hasRole(deliveryBoyUserId, "Delivery Boy"),
    ]);

    if (!isActive || !hasRole) {
      throw new HttpError(
        400,
        "Target user is not an active Delivery Boy",
      );
    }

    const result = await this.repository.assign(id, deliveryBoyUserId);

    if (!result) {
      throw new HttpError(409, "Delivery must be in PENDING status");
    }

    rabbitMQService
      .publish("DELIVERY_ASSIGNED", {
        event: "DELIVERY_ASSIGNED",
        deliveryId: result.Id,
        orderId: result.OrderId,
        deliveryBoyUserId,
      })
      .catch((error) => console.error("[DELIVERY] Failed to publish DELIVERY_ASSIGNED:", error));

    return result;
  }

  async pickup(id: number, actorUserId: number) {
    await this.requireOwnedStatus(id, actorUserId, "ASSIGNED");

    const result = await this.repository.pickup(id);

    if (!result) {
      throw new HttpError(409, "Failed to pickup delivery");
    }

    rabbitMQService
      .publish("DELIVERY_PICKED_UP", {
        event: "DELIVERY_PICKED_UP",
        deliveryId: result.Id,
        orderId: result.OrderId,
      })
      .catch((error) => console.error("[DELIVERY] Failed to publish DELIVERY_PICKED_UP:", error));

    return result;
  }

  async outForDelivery(id: number, actorUserId: number) {
    await this.requireOwnedStatus(id, actorUserId, "PICKED_UP");

    const result = await this.repository.outForDelivery(id, actorUserId);

    if (!result) {
      throw new HttpError(409, "Failed to mark delivery out for delivery");
    }

    rabbitMQService
      .publish("OUT_FOR_DELIVERY", {
        event: "OUT_FOR_DELIVERY",
        deliveryId: result.Id,
        orderId: result.OrderId,
      })
      .catch((error) => console.error("[DELIVERY] Failed to publish OUT_FOR_DELIVERY:", error));

    return result;
  }

  async deliver(id: number, actorUserId: number) {
    await this.requireOwnedStatus(id, actorUserId, "OUT_FOR_DELIVERY");

    const result = await this.repository.deliver(id, actorUserId);

    if (!result) {
      throw new HttpError(409, "Failed to mark delivery as delivered");
    }

    rabbitMQService
      .publish("ORDER_DELIVERED", {
        event: "ORDER_DELIVERED",
        deliveryId: result.Id,
        orderId: result.OrderId,
      })
      .catch((error) => console.error("[DELIVERY] Failed to publish ORDER_DELIVERED:", error));

    return result;
  }

  async fail(id: number, reason: string, actorUserId: number) {
    await this.requireOwnedStatus(id, actorUserId, "OUT_FOR_DELIVERY");

    const result = await this.repository.fail(id, reason, actorUserId);

    if (!result) {
      throw new HttpError(409, "Failed to mark delivery as failed");
    }

    rabbitMQService
      .publish("DELIVERY_FAILED", {
        event: "DELIVERY_FAILED",
        deliveryId: result.Id,
        orderId: result.OrderId,
        reason,
      })
      .catch((error) => console.error("[DELIVERY] Failed to publish DELIVERY_FAILED:", error));

    return result;
  }

  async returnDelivery(id: number, reason: string, actorUserId: number) {
    await this.requireOwnedStatus(id, actorUserId, "FAILED");

    const result = await this.repository.returnDelivery(id, reason, actorUserId);

    if (!result) {
      throw new HttpError(409, "Failed to return delivery");
    }

    rabbitMQService
      .publish("ORDER_RETURNED", {
        event: "ORDER_RETURNED",
        deliveryId: result.Id,
        orderId: result.OrderId,
        reason,
      })
      .catch((error) => console.error("[DELIVERY] Failed to publish ORDER_RETURNED:", error));

    rabbitMQService
      .publish("INVENTORY_RECOVERED", {
        event: "INVENTORY_RECOVERED",
        deliveryId: result.Id,
        orderId: result.OrderId,
      })
      .catch((error) => console.error("[DELIVERY] Failed to publish INVENTORY_RECOVERED:", error));

    return result;
  }

  async addTracking(
    id: number,
    actorUserId: number,
    latitude?: number,
    longitude?: number,
    remarks?: string,
  ) {
    const delivery = await this.repository.findById(id);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (delivery.DeliveryBoyUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this delivery");
    }

    if (
      delivery.Status !== "PICKED_UP" &&
      delivery.Status !== "OUT_FOR_DELIVERY"
    ) {
      throw new Error("Tracking is available only during active delivery");
    }

    return this.repository.addTracking(
      id,
      delivery.Status,
      latitude ?? null,
      longitude ?? null,
      remarks ?? null,
    );
  }

  private async requireOwnedStatus(
    id: number,
    actorUserId: number,
    expectedStatus: string,
  ) {
    const delivery = await this.repository.findById(id);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (delivery.DeliveryBoyUserId !== actorUserId) {
      throw new HttpError(403, "You are not assigned to this delivery");
    }

    if (delivery.Status !== expectedStatus) {
      throw new Error(
        `Delivery must be in ${expectedStatus} status`,
      );
    }

    return delivery;
  }
}
