import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";
import { notificationService } from "../infrastructure/notifications/notification.service.js";

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