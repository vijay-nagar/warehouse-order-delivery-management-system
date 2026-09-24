import { getRabbitMQChannel } from "./rabbitmq.client.js";

export class RabbitMQService {
  async publish(
    queue: string,
    message: unknown,
  ): Promise<void> {
    const channel = await getRabbitMQChannel();

    await channel.assertQueue(queue, {
      durable: true,
    });

    const payload = Buffer.from(JSON.stringify(message));

    channel.sendToQueue(queue, payload, {
      persistent: true,
    });

    console.log(`[RABBITMQ] Message published → ${queue}`);
  }

  async consume(
    queue: string,
    handler: (message: unknown) => Promise<void>,
  ): Promise<void> {
    const channel = await getRabbitMQChannel();

    await channel.assertQueue(queue, {
      durable: true,
    });

    await channel.consume(queue, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const message = JSON.parse(msg.content.toString());

        await handler(message);

        channel.ack(msg);
      } catch (error) {
        console.error(
          `[RABBITMQ] Message processing failed → ${queue}`,
          error,
        );

        channel.nack(msg, false, false);
      }
    });

    console.log(`[RABBITMQ] Consumer started → ${queue}`);
  }
}

export const rabbitMQService = new RabbitMQService();