import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiPrefix: process.env.API_PREFIX || "/api",

  cors: {
    // Support comma-separated origins (e.g., "http://localhost:5173,http://localhost:5174")
    origin:
      (process.env.CORS_ORIGIN?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) as string[] | undefined) || "http://localhost:5173",
    credentials: process.env.CORS_CREDENTIALS === "true",
  },

  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== "false",
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000", 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === "true",
  },

  mock: {
    enableDelays: process.env.ENABLE_MOCK_DELAYS === "true",
    delayMin: parseInt(process.env.MOCK_DELAY_MIN || "100", 10),
    delayMax: parseInt(process.env.MOCK_DELAY_MAX || "500", 10),
  },

  persistence: {
    enabled: process.env.ENABLE_PERSISTENCE === "true",
    file: process.env.PERSISTENCE_FILE || "./data/mock-data.json",
  },
};
