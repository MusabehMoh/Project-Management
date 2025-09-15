import { createServer } from "http";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { routes } from "./routes/index.js";
import { logger } from "./utils/logger.js";
import { initializeWebSocket } from "./signalR/notificationHub.js";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    optionsSuccessStatus: 200,
  }),
);

// Rate limiting (conditional)
if (config.rateLimit.enabled) {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: "Too many requests from this IP, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  });

  app.use(limiter);
  logger.info(
    `Rate limiting enabled: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs}ms`,
  );
} else {
  logger.info("Rate limiting disabled for development");
}

// Request parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (config.logging.enableRequestLogging) {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: config.nodeEnv,
  });
});

// API routes
app.use(config.apiPrefix, routes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// Start server
server.listen(config.port, () => {
  logger.info(`🚀 Mock API Server running on port ${config.port}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(
    `🔗 API Base URL: http://localhost:${config.port}${config.apiPrefix}`,
  );
  logger.info(`🌐 CORS Origin: ${config.cors.origin}`);
  logger.info(`🔌 WebSocket notification server initialized`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
  });
});

export default app;
