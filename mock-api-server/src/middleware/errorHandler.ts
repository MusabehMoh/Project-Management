import { Request, Response, NextFunction } from "express";

import { logger } from "../utils/logger.js";

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";

  logger.error(`Error ${status}: ${message}`, {
    url: req.url,
    method: req.method,
    stack: err.stack,
  });

  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      status,
    },
    timestamp: new Date().toISOString(),
  });
};
