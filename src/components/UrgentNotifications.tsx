import React, { useState } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
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
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Badge color="danger" content={urgentNotifications.length} size="sm">
              <div className="w-5 h-5" />
            </Badge>
            <h3 className="text-md font-medium text-foreground">{t("dashboard.urgentNotifications")}</h3>
          </div>
          {urgentNotifications.length > 0 && (
            <Button 
              size="sm" 
              variant="flat"
              color="danger"
              className="px-2 text-xs"
              onClick={() => urgentNotifications.forEach(n => handleMarkAsRead(n.id))}
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
            <ScrollShadow hideScrollBar size={20} className="max-h-64">
              {urgentNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider className="my-0" />}
                  <div 
                    className="p-4 hover:bg-default-100 dark:hover:bg-default-50/10 transition-colors"
                    style={{ cursor: notification.projectId ? 'pointer' : 'default' }}
                    onClick={() => notification.projectId && handleNavigateToProject(notification.projectId)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-foreground mb-1">{notification.message}</p>
                        <p className="text-xs text-default-500">{formatDate(new Date(notification.timestamp))}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Chip size="sm" color="danger" variant="flat">
                          {t("notifications.urgent")}
                        </Chip>
                        <Button 
                          size="sm" 
                          variant="solid" 
                          color="default"
                          className="min-w-0 px-2 text-xs"
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
