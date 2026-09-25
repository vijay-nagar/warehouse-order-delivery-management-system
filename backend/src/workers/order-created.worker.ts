import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";

const startOrderCreatedWorker = async (): Promise<void> => {
  await rabbitMQService.consume(
    "ORDER_CREATED",
    async (message) => {
      console.log("[WORKER] ORDER_CREATED event received:", message);

      // Warehouse selection, inventory reservation, and pick-task
      // generation now happen synchronously inside
      // OrderRepository.create()'s own transaction (see
      // src/repositories/order.repository.ts), so the order is never left
      // waiting on this consumer. This handler is retained only as a
      // passive audit/log point for ORDER_CREATED events, not a workflow
      // trigger.
    },
  );

  console.log("[WORKER] ORDER_CREATED consumer started");
};

startOrderCreatedWorker().catch((error) => {
  console.error("[WORKER] Failed to start:", error);
  process.exit(1);
});
