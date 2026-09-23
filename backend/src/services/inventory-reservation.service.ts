import { InventoryReservationRepository } from "../repositories/inventory-reservation.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import type { InventoryReservation } from "../domain/inventory/reservation.types.js";

export class InventoryReservationService {
  constructor(
    private readonly orderRepository = new OrderRepository(),
    private readonly reservationRepository =
      new InventoryReservationRepository(),
  ) {}

  async reserveOrder(orderId: number): Promise<InventoryReservation[]> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (!order.warehouseId) {
      throw new Error(
        `Order ${orderId} does not have a warehouse assigned.`,
      );
    }

    if (order.status !== "CREATED") {
      throw new Error(
        `Order ${orderId} cannot be reserved from status ${order.status}.`,
      );
    }

    if (order.items.length === 0) {
      throw new Error(`Order ${orderId} has no items.`);
    }

    const reservations = order.items.map((item) => ({
      orderId: order.id,
      orderItemId: item.id,
      productId: item.productId,
      quantity: item.quantity,
    }));

    return this.reservationRepository.reserveOrderStock(
      reservations,
      order.warehouseId,
    );
  }

  async releaseOrderReservations(
    orderId: number,
  ): Promise<InventoryReservation[]> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (!["CANCELLED", "FAILED", "RETURNED"].includes(order.status)) {
      throw new Error(
        `Order ${orderId} cannot release reservations from status ${order.status}.`,
      );
    }

    return this.reservationRepository.releaseOrderReservations(orderId);
  }

  async consumeOrderReservations(
    orderId: number,
  ): Promise<InventoryReservation[]> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (!["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)) {
      throw new Error(
        `Order ${orderId} cannot consume reservations from status ${order.status}.`,
      );
    }

    return this.reservationRepository.consumeOrderReservations(orderId);
  }
}
