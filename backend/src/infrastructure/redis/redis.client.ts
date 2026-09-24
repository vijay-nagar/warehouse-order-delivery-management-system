import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || "6379";

export const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
});

redisClient.on("error", (error) => {
  console.error("[REDIS] Client error:", error);
});

redisClient.on("connect", () => {
  console.log("[REDIS] Connecting...");
});

redisClient.on("ready", () => {
  console.log("[REDIS] Connected and ready");
});

redisClient.on("reconnecting", () => {
  console.log("[REDIS] Reconnecting...");
});
