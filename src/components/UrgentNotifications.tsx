import React, { useState } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { mockUrgentNotifications } from "@/utils/mockNotifications";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface UrgentNotificationProps {
  maxNotifications?: number;
  useMockData?: boolean;
}

export const UrgentNotifications: React.FC<UrgentNotificationProps> = ({
  maxNotifications = 3,
  useMockData = true // Set to true for development, should be false in production
}) => {
  const { notifications: realNotifications, markAsRead } = useNotifications();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Use mock data for development or real notifications from the hook
  const notifications = useMockData ? mockUrgentNotifications : realNotifications;

  // Filter for high priority/urgent notifications
  const urgentNotifications = notifications
    .filter(notification => 
      // Filter for urgent/high priority notifications (customize based on your notification types)
      (notification.type.includes("URGENT") || 
       notification.type.includes("HIGH_PRIORITY") ||
       notification.type.includes("DEADLINE") ||
       notification.type.includes("OVERDUE") ||
       notification.type.includes("CRITICAL"))
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
    <div className={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full shadow-sm overflow-hidden">
        <CardHeader className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 py-2">
          <div className="flex items-center gap-2">
            <Badge color="danger" content={urgentNotifications.length} size="sm">
              <div className="w-5 h-5" />
            </Badge>
            <h3 className="text-md font-medium">{t("dashboard.urgentNotifications")}</h3>
          </div>
          {urgentNotifications.length > 0 && (
            <Button 
              size="sm" 
              variant="light"
              color="primary"
              onClick={() => urgentNotifications.forEach(n => handleMarkAsRead(n.id))}
            >
              {t("nav.markAllRead")}
            </Button>
          )}
        </CardHeader>
        
        <CardBody className="px-0 py-0">
          {urgentNotifications.length === 0 ? (
            <div className="p-3 text-center text-default-500 text-sm">
              {t("nav.noNotifications")}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {urgentNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider className="my-0" />}
                  <div 
                    className="p-3 hover:bg-default-100 dark:hover:bg-default-50/10 transition-colors cursor-pointer"
                    onClick={() => notification.projectId && handleNavigateToProject(notification.projectId)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <Chip size="sm" color="warning" variant="dot" className="ml-2 shrink-0">
                        {t("notifications.urgent")}
                      </Chip>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-default-500">{formatDate(new Date(notification.timestamp))}</p>
                      <Button 
                        size="sm" 
                        variant="light" 
                        color="default"
                        className="min-w-0 h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        {t("notifications.markAsRead")}
                      </Button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default UrgentNotifications;
