import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Accordion, AccordionItem } from "@heroui/accordion";
import {
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useQuickActions } from "@/hooks/useQuickActions";

interface QuickActionsProps {
  autoRefresh?: boolean;
  className?: string;
  onEditProject?: (project: any) => void; // Add callback for editing projects
}

const QuickActions: React.FC<QuickActionsProps> = ({
  autoRefresh: _autoRefresh = true,
  className = "",
  onEditProject,
}) => {
  const { t, direction } = useLanguage();
  const {
    unassignedProjects,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    refresh,
  } = useQuickActions({
    autoRefresh: false, // Disable auto-refresh to prevent constant loading
    refreshInterval: 30000,
  });

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner color="default" size="md" />
          <p className="mt-3 text-default-500">{t("common.loading") || "Loading..."}</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-default-400 mx-auto mb-3" />
          <p className="font-medium text-foreground mb-2">{t("common.error") || "Error"}</p>
          <p className="text-sm text-default-500 mb-4">{error}</p>
          <Button
            size="sm"
            variant="flat"
            onPress={refresh}
          >
            {t("common.retry") || "Retry"}
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!hasActionsAvailable) {
    return null;
  }

  return (
    <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
      <CardHeader className="flex items-center justify-between pb-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {t("dashboard.myActions") || "My Actions"}
          </h3>
          <p className="text-sm text-default-500 mt-1">
            {t("dashboard.myActionsSubtitle") ||
              "Assign projects that need your attention"}
          </p>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-default-400 hover:text-default-600"
          disabled={refreshing}
          onPress={refresh}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>

      <Divider className="bg-default-200" />

      <CardBody className="p-6">
        {/* Action Buttons and Unassigned Projects */}
        <div className="space-y-4">
          {/* Unassigned Projects Accordion */}
          {unassignedProjects.length > 0 && (
            <Accordion variant="bordered" className="w-full">
              <AccordionItem
                key="unassigned-projects"
                aria-label={t("quickActions.unassignedProjects") || "Unassigned Projects"}
                title={
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-foreground">
                        {t("quickActions.unassignedProjects") || "Unassigned Projects"}
                      </div>
                    </div>
                    <Chip size="sm" variant="flat" className="bg-default-100 text-default-600">
                      {unassignedProjects.length}
                    </Chip>
                  </div>
                }
                className="border-default-200"
              >
                <div className="space-y-3 pt-2">
                  {unassignedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between gap-4 p-4 bg-default-50 rounded-lg border border-default-200 hover:bg-default-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {project.applicationName}
                        </h4>
                        <p className="text-sm text-default-500 truncate">
                          {project.owningUnit}
                        </p>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          className="min-w-fit"
                          onPress={() => onEditProject?.(project)}
                        >
                          {t("quickActions.assign") || "Assign"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default QuickActions;