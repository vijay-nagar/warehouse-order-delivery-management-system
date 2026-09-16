import type {
  CreateOrderInput,
  Order,
} from "../domain/order/order.types.js";

import { OrderRepository } from "../repositories/order.repository.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
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
    return this.orderRepository.cancel(id);
  }
}
