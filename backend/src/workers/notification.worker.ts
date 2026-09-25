import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";
import { notificationService } from "../infrastructure/notifications/notification.service.js";
import { OrderRepository } from "../repositories/order.repository.js";

const orderRepository = new OrderRepository();

interface OrderCreatedEvent {
  event: "ORDER_CREATED";
  orderId: number;
  orderNumber: string;
  customerId: number;
  warehouseId: number | null;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface OutOfStockEvent {
  event: "OUT_OF_STOCK";
  orderId: number;
  orderNumber?: string;
  shortfalls?: Array<{ productId: number; available: number; required: number }>;
}

interface DeliveryOutcomeEvent {
  event: "DELIVERY_FAILED" | "ORDER_DELIVERED" | "ORDER_RETURNED";
  deliveryId: number;
  orderId: number;
  reason?: string;
}

const notifyOrderCustomer = async (
  orderId: number,
  title: string,
  message: string,
  type: string,
  metadata: Record<string, unknown>,
): Promise<void> => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    console.error(`[NOTIFICATION WORKER] Order ${orderId} not found, skipping notification`);
    return;
  }

  await notificationService.send({
    recipientId: order.customerId,
    title,
    message,
    type,
    metadata,
  });
};

const startNotificationWorker = async (): Promise<void> => {
  await rabbitMQService.consume(
    "ORDER_CREATED_NOTIFICATION",
    async (message) => {
      const event = message as OrderCreatedEvent;

      console.log(
        "[NOTIFICATION WORKER] ORDER_CREATED event received:",
        event,
      );

      await notificationService.send({
        recipientId: event.customerId,
        title: "Order Created",
        message: `Your order ${event.orderNumber} has been created successfully.`,
        type: "ORDER_CREATED",
        metadata: {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          status: event.status,
          totalAmount: event.totalAmount,
        },
      });

      console.log(
        `[NOTIFICATION WORKER] Notification processed → ${event.orderNumber}`,
      );
    },
  );

  await rabbitMQService.consume("OUT_OF_STOCK", async (message) => {
    const event = message as OutOfStockEvent;

    console.log("[NOTIFICATION WORKER] OUT_OF_STOCK event received:", event);

    await notifyOrderCustomer(
      event.orderId,
      "Order Out of Stock",
      `Order ${event.orderNumber ?? event.orderId} could not be reserved — insufficient stock.`,
      "OUT_OF_STOCK",
      { orderId: event.orderId, shortfalls: event.shortfalls ?? [] },
    );
  });

  await rabbitMQService.consume("DELIVERY_FAILED", async (message) => {
    const event = message as DeliveryOutcomeEvent;

    console.log("[NOTIFICATION WORKER] DELIVERY_FAILED event received:", event);

    await notifyOrderCustomer(
      event.orderId,
      "Delivery Failed",
      `Delivery for order ${event.orderId} failed: ${event.reason ?? "no reason provided"}.`,
      "DELIVERY_FAILED",
      { orderId: event.orderId, deliveryId: event.deliveryId, reason: event.reason },
    );
  });

  await rabbitMQService.consume("ORDER_DELIVERED", async (message) => {
    const event = message as DeliveryOutcomeEvent;

    console.log("[NOTIFICATION WORKER] ORDER_DELIVERED event received:", event);

    await notifyOrderCustomer(
      event.orderId,
      "Order Delivered",
      `Order ${event.orderId} has been delivered.`,
      "ORDER_DELIVERED",
      { orderId: event.orderId, deliveryId: event.deliveryId },
    );
  });

  await rabbitMQService.consume("ORDER_RETURNED", async (message) => {
    const event = message as DeliveryOutcomeEvent;

    console.log("[NOTIFICATION WORKER] ORDER_RETURNED event received:", event);

    await notifyOrderCustomer(
      event.orderId,
      "Order Returned",
      `Order ${event.orderId} was returned: ${event.reason ?? "no reason provided"}.`,
      "ORDER_RETURNED",
      { orderId: event.orderId, deliveryId: event.deliveryId, reason: event.reason },
    );
  });

  console.log(
    "[NOTIFICATION WORKER] Consumer started",
  );
};

startNotificationWorker().catch((error) => {
  console.error(
    "[NOTIFICATION WORKER] Failed to start:",
    error,
  );

  process.exit(1);
});
