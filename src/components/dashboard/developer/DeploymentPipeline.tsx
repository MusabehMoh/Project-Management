import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import {
  RefreshCw,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

interface DeploymentStage {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  items: DeploymentItem[];
}

interface DeploymentItem {
  id: string;
  name: string;
  type: "feature" | "bugfix" | "hotfix" | "release";
  status: "pending" | "in-progress" | "completed" | "failed";
  assignedTo: string[];
  progress: number;
  branch: string;
  lastUpdate: string;
  estimatedTime: string;
}

interface DeploymentPipelineProps {
  className?: string;
  useMockData?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "in-progress":
      return "primary";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "feature":
      return <Zap className="w-3 h-3" />;
    case "bugfix":
      return <AlertCircle className="w-3 h-3" />;
    case "hotfix":
      return <AlertCircle className="w-3 h-3 text-danger" />;
    case "release":
      return <CheckCircle className="w-3 h-3" />;
    default:
      return <GitBranch className="w-3 h-3" />;
  }
};

export default function DeploymentPipeline({
  className = "",
  useMockData = true,
}: DeploymentPipelineProps) {
  const { t, language } = useLanguage();
  const [stages, setStages] = useState<DeploymentStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const mockStages: DeploymentStage[] = [
    {
      id: "development",
      name: "Development",
      status: "completed",
      items: [
        {
          id: "1",
          name: "User Authentication System",
          type: "feature",
          status: "completed",
          assignedTo: ["Ahmed Ali", "Sara Hassan"],
          progress: 100,
          branch: "feature/auth-system",
          lastUpdate: "2025-09-18T14:00:00Z",
          estimatedTime: "2 days",
        },
        {
          id: "2",
          name: "Payment Gateway Integration",
          type: "feature",
          status: "in-progress",
          assignedTo: ["Omar Khalil"],
          progress: 75,
          branch: "feature/payment-gateway",
          lastUpdate: "2025-09-18T12:00:00Z",
          estimatedTime: "1 day",
        },
      ],
    },
    {
      id: "testing",
      name: "Testing",
      status: "in-progress",
      items: [
        {
          id: "3",
          name: "API Unit Tests",
          type: "feature",
          status: "in-progress",
          assignedTo: ["Fatima Nasser"],
          progress: 60,
          branch: "test/api-unit-tests",
          lastUpdate: "2025-09-18T10:00:00Z",
          estimatedTime: "3 hours",
        },
        {
          id: "4",
          name: "Cart Bug Fix",
          type: "bugfix",
          status: "pending",
          assignedTo: [],
          progress: 0,
          branch: "bugfix/cart-calculation",
          lastUpdate: "2025-09-18T09:00:00Z",
          estimatedTime: "4 hours",
        },
      ],
    },
    {
      id: "staging",
      name: "Staging",
      status: "pending",
      items: [
        {
          id: "5",
          name: "v2.1.0 Release Candidate",
          type: "release",
          status: "pending",
          assignedTo: ["DevOps Team"],
          progress: 0,
          branch: "release/v2.1.0",
          lastUpdate: "2025-09-17T16:00:00Z",
          estimatedTime: "6 hours",
        },
      ],
    },
    {
      id: "production",
      name: "Production",
      status: "completed",
      items: [
        {
          id: "6",
          name: "v2.0.3 Hotfix",
          type: "hotfix",
          status: "completed",
          assignedTo: ["Ahmed Ali"],
          progress: 100,
          branch: "hotfix/v2.0.3",
          lastUpdate: "2025-09-17T20:00:00Z",
          estimatedTime: "30 minutes",
        },
      ],
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStages(mockStages);
      }
    } catch (error) {
      console.error("Failed to fetch deployment pipeline:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [useMockData]);

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">
            {t("developerDashboard.loadingPipeline") ||
              "Loading deployment pipeline..."}
          </p>
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
              {t("developerDashboard.deploymentPipeline") ||
                "Deployment Pipeline"}
            </h3>
            <Button
              isIconOnly
              isLoading={refreshing}
              size="sm"
              variant="ghost"
              onPress={refresh}
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative">
                {/* Stage Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stage.status === "completed"
                        ? "bg-success text-success-foreground"
                        : stage.status === "in-progress"
                          ? "bg-primary text-primary-foreground"
                          : stage.status === "failed"
                            ? "bg-danger text-danger-foreground"
                            : "bg-default-200 text-default-500"
                    }`}
                  >
                    {stage.status === "completed" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : stage.status === "in-progress" ? (
                      <Clock className="w-4 h-4" />
                    ) : stage.status === "failed" ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-foreground">
                    {stage.name}
                  </h4>
                  <Chip
                    color={getStatusColor(stage.status)}
                    size="sm"
                    variant="flat"
                  >
                    {t(`deployment.status.${stage.status}`) || stage.status}
                  </Chip>
                </div>

                {/* Stage Items */}
                <div className="ml-11 space-y-3">
                  {stage.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-default-200 rounded-lg bg-default-50 dark:bg-default-100/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(item.type)}
                            <h5 className="font-medium text-foreground">
                              {item.name}
                            </h5>
                            <Chip
                              color={getStatusColor(item.status)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`deployment.status.${item.status}`) ||
                                item.status}
                            </Chip>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-default-500 mb-3">
                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              <span>{item.branch}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{item.estimatedTime}</span>
                            </div>
                          </div>

                          {item.status === "in-progress" && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{item.progress}%</span>
                              </div>
                              <Progress
                                color="primary"
                                size="sm"
                                value={item.progress}
                              />
                            </div>
                          )}

                          {item.assignedTo.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-default-500">
                                Assigned to:
                              </span>
                              <AvatarGroup max={3} size="sm">
                                {item.assignedTo.map((assignee, idx) => (
                                  <Tooltip key={idx} content={assignee}>
                                    <Avatar
                                      className="w-6 h-6"
                                      name={assignee}
                                      size="sm"
                                    />
                                  </Tooltip>
                                ))}
                              </AvatarGroup>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Arrow between stages */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center my-4">
                    <ArrowRight className="w-5 h-5 text-default-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
