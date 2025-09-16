import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Accordion, AccordionItem } from "@heroui/accordion";
import {
  RefreshCw,
  Plus,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3,
  FileText,
  Clock,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useQuickActions } from "@/hooks/useQuickActions";
import { QuickAction } from "@/types/quickActions";

// Icon mapping for different action types
const iconMap = {
  plus: Plus,
  "document-check": FileText,
  "user-plus": Users,
  "check-circle": CheckCircle,
  "exclamation-triangle": AlertTriangle,
  "chart-bar": BarChart3,
  users: Users,
  "chart-line": BarChart3,
};

interface QuickActionButtonProps {
  action: QuickAction;
  onClick: () => void;
  isCompact?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  action,
  onClick,
  isCompact = false,
}) => {
  const { t } = useLanguage();
  const IconComponent = iconMap[action.icon as keyof typeof iconMap] || Plus;

  return (
    <Button
      className={`${
        isCompact ? "h-12" : "h-16"
      } justify-start gap-3 p-4 bg-default-50 border border-default-200 hover:bg-default-100 transition-colors`}
      disabled={action.isDisabled}
      size={isCompact ? "sm" : "md"}
      variant="light"
      onPress={onClick}
    >
      <div className="flex items-center gap-3 w-full">
        <IconComponent className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} flex-shrink-0 text-default-600`} />
        <div className="flex-1 text-left">
          <div className={`font-medium text-foreground ${isCompact ? "text-sm" : ""}`}>
            {t(action.title) || action.title}
          </div>
          {!isCompact && (
            <div className="text-xs text-default-500 mt-1">
              {t(action.description) || action.description}
            </div>
          )}
        </div>
        {action.count && action.count > 0 && (
          <Chip
            className="bg-default-200 text-default-700"
            size="sm"
            variant="flat"
          >
            {action.count}
          </Chip>
        )}
      </div>
    </Button>
  );
};

interface QuickActionsProps {
  maxActions?: number;
  showStats?: boolean;
  isCompact?: boolean;
  autoRefresh?: boolean;
  className?: string;
  onEditProject?: (project: any) => void; // Add callback for editing projects
}

const QuickActions: React.FC<QuickActionsProps> = ({
  maxActions = 6,
  showStats = true,
  isCompact = false,
  autoRefresh: _autoRefresh = true,
  className = "",
  onEditProject,
}) => {
  const { t, language } = useLanguage();
  const {
    actions,
    stats,
    unassignedProjects,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    priorityActions,
    refresh,
    handleAction,
  } = useQuickActions({
    autoRefresh: false, // Disable auto-refresh to prevent constant loading
    refreshInterval: 30000,
  });

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner color="default" size="md" />
          <p className="mt-3 text-default-500">Loading actions...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm">
        <CardBody className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-default-400 mx-auto mb-3" />
          <p className="font-medium text-foreground mb-2">Unable to load actions</p>
          <p className="text-sm text-default-500 mb-4">{error}</p>
          <Button
            size="sm"
            variant="flat"
            onPress={refresh}
          >
            Try Again
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!hasActionsAvailable) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm">
        <CardBody className="text-center py-6">
          <CheckCircle className="h-8 w-8 text-default-400 mx-auto mb-3" />
          <p className="font-medium text-foreground mb-2">All caught up!</p>
          <p className="text-sm text-default-500">
            No pending actions require your attention.
          </p>
        </CardBody>
      </Card>
    );
  }

  // Display actions (prioritize high priority actions)
  const displayActions = [
    ...priorityActions,
    ...actions.filter((action) => action.priority !== "high"),
  ].slice(0, maxActions);

  return (
    <Card className={`${className} border-default-200`} shadow="sm">
      <CardHeader className="flex items-center justify-between pb-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {t("dashboard.quickActions") || "Quick Actions"}
          </h3>
          <p className="text-sm text-default-500 mt-1">
            {t("dashboard.quickActionsSubtitle") ||
              "Take action on items that need your attention"}
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
        {/* Quick Stats */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-default-50 rounded-lg border border-default-200">
              <div className="text-xl font-bold text-foreground">
                {stats.activeProjects}
              </div>
              <div className="text-xs text-default-500 mt-1">Active Projects</div>
            </div>
            <div className="text-center p-4 bg-default-50 rounded-lg border border-default-200">
              <div className="text-xl font-bold text-foreground">
                {stats.pendingRequirements}
              </div>
              <div className="text-xs text-default-500 mt-1">Pending Reviews</div>
            </div>
            <div className="text-center p-4 bg-default-50 rounded-lg border border-default-200">
              <div className="text-xl font-bold text-foreground">
                {stats.overdueItems}
              </div>
              <div className="text-xs text-default-500 mt-1">Overdue Items</div>
            </div>
            <div className="text-center p-4 bg-default-50 rounded-lg border border-default-200">
              <div className="text-xl font-bold text-foreground">
                {stats.unassignedTasks}
              </div>
              <div className="text-xs text-default-500 mt-1">Unassigned Tasks</div>
            </div>
          </div>
        )}

        {/* Action Buttons and Unassigned Projects */}
        <div className="space-y-4">
          {/* Regular Action Buttons */}
          <div className={`grid gap-3 ${
            isCompact
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 lg:grid-cols-2"
          }`}>
            {displayActions.map((action) => (
              <QuickActionButton
                key={action.id}
                action={action}
                isCompact={isCompact}
                onClick={() => handleAction(action)}
              />
            ))}
          </div>

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
                      className="flex items-center justify-between p-4 bg-default-50 rounded-lg border border-default-200 hover:bg-default-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {project.applicationName}
                        </h4>
                        <p className="text-sm text-default-500 truncate">
                          {project.owningUnit}
                        </p>
                      </div>
                      <div className="ml-4">
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

        {/* Show more actions hint */}
        {actions.length > maxActions && (
          <div className="text-center mt-4">
            <p className="text-sm text-default-500">
              {actions.length - maxActions} more actions available
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default QuickActions;