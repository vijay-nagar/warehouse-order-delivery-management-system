import type { Response } from "express";

const SAFE_ERROR_PATTERNS = [
  "not found",
  "already exists",
  "required",
  "invalid",
  "inactive",
  "cannot",
  "must be",
  "not allowed",
  "not available",
  "insufficient",
  "duplicate",
  "unauthorized",
  "forbidden",
];

export const getSafeErrorMessage = (
  error: unknown,
  fallback = "Internal server error",
): string => {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  const normalized = message.toLowerCase();

  if (SAFE_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return message;
  }

  return fallback;
};

export const sendSafeErrorResponse = (
  res: Response,
  error: unknown,
  fallback = "Internal server error",
  statusCode = 500,
) => {
  console.error("[API ERROR]", error);

  return res.status(statusCode).json({
    success: false,
    message: getSafeErrorMessage(error, fallback),
  });
};
