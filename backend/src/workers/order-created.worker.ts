import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";

const startOrderCreatedWorker = async (): Promise<void> => {
  await rabbitMQService.consume(
    "ORDER_CREATED",
    async (message) => {
      console.log("[WORKER] ORDER_CREATED event received:", message);

      // Future processing will go here:
      // inventory reservation
      // warehouse selection
      // pick-list generation
      // notifications, etc.
    },
  );

  console.log("[WORKER] ORDER_CREATED consumer started");
};

startOrderCreatedWorker().catch((error) => {
  console.error("[WORKER] Failed to start:", error);
  process.exit(1);
});
