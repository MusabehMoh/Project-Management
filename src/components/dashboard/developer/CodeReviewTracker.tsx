import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { RefreshCw, Code, AlertCircle, CheckCircle, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

interface CodeReviewMetrics {
  totalReviews: number;
  pendingReviews: number;
  averageReviewTime: number;
  approvalRate: number;
  reviewsThisWeek: number;
  criticalReviews: number;
}

interface CodeReviewTrackerProps {
  className?: string;
  useMockData?: boolean;
}

export default function CodeReviewTracker({
  className = "",
  useMockData = true,
}: CodeReviewTrackerProps) {
  const { t, language } = useLanguage();
  const [metrics, setMetrics] = useState<CodeReviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mockMetrics: CodeReviewMetrics = {
    totalReviews: 45,
    pendingReviews: 8,
    averageReviewTime: 2.5,
    approvalRate: 85,
    reviewsThisWeek: 12,
    criticalReviews: 3,
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setMetrics(mockMetrics);
      }
    } catch (error) {
      console.error("Failed to fetch code review metrics:", error);
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

  if (!metrics) return null;

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("developerDashboard.codeReviews") || "Code Reviews"}
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
          <div className="space-y-4">
            {/* Approval Rate */}
            <div className="p-4 bg-default-50 dark:bg-default-100/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Approval Rate</span>
                <span className="text-sm text-default-500">
                  {metrics.approvalRate}%
                </span>
              </div>
              <Progress
                color={metrics.approvalRate >= 80 ? "success" : "warning"}
                size="sm"
                value={metrics.approvalRate}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs text-default-500">Avg Time</span>
                </div>
                <div className="text-lg font-bold text-primary">
                  {metrics.averageReviewTime}h
                </div>
              </div>

              <div className="text-center p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs text-default-500">This Week</span>
                </div>
                <div className="text-lg font-bold text-success">
                  {metrics.reviewsThisWeek}
                </div>
              </div>
            </div>

            {/* Review Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-default-500" />
                  <span className="text-sm">Total Reviews</span>
                </div>
                <Chip size="sm" variant="flat">
                  {metrics.totalReviews}
                </Chip>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-sm">Pending</span>
                </div>
                <Chip color="warning" size="sm" variant="flat">
                  {metrics.pendingReviews}
                </Chip>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger" />
                  <span className="text-sm">Critical</span>
                </div>
                <Chip color="danger" size="sm" variant="flat">
                  {metrics.criticalReviews}
                </Chip>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
