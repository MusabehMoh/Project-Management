import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { mockUrgentNotifications } from "@/utils/mockNotifications";
import { IconSvgProps } from "@/types";

// Create a Bell icon since we don't have one in icons.tsx
const BellIcon = (props: IconSvgProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

interface UrgentNotificationProps {
  maxNotifications?: number;
  useMockData?: boolean;
}

export const UrgentNotifications: React.FC<UrgentNotificationProps> = ({
  maxNotifications = 3,
  useMockData = true, // Set to true for development, should be false in production
}) => {
  const { notifications: realNotifications, markAsRead } = useNotifications();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Use mock data for development or real notifications from the hook
  const notifications = useMockData
    ? mockUrgentNotifications
    : realNotifications;

  // Filter for high priority/urgent notifications
  const urgentNotifications = notifications
    .filter(
      (notification) =>
        // Filter for urgent/high priority notifications (customize based on your notification types)
        notification.type.includes("URGENT") ||
        notification.type.includes("HIGH_PRIORITY") ||
        notification.type.includes("DEADLINE") ||
        notification.type.includes("OVERDUE") ||
        notification.type.includes("CRITICAL"),
    )
    .slice(0, maxNotifications);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  // Handle navigation to related project
  const handleNavigateToProject = (projectId?: number) => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  // Format date in standard format
  const formatDate = (date: Date): string => {
    return format(date, "MMM d, yyyy");
  };

  if (urgentNotifications.length === 0) {
    return null;
  }

  return (
    <div className={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Badge
              color="danger"
              content={urgentNotifications.length}
              placement="top-right"
              shape="circle"
              size="sm"
            >
              <BellIcon className="text-danger h-5 w-5" />
            </Badge>
            <h3 className="text-md font-medium text-foreground">
              {t("dashboard.urgentNotifications")}
            </h3>
          </div>
          {urgentNotifications.length > 0 && (
            <Button
              className="px-2 text-xs"
              color="primary"
              size="sm"
              variant="light"
              onClick={() =>
                urgentNotifications.forEach((n) => handleMarkAsRead(n.id))
              }
            >
              {t("nav.markAllRead")}
            </Button>
          )}
        </CardHeader>

        <Divider />

        <CardBody className="px-0 py-0">
          {urgentNotifications.length === 0 ? (
            <div className="p-4 text-center text-default-500 text-sm">
              {t("nav.noNotifications")}
            </div>
          ) : (
            <ScrollShadow hideScrollBar className="max-h-64" size={20}>
              {urgentNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider className="my-0" />}
                  <div
                    className="p-4 hover:bg-default-100 dark:hover:bg-default-50/10 transition-colors"
                    style={{
                      cursor: notification.projectId ? "pointer" : "default",
                    }}
                    onClick={() =>
                      notification.projectId &&
                      handleNavigateToProject(notification.projectId)
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-foreground mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-default-500">
                          {formatDate(new Date(notification.timestamp))}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Chip color="danger" size="sm" variant="flat">
                          {t("notifications.urgent")}
                        </Chip>
                        <Button
                          className="min-w-0 px-2 text-xs"
                          color="primary"
                          size="sm"
                          variant="light"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          {t("notifications.markAsRead")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </ScrollShadow>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default UrgentNotifications;
