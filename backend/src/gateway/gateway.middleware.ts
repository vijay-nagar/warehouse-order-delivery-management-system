import type {
  NextFunction,
  Request,
  Response,
} from "express";
import crypto from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { redisClient } from "../infrastructure/redis/redis.client.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const gatewayRequestId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const incomingRequestId = req.header("x-request-id");

  const requestId =
    incomingRequestId?.trim() || crypto.randomUUID();

  res.setHeader("X-Request-Id", requestId);

  res.locals.requestId = requestId;

  next();
};

export const gatewayRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const requestId = res.locals.requestId ?? "unknown";
    const duration = Date.now() - startedAt;

    console.log(
      `[API GATEWAY] ${req.method} ${req.originalUrl} ` +
        `${res.statusCode} ${duration}ms requestId=${requestId}`,
    );
  });

  next();
};

const createRedisStore = (prefix?: string): RedisStore => {
  return new RedisStore({
    ...(prefix ? { prefix } : {}),

    sendCommand: (...args: string[]) =>
      redisClient.sendCommand(args),
  });
};

export const createGatewayRateLimiter = () =>
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    store: createRedisStore("warehouse:rate-limit:gateway:"),

    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message:
          "Too many requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    },
  });

export const createGatewayLoginRateLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    store: createRedisStore(
      "warehouse:rate-limit:login:",
    ),

    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message:
          "Too many login attempts. Please try again later.",
        code: "LOGIN_RATE_LIMIT_EXCEEDED",
      });
    },
  });

export const gatewayAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
      code: "AUTHENTICATION_REQUIRED",
      requestId: res.locals.requestId,
    });

    return;
  }

  const token = authorization
    .substring("Bearer ".length)
    .trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
      code: "AUTHENTICATION_REQUIRED",
      requestId: res.locals.requestId,
    });

    return;
  }

  try {
    const payload = verifyAccessToken(token);

    res.locals.gatewayUser = payload;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
      code: "INVALID_AUTHENTICATION_TOKEN",
      requestId: res.locals.requestId,
    });
  }
};