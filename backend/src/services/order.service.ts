import type {
  CreateOrderInput,
  Order,
} from "../domain/order/order.types.js";

import { OrderRepository } from "../repositories/order.repository.js";
import { InventoryReservationRepository } from "../repositories/inventory-reservation.repository.js";
import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly reservationRepository =
      new InventoryReservationRepository(),
  ) {}

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const order = await this.orderRepository.create(input);

    await rabbitMQService.publish("ORDER_CREATED", {
      event: "ORDER_CREATED",
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      warehouseId: order.warehouseId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    });

    await rabbitMQService.publish("ORDER_CREATED_NOTIFICATION", {
      event: "ORDER_CREATED",
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      warehouseId: order.warehouseId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    });

    

    return order;

    
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
