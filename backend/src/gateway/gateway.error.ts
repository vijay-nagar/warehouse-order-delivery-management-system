import type {
  ErrorRequestHandler,
} from "express";

export const gatewayErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
) => {
  const requestId =
    res.locals.requestId ?? "unknown";

  console.error("[API GATEWAY ERROR]", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    error:
      err instanceof Error
        ? err.message
        : String(err),
    stack:
      err instanceof Error
        ? err.stack
        : undefined,
  });

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    requestId,
  });
};