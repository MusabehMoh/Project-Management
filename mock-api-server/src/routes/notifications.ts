import { Router } from "express";

import { NotificationsController } from "../controllers/notificationsController.js";

const router = Router();
const notificationsController = new NotificationsController();

// GET /api/notifications - Get notifications for current user
router.get("/", (req, res) =>
  notificationsController.getNotifications(req, res),
);

// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch("/:notificationId/read", (req, res) =>
  notificationsController.markAsRead(req, res),
);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch("/read-all", (req, res) =>
  notificationsController.markAllAsRead(req, res),
);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete("/:notificationId", (req, res) =>
  notificationsController.deleteNotification(req, res),
);

export default router;
