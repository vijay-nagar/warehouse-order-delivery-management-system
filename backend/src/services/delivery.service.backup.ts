import { DeliveryRepository } from "../repositories/delivery.repository.js";

export class DeliveryService {
  constructor(private readonly repository: DeliveryRepository) {}

  async createDelivery(orderId: number, packageId: number) {
    const pkg = await this.repository.findPackage(packageId);

    if (!pkg) {
      throw new Error("Package not found");
    }

    if (pkg.OrderId !== orderId) {
      throw new Error("Package does not belong to the specified order");
    }

    if (pkg.Status !== "CREATED" && pkg.Status !== "PACKED") {
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

  async getDeliveries() {
    return this.repository.findAll();
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

    const result = await this.repository.assign(id, deliveryBoyUserId);

    if (!result) {
      throw new Error("Failed to assign delivery");
    }

    return result;
  }

  async pickup(id: number) {
    await this.requireStatus(id, "ASSIGNED");

    const result = await this.repository.pickup(id);

    if (!result) {
      throw new Error("Failed to pickup delivery");
    }

    return result;
  }

  async outForDelivery(id: number) {
    await this.requireStatus(id, "PICKED_UP");

    const result = await this.repository.outForDelivery(id);

    if (!result) {
      throw new Error("Failed to mark delivery out for delivery");
    }

    return result;
  }

  async deliver(id: number) {
    await this.requireStatus(id, "OUT_FOR_DELIVERY");

    const result = await this.repository.deliver(id);

    if (!result) {
      throw new Error("Failed to mark delivery as delivered");
    }

    return result;
  }

  async fail(id: number, reason: string) {
    const delivery = await this.repository.findById(id);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (
      delivery.Status !== "OUT_FOR_DELIVERY" &&
      delivery.Status !== "PICKED_UP"
    ) {
      throw new Error("Delivery cannot be marked as failed in its current status");
    }

    const result = await this.repository.fail(id, reason);

    if (!result) {
      throw new Error("Failed to mark delivery as failed");
    }

    return result;
  }

  async returnDelivery(id: number, reason: string) {
    const delivery = await this.repository.findById(id);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (delivery.Status !== "FAILED") {
      throw new Error("Delivery must be FAILED before it can be RETURNED");
    }

    const result = await this.repository.returnDelivery(id, reason);

    if (!result) {
      throw new Error("Failed to return delivery");
    }

    return result;
  }

  async addTracking(
    id: number,
    latitude?: number,
    longitude?: number,
    remarks?: string,
  ) {
    const delivery = await this.repository.findById(id);

    if (!delivery) {
      throw new Error("Delivery not found");
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

  private async requireStatus(
    id: number,
    expectedStatus: string,
  ) {
    const delivery = await this.repository.findById(id);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (delivery.Status !== expectedStatus) {
      throw new Error(
        `Delivery must be in ${expectedStatus} status`,
      );
    }
  }
}
