import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Avatar } from "@heroui/avatar";
import { Select, SelectItem } from "@heroui/select";
import { Badge } from "@heroui/badge";
import {
  Code,
  GitPullRequest,
  Bug,
  Settings,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  developerQuickActionsService,
  type DeveloperQuickAction,
} from "@/services/api/developerQuickActionsService";

interface DeveloperQuickActionsProps {
  autoRefresh?: boolean;
  onAssignDeveloper?: (task: any, developerId: string) => void;
  onAssignReviewer?: (pullRequest: any, reviewerId: string) => void;
  className?: string;
}

// Mock developers data (in real app, this would come from API)
const mockDevelopers = [
  { id: "1", name: "Ahmed Ali", skills: ["React", "Node.js"], status: "available" },
  { id: "2", name: "Sara Hassan", skills: ["Vue", "Python"], status: "busy" },
  { id: "3", name: "Omar Khalil", skills: ["Angular", "Java"], status: "available" },
  { id: "4", name: "Fatima Nasser", skills: ["React", "C#"], status: "available" },
];

const getActionIcon = (type: string) => {
  switch (type) {
    case "task_assignment":
      return <Code className="w-4 h-4" />;
    case "code_review":
      return <GitPullRequest className="w-4 h-4" />;
    case "bug_fix":
      return <Bug className="w-4 h-4" />;
    case "deployment":
      return <Settings className="w-4 h-4" />;
    default:
      return <Code className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "primary";
    case "low":
      return "success";
    default:
      return "default";
  }
};

export default function DeveloperQuickActions({
  autoRefresh = false,
  onAssignDeveloper,
  onAssignReviewer,
  className = "",
}: DeveloperQuickActionsProps) {
  const { t, language } = useLanguage();
  const [actions, setActions] = useState<DeveloperQuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockActions: DeveloperQuickAction[] = [
    {
      id: "1",
      type: "task_assignment",
      title: "Implement user authentication",
      description: "Create login/logout functionality with JWT",
      priority: "high",
      status: "pending",
      dueDate: "2025-09-25",
      project: "E-Commerce Platform",
      estimatedTime: "8 hours",
      createdAt: "2025-09-18T09:00:00Z",
      data: {
        task: {
          id: "t1",
          title: "Implement user authentication",
          description: "Create login/logout functionality with JWT",
          priority: "high",
          status: "todo",
          assigneeId: "",
          assigneeName: "",
          projectId: "p1",
          projectName: "E-Commerce Platform",
          estimatedHours: 8,
          actualHours: 0,
          dueDate: "2025-09-25",
          createdAt: "2025-09-18T09:00:00Z",
          updatedAt: "2025-09-18T09:00:00Z",
          type: "feature",
          complexity: "medium",
          tags: ["authentication", "security"],
        },
      },
    },
    {
      id: "2",
      type: "code_review",
      title: "Review payment gateway integration",
      description: "Code review for Stripe payment integration PR",
      priority: "critical",
      status: "pending",
      dueDate: "2025-09-20",
      project: "E-Commerce Platform",
      estimatedTime: "2 hours",
      createdAt: "2025-09-18T10:00:00Z",
      data: {
        pullRequest: {
          id: "pr1",
          title: "Add Stripe payment integration",
          description: "Integrate Stripe for payment processing",
          author: "Ahmed Ali",
          authorId: "1",
          reviewers: [],
          status: "open",
          createdAt: "2025-09-18T10:00:00Z",
          updatedAt: "2025-09-18T10:00:00Z",
          repository: "ecommerce-backend",
          branch: "feature/stripe-integration",
          targetBranch: "main",
          linesAdded: 150,
          linesDeleted: 20,
          filesChanged: 8,
          comments: 3,
          priority: "critical",
        },
      },
    },
    {
      id: "3",
      type: "bug_fix",
      title: "Fix checkout cart calculation bug",
      description: "Cart total calculation is incorrect for discounts",
      priority: "high",
      status: "pending",
      dueDate: "2025-09-22",
      project: "E-Commerce Platform",
      estimatedTime: "4 hours",
      createdAt: "2025-09-18T11:00:00Z",
      data: {
        task: {
          id: "t2",
          title: "Fix checkout cart calculation bug",
          description: "Cart total calculation is incorrect for discounts",
          priority: "high",
          status: "todo",
          assigneeId: "",
          assigneeName: "",
          projectId: "p1",
          projectName: "E-Commerce Platform",
          estimatedHours: 4,
          actualHours: 0,
          dueDate: "2025-09-22",
          createdAt: "2025-09-18T11:00:00Z",
          updatedAt: "2025-09-18T11:00:00Z",
          type: "bug",
          complexity: "simple",
          tags: ["checkout", "calculation"],
        },
      },
    },
  ];

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActions(mockActions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch actions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchActions, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleAssignment = (action: DeveloperQuickAction, assigneeId: string) => {
    if (action.type === "task_assignment" || action.type === "bug_fix") {
      onAssignDeveloper?.(action.data.task, assigneeId);
    } else if (action.type === "code_review") {
      onAssignReviewer?.(action.data.pullRequest, assigneeId);
    }
  };

  if (loading) {
    return (
      <Card className={`${className} w-full`}>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">
            {t("developerDashboard.loadingActions") || "Loading developer actions..."}
          </p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} w-full`}>
        <CardBody className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">
              {t("common.error") || "Error"}
            </p>
            <p className="text-sm text-default-500 mb-4">{error}</p>
            <Button size="sm" variant="flat" onPress={fetchActions}>
              {t("common.retry") || "Retry"}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("developerDashboard.quickActions") || "Developer Quick Actions"}
            </h3>
            <Badge
              color="primary"
              content={actions.filter(a => a.status === "pending").length}
              isInvisible={actions.filter(a => a.status === "pending").length === 0}
            >
              <Chip size="sm" variant="flat">
                {actions.length} {t("developerDashboard.totalActions") || "Total Actions"}
              </Chip>
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          {actions.length > 0 ? (
            <Table removeWrapper aria-label="Developer quick actions table">
              <TableHeader>
                <TableColumn>{t("developerDashboard.action") || "Action"}</TableColumn>
                <TableColumn>{t("developerDashboard.priority") || "Priority"}</TableColumn>
                <TableColumn>{t("developerDashboard.project") || "Project"}</TableColumn>
                <TableColumn>{t("developerDashboard.dueDate") || "Due Date"}</TableColumn>
                <TableColumn>{t("developerDashboard.assign") || "Assign"}</TableColumn>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActionIcon(action.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {action.title}
                          </p>
                          <p className="text-xs text-default-500 mt-1 line-clamp-2">
                            {action.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-default-400" />
                            <span className="text-xs text-default-500">
                              {action.estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getPriorityColor(action.priority)}
                        size="sm"
                        variant="flat"
                      >
                        {t(`priority.${action.priority}`) || action.priority}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-600">
                        {action.project}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-600">
                        {new Date(action.dueDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        placeholder={t("developerDashboard.selectDeveloper") || "Select Developer"}
                        size="sm"
                        className="w-40"
                        onSelectionChange={(key) => {
                          if (key) {
                            handleAssignment(action, String(key));
                          }
                        }}
                      >
                        {mockDevelopers
                          .filter(dev => dev.status === "available")
                          .map((developer) => (
                            <SelectItem
                              key={developer.id}
                              textValue={developer.name}
                              startContent={
                                <Avatar
                                  size="sm"
                                  name={developer.name}
                                  className="w-5 h-5"
                                />
                              }
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{developer.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Code className="h-12 w-12 text-success-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {t("developerDashboard.noActions") || "No Pending Actions"}
              </h4>
              <p className="text-sm text-default-500">
                {t("developerDashboard.allCaughtUp") || "All development tasks are up to date"}
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}