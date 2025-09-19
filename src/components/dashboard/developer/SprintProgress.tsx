import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { Avatar } from "@heroui/avatar";
import { RefreshCw, Calendar, Clock, Target } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  progress: number;
  totalTasks: number;
  completedTasks: number;
  teamMembers: string[];
  goals: string[];
}

interface SprintProgressProps {
  className?: string;
  useMockData?: boolean;
}

export default function SprintProgress({
  className = "",
  useMockData = true,
}: SprintProgressProps) {
  const { t, language } = useLanguage();
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mockSprint: Sprint = {
    id: "sprint-2025-19",
    name: "Sprint 19 - Authentication & Security",
    startDate: "2025-09-16",
    endDate: "2025-09-30",
    status: "active",
    progress: 65,
    totalTasks: 12,
    completedTasks: 8,
    teamMembers: ["Ahmed Ali", "Sara Hassan", "Omar Khalil", "Fatima Nasser"],
    goals: [
      "Implement user authentication",
      "Add role-based permissions",
      "Security audit fixes",
    ],
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setCurrentSprint(mockSprint);
      }
    } catch (error) {
      console.error("Failed to fetch sprint data:", error);
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
        </CardBody>
      </Card>
    );
  }

  if (!currentSprint) {
    return (
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="text-center py-8">
          <p className="text-default-500">No active sprint found</p>
        </CardBody>
      </Card>
    );
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(currentSprint.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("developerDashboard.currentSprint") || "Current Sprint"}
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
          <div className="space-y-4">
            {/* Sprint Header */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                {currentSprint.name}
              </h4>
              <div className="flex items-center gap-4 text-sm text-default-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(currentSprint.startDate).toLocaleDateString()} -{" "}
                    {new Date(currentSprint.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{daysRemaining} days remaining</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Sprint Progress</span>
                <span>{currentSprint.progress}%</span>
              </div>
              <Progress
                color={currentSprint.progress >= 80 ? "success" : 
                       currentSprint.progress >= 60 ? "primary" : "warning"}
                size="sm"
                value={currentSprint.progress}
              />
              <div className="flex justify-between text-xs text-default-500 mt-1">
                <span>
                  {currentSprint.completedTasks} / {currentSprint.totalTasks} tasks
                </span>
                <span>
                  {currentSprint.totalTasks - currentSprint.completedTasks} remaining
                </span>
              </div>
            </div>

            {/* Team */}
            <div>
              <h5 className="text-sm font-medium mb-2">Team Members</h5>
              <div className="flex flex-wrap gap-2">
                {currentSprint.teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Avatar name={member} size="sm" className="w-6 h-6" />
                    <span className="text-xs">{member}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <h5 className="text-sm font-medium mb-2">Sprint Goals</h5>
              <div className="space-y-2">
                {currentSprint.goals.map((goal, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Target className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                    <span className="text-sm text-default-600">{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="pt-2">
              <Chip
                color={
                  currentSprint.status === "active"
                    ? "primary"
                    : currentSprint.status === "completed"
                    ? "success"
                    : "warning"
                }
                size="sm"
                variant="flat"
              >
                {t(`sprint.status.${currentSprint.status}`) || currentSprint.status}
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}