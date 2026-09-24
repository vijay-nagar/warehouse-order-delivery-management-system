import amqp, { type Channel, type ChannelModel } from "amqplib";

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost";
const rabbitmqPort = process.env.RABBITMQ_PORT || "5672";
const rabbitmqUser = process.env.RABBITMQ_USER || "guest";
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest";

const rabbitmqUrl =
  `amqp://${rabbitmqUser}:${rabbitmqPassword}` +
  `@${rabbitmqHost}:${rabbitmqPort}`;

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const getRabbitMQChannel = async (): Promise<Channel> => {
  if (channel) {
    return channel;
  }

  console.log("[RABBITMQ] Connecting...");

  connection = await amqp.connect(rabbitmqUrl);

  connection.on("error", (error) => {
    console.error("[RABBITMQ] Connection error:", error);
  });

  connection.on("close", () => {
    console.log("[RABBITMQ] Connection closed");

    connection = null;
    channel = null;
  });

  channel = await connection.createChannel();

  console.log("[RABBITMQ] Connected and channel created");

  return channel;
};