import { InventoryReservationRepository } from "../repositories/inventory-reservation.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import type { InventoryReservation } from "../domain/inventory/reservation.types.js";
import type { WarehouseAllocationShortfall } from "../repositories/warehouse-allocation.repository.js";

export interface ReserveOrderResult {
  reservations: InventoryReservation[];
  warehouseId: number | null;
  shortfalls: WarehouseAllocationShortfall[];
}

export class InventoryReservationService {
  constructor(
    private readonly orderRepository = new OrderRepository(),
    private readonly reservationRepository =
      new InventoryReservationRepository(),
  ) {}

  /**
   * Manual re-trigger for an order stuck at CREATED or OUT_OF_STOCK
   * (e.g. orchestration never ran, or stock has since been replenished).
   * Re-runs warehouse allocation if the order has no warehouseId yet.
   */
  async reserveOrder(
    orderId: number,
    actorUserId: number | null = null,
  ): Promise<ReserveOrderResult> {
    return this.reservationRepository.retryReservationForOrder(
      orderId,
      actorUserId,
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
