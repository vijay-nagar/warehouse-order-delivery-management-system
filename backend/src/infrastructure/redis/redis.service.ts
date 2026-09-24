import { redisClient } from "./redis.client.js";

export class RedisService {
  async connect(): Promise<void> {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  }

  async ping(): Promise<boolean> {
  try {
    await this.connect();

    const response = await redisClient.ping();

    return response === "PONG";
  } catch (error) {
    console.error("[REDIS] Health check failed:", error);

    return false;
  }
}

  async get(key: string): Promise<string | null> {
    await this.connect();

    return redisClient.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.connect();

    if (ttlSeconds) {
      await redisClient.set(key, value, {
        EX: ttlSeconds,
      });

      return;
    }

    await redisClient.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.connect();

    await redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    await this.connect();

    return (await redisClient.exists(key)) === 1;
  }
}

export const redisService = new RedisService();
