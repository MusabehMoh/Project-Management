import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { GitPullRequest, Eye, MessageCircle, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

interface CodeReview {
  id: string;
  title: string;
  author: string;
  status: "pending" | "approved" | "changes-requested";
  createdAt: string;
  repository: string;
  priority: "low" | "medium" | "high" | "critical";
  linesChanged: number;
  comments: number;
}

interface PendingCodeReviewsProps {
  className?: string;
  useMockData?: boolean;
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "success";
    case "changes-requested":
      return "warning";
    case "pending":
      return "primary";
    default:
      return "default";
  }
};

export default function PendingCodeReviews({
  className = "",
  useMockData = true,
}: PendingCodeReviewsProps) {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);

  const mockReviews: CodeReview[] = [
    {
      id: "pr-1",
      title: "Add Stripe payment integration",
      author: "Ahmed Ali",
      status: "pending",
      createdAt: "2025-09-18T10:00:00Z",
      repository: "ecommerce-backend",
      priority: "critical",
      linesChanged: 150,
      comments: 3,
    },
    {
      id: "pr-2",
      title: "Fix user profile update bug",
      author: "Sara Hassan",
      status: "changes-requested",
      createdAt: "2025-09-18T08:30:00Z",
      repository: "user-service",
      priority: "high",
      linesChanged: 45,
      comments: 7,
    },
    {
      id: "pr-3",
      title: "Update API documentation",
      author: "Omar Khalil",
      status: "pending",
      createdAt: "2025-09-17T16:00:00Z",
      repository: "api-docs",
      priority: "medium",
      linesChanged: 20,
      comments: 1,
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (useMockData) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setReviews(mockReviews);
      }

      setLoading(false);
    };

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

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("developerDashboard.pendingReviews") || "Pending Code Reviews"}
            </h3>
            <Chip color="primary" size="sm" variant="flat">
              {reviews.filter((r) => r.status === "pending").length} pending
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border border-default-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GitPullRequest className="w-4 h-4 text-primary" />
                        <h4 className="font-medium text-sm text-foreground line-clamp-1">
                          {review.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-default-500">
                        <div className="flex items-center gap-1">
                          <Avatar
                            className="w-4 h-4"
                            name={review.author}
                            size="sm"
                          />
                          <span>{review.author}</span>
                        </div>
                        <span>{review.repository}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Chip
                        color={getPriorityColor(review.priority)}
                        size="sm"
                        variant="flat"
                      >
                        {review.priority}
                      </Chip>
                      <Chip
                        color={getStatusColor(review.status)}
                        size="sm"
                        variant="flat"
                      >
                        {review.status.replace("-", " ")}
                      </Chip>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-default-500">
                      <span>+{review.linesChanged} lines</span>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{review.comments} comments</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      startContent={<Eye className="w-3 h-3" />}
                      variant="flat"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <GitPullRequest className="h-12 w-12 text-success-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {t("developerDashboard.noReviews") || "No Pending Reviews"}
              </h4>
              <p className="text-sm text-default-500">
                {t("developerDashboard.allReviewsComplete") ||
                  "All code reviews are up to date"}
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
