import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import {
  RefreshCw,
  User,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  developerWorkloadService,
  type DeveloperWorkload,
  type TeamPerformanceMetrics,
} from "@/services/api/developerWorkloadService";

interface DeveloperWorkloadPerformanceProps {
  className?: string;
  useMockData?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "success";
    case "busy":
      return "warning";
    case "blocked":
      return "danger";
    case "on-leave":
      return "default";
    default:
      return "default";
  }
};

const getEfficiencyColor = (efficiency: number) => {
  if (efficiency >= 85) return "success";
  if (efficiency >= 70) return "warning";
  return "danger";
};

export default function DeveloperWorkloadPerformance({
  className = "",
  useMockData = false,
}: DeveloperWorkloadPerformanceProps) {
  const { t, language } = useLanguage();
  const [developers, setDevelopers] = useState<DeveloperWorkload[]>([]);
  const [metrics, setMetrics] = useState<TeamPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockDevelopers: DeveloperWorkload[] = [
    {
      developerId: "1",
      developerName: "Ahmed Ali",
      currentTasks: 5,
      completedTasks: 28,
      averageTaskTime: 6.5,
      efficiency: 92,
      workloadPercentage: 85,
      skills: ["React", "Node.js", "TypeScript"],
      currentProjects: ["E-Commerce", "Admin Panel"],
      availableHours: 6,
      status: "available",
    },
    {
      developerId: "2",
      developerName: "Sara Hassan",
      currentTasks: 7,
      completedTasks: 35,
      averageTaskTime: 5.8,
      efficiency: 88,
      workloadPercentage: 95,
      skills: ["Vue.js", "Python", "PostgreSQL"],
      currentProjects: ["API Gateway", "Data Analytics"],
      availableHours: 2,
      status: "busy",
    },
    {
      developerId: "3",
      developerName: "Omar Khalil",
      currentTasks: 3,
      completedTasks: 22,
      averageTaskTime: 7.2,
      efficiency: 76,
      workloadPercentage: 60,
      skills: ["Angular", "Java", "MongoDB"],
      currentProjects: ["Mobile App"],
      availableHours: 16,
      status: "available",
    },
    {
      developerId: "4",
      developerName: "Fatima Nasser",
      currentTasks: 4,
      completedTasks: 31,
      averageTaskTime: 5.5,
      efficiency: 90,
      workloadPercentage: 70,
      skills: ["React", "C#", ".NET"],
      currentProjects: ["CRM System"],
      availableHours: 12,
      status: "available",
    },
  ];

  const mockMetrics: TeamPerformanceMetrics = {
    totalDevelopers: 4,
    activeDevelopers: 4,
    averageEfficiency: 86.5,
    totalTasksCompleted: 116,
    totalTasksInProgress: 19,
    averageTaskCompletionTime: 6.25,
    codeReviewsCompleted: 45,
    averageReviewTime: 2.5,
    bugsFixed: 23,
    featuresDelivered: 18,
  };

  const fetchData = async () => {
    try {
      setError(null);
      
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDevelopers(mockDevelopers);
        setMetrics(mockMetrics);
      } else {
        const data = await developerWorkloadService.getWorkloadData();
        setDevelopers(data.developers);
        setMetrics(data.metrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workload data");
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
            {t("developerDashboard.loadingWorkload") || "Loading workload data..."}
          </p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">
              {t("common.error") || "Error"}
            </p>
            <p className="text-sm text-default-500 mb-4">{error}</p>
            <Button size="sm" variant="flat" onPress={refresh}>
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
              {t("developerDashboard.teamPerformance") || "Team Performance"}
            </h3>
            <Button
              isIconOnly
              isLoading={refreshing}
              size="sm"
              variant="ghost"
              onPress={refresh}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {/* Team Metrics Summary */}
          {metrics && (
            <div className="mb-6 p-4 bg-default-50 dark:bg-default-100/50 rounded-lg border border-default-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {metrics.averageEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-xs text-default-500">
                    {t("developerDashboard.avgEfficiency") || "Avg Efficiency"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {metrics.totalTasksCompleted}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("developerDashboard.tasksCompleted") || "Tasks Completed"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {metrics.averageTaskCompletionTime.toFixed(1)}h
                  </div>
                  <div className="text-xs text-default-500">
                    {t("developerDashboard.avgTaskTime") || "Avg Task Time"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {metrics.codeReviewsCompleted}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("developerDashboard.reviewsCompleted") || "Reviews Done"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Developers Table */}
          <Table removeWrapper aria-label="Developer workload performance">
            <TableHeader>
              <TableColumn>{t("developerDashboard.developer") || "Developer"}</TableColumn>
              <TableColumn>{t("developerDashboard.workload") || "Workload"}</TableColumn>
              <TableColumn>{t("developerDashboard.efficiency") || "Efficiency"}</TableColumn>
              <TableColumn>{t("developerDashboard.currentTasks") || "Tasks"}</TableColumn>
              <TableColumn>{t("developerDashboard.status") || "Status"}</TableColumn>
            </TableHeader>
            <TableBody>
              {developers.map((developer) => (
                <TableRow key={developer.developerId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={developer.developerName}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {developer.developerName}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {developer.skills.slice(0, 2).map((skill) => (
                            <Chip
                              key={skill}
                              size="sm"
                              variant="flat"
                              className="text-xs"
                            >
                              {skill}
                            </Chip>
                          ))}
                          {developer.skills.length > 2 && (
                            <Tooltip
                              content={developer.skills.slice(2).join(", ")}
                            >
                              <Chip size="sm" variant="flat" className="text-xs">
                                +{developer.skills.length - 2}
                              </Chip>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Progress
                        color={developer.workloadPercentage > 90 ? "danger" : 
                               developer.workloadPercentage > 75 ? "warning" : "success"}
                        size="sm"
                        value={developer.workloadPercentage}
                      />
                      <span className="text-xs text-default-500">
                        {developer.workloadPercentage}% • {developer.availableHours}h available
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {developer.efficiency >= 85 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-danger" />
                        )}
                        <span
                          className={`font-medium text-sm ${
                            developer.efficiency >= 85
                              ? "text-success"
                              : developer.efficiency >= 70
                              ? "text-warning"
                              : "text-danger"
                          }`}
                        >
                          {developer.efficiency}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-default-400" />
                        <span className="text-sm">{developer.currentTasks}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="text-sm text-success">
                          {developer.completedTasks}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(developer.status)}
                      size="sm"
                      variant="flat"
                    >
                      {t(`developerDashboard.status.${developer.status}`) || 
                       developer.status.replace("-", " ")}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}