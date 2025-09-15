import React, { createContext, useContext, useEffect } from "react";

interface Notification {
  type: string;
  message: string;
  projectId?: number;
  targetUsernames?: string[];
}

interface NotificationContextType {
  // You can add methods here if needed
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Get current user info (you might want to get this from a user context)
    const currentUser = localStorage.getItem("currentUser");
    const username = currentUser
      ? JSON.parse(currentUser).username
      : "anonymous";

    // Create WebSocket connection with authentication
    const ws = new WebSocket(`ws://localhost:3001?username=${username}`);

    ws.onopen = () => {
      console.log("Connected to notification server");

      // Send authentication message
      ws.send(
        JSON.stringify({
          type: "authenticate",
          username: username,
          userId: currentUser ? JSON.parse(currentUser).id : null,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);

        // Handle different notification types
        switch (notification.type) {
          case "PROJECT_SENT_FOR_REVIEW":
            // Show toast notification (you'll need to implement your preferred toast system)
            console.log("Project notification:", notification.message);

            // You can add a toast notification here
            // For example, if using react-hot-toast:
            // toast.success(notification.message);

            break;
          default:
            console.log("Unknown notification type:", notification.type);
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from notification server");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }

  return context;
}
