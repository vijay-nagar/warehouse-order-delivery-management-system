import type {
  CreateOrderInput,
  Order,
} from "../domain/order/order.types.js";

import { OrderRepository } from "../repositories/order.repository.js";
import type { PaginationRequest, PaginationResult } from "../shared/pagination/pagination.types.js";
import { InventoryReservationRepository } from "../repositories/inventory-reservation.repository.js";
import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";

const publishSafely = async (queue: string, message: unknown): Promise<void> => {
  try {
    await rabbitMQService.publish(queue, message);
  } catch (error) {
    // A messaging failure must never make an already-committed DB write
    // look like a failed request to the caller (dual-write risk).
    console.error(`[ORDER] Failed to publish ${queue}:`, error);
  }
};

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly reservationRepository =
      new InventoryReservationRepository(),
  ) {}

  async createOrder(
    input: CreateOrderInput,
    actorUserId: number | null = null,
  ): Promise<Order> {
    const { order, shortfalls } = await this.orderRepository.create(
      input,
      actorUserId,
    );

    const basePayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      warehouseId: order.warehouseId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    };

    await publishSafely("ORDER_CREATED", {
      event: "ORDER_CREATED",
      ...basePayload,
    });

    await publishSafely("ORDER_CREATED_NOTIFICATION", {
      event: "ORDER_CREATED",
      ...basePayload,
    });

    if (order.status === "STOCK_RESERVED") {
      await publishSafely("WAREHOUSE_ASSIGNED", {
        event: "WAREHOUSE_ASSIGNED",
        ...basePayload,
      });

      await publishSafely("STOCK_RESERVED", {
        event: "STOCK_RESERVED",
        ...basePayload,
      });

      await publishSafely("PICK_TASK_CREATED", {
        event: "PICK_TASK_CREATED",
        ...basePayload,
      });
    } else if (order.status === "OUT_OF_STOCK") {
      await publishSafely("OUT_OF_STOCK", {
        event: "OUT_OF_STOCK",
        ...basePayload,
        shortfalls,
      });
    }

    return order;
  }

  async getOrders(
    pagination: PaginationRequest,
  ): Promise<PaginationResult<Order>> {
    return this.orderRepository.findAll(pagination);
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.orderRepository.findById(id);
  }

  async cancelOrder(
    id: number,
    actorUserId: number | null = null,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      return null;
    }

    if (order.status !== "CREATED") {
      return null;
    }

    await this.reservationRepository.cancelOrderWithReservationRelease(
      id,
      actorUserId,
    );

    return this.orderRepository.findById(id);
  }
}
