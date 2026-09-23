import type {
  CreateOrderInput,
  Order,
} from "../domain/order/order.types.js";

import { OrderRepository } from "../repositories/order.repository.js";
import { InventoryReservationRepository } from "../repositories/inventory-reservation.repository.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly reservationRepository =
      new InventoryReservationRepository(),
  ) {}

  async createOrder(input: CreateOrderInput): Promise<Order> {
    return this.orderRepository.create(input);
  }

  async getOrders(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.orderRepository.findById(id);
  }

  async cancelOrder(id: number): Promise<Order | null> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      return null;
    }

    if (order.status !== "CREATED") {
      return null;
    }

    await this.reservationRepository.cancelOrderWithReservationRelease(id);

    return this.orderRepository.findById(id);
  }
}
