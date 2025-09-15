import { Server } from "http";

import { WebSocketServer, WebSocket } from "ws";

import { logger } from "../utils/logger.js";

interface ConnectedClient {
  ws: WebSocket;
  userId?: number;
  username?: string;
}

let wss: WebSocketServer;
const connectedClients = new Map<string, ConnectedClient>();

export const initializeWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const clientId = generateClientId();

    // Extract user info from query params if available
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");
    const username = url.searchParams.get("username");

    connectedClients.set(clientId, {
      ws,
      userId: userId ? parseInt(userId) : undefined,
      username: username || undefined,
    });

    logger.info(
      `Client connected: ${clientId} (user: ${username || "anonymous"})`,
    );

    ws.on("close", () => {
      connectedClients.delete(clientId);
      logger.info(`Client disconnected: ${clientId}`);
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "authenticate" && message.username) {
          const client = connectedClients.get(clientId);

          if (client) {
            client.username = message.username;
            client.userId = message.userId;
            connectedClients.set(clientId, client);
            logger.info(
              `Client authenticated: ${clientId} as ${message.username}`,
            );
          }
        }
      } catch (error) {
        logger.error("Error processing WebSocket message:", error);
      }
    });
  });
};

const generateClientId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const sendNotification = (notification: {
  type: string;
  message: string;
  projectId?: number;
  targetUsernames?: string[];
  targetUserIds?: number[];
}) => {
  if (!wss) return;

  const message = JSON.stringify(notification);

  // If no specific targets, send to all clients
  if (!notification.targetUsernames && !notification.targetUserIds) {
    connectedClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
    logger.info(`Sent broadcast notification: ${notification.type}`);

    return;
  }

  // Send to specific users
  let sentCount = 0;

  connectedClients.forEach((client) => {
    const shouldSend =
      (notification.targetUsernames &&
        client.username &&
        notification.targetUsernames.includes(client.username)) ||
      (notification.targetUserIds &&
        client.userId &&
        notification.targetUserIds.includes(client.userId));

    if (shouldSend && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      sentCount++;
    }
  });

  logger.info(
    `Sent targeted notification to ${sentCount} users: ${notification.type}`,
  );
};
