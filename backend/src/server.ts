import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { redisService } from "./infrastructure/redis/redis.service.js";
import { getRabbitMQChannel } from "./infrastructure/rabbitmq/rabbitmq.client.js";

const startServer = async (): Promise<void> => {
  try {
    await redisService.connect();

    console.log("[REDIS] Connection established successfully");

    await getRabbitMQChannel();

    console.log("[RABBITMQ] Connection established successfully");

    const app = createApp();

    app.listen(env.port, () => {
      console.log(
        `Warehouse backend running on port ${env.port} [${env.nodeEnv}]`
      );
    });
  } catch (error) {
    console.error("[INFRASTRUCTURE] Startup connection failed:", error);
    process.exit(1);
  }
};

void startServer();
