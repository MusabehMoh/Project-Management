import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { useNavigate } from "react-router-dom";
import { PenTool, Clock, User, AlertCircle } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDraftRequirements } from "@/hooks/useDraftRequirements";

interface PendingRequirementsProps {
  className?: string;
}

export default function PendingRequirements({ 
  className = "" 
}: PendingRequirementsProps) {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { draftRequirements, loading, error, refresh, total } = useDraftRequirements();

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return t("priority.high") || "High";
      case "medium":
        return t("priority.medium") || "Medium";
      case "low":
        return t("priority.low") || "Low";
      default:
        return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleViewRequirement = (projectId: number, requirementId: number) => {
    navigate(`/requirements/${projectId}?highlightRequirement=${requirementId}&scrollTo=${requirementId}`);
  };

  const handleViewAllRequirements = () => {
    navigate("/requirements");
  };

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="flex items-center justify-center min-h-[200px]">
          <Spinner size="lg" />
          <p className="mt-3 text-default-500">
            {t("common.loading") || "Loading..."}
          </p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="flex items-center justify-center min-h-[200px] text-center">
          <AlertCircle className="w-8 h-8 text-danger mb-2" />
          <p className="font-medium text-foreground mb-2">
            {t("common.error") || "Error"}
          </p>
          <p className="text-sm text-default-500 mb-4">{error}</p>
          <Button size="sm" variant="flat" onPress={refresh}>
            {t("common.refresh") || "Refresh"}
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-default-600" />
            <h3 className="text-lg font-semibold text-foreground">
              {t("requirements.pendingRequirements") || "Pending Requirements"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" className="bg-warning-50 text-warning-600">
              {total}
            </Chip>
            {total > 0 && (
              <Button
                size="sm"
                variant="light"
                onPress={handleViewAllRequirements}
              >
                {t("common.viewAll") || "View All"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Divider className="bg-default-200" />

      <CardBody className="p-0">
        {draftRequirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PenTool className="w-12 h-12 text-default-300 mb-3" />
            <h4 className="font-medium text-foreground mb-1">
              {t("requirements.noDraftRequirements") || "No Draft Requirements"}
            </h4>
            <p className="text-sm text-default-500">
              {t("requirements.noDraftRequirementsDesc") || 
               "All requirements have been processed"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {draftRequirements.map((requirement) => (
              <div
                key={requirement.id}
                className="p-4 hover:bg-default-50 transition-colors cursor-pointer"
                onClick={() => handleViewRequirement(requirement.project.id, requirement.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm text-foreground truncate">
                        {requirement.name}
                      </h5>
                      <Chip
                        size="sm"
                        color={getPriorityColor(requirement.priority)}
                        variant="flat"
                      >
                        {getPriorityText(requirement.priority)}
                      </Chip>
                    </div>
                    
                    <p className="text-xs text-default-500 mb-2 line-clamp-2">
                      {requirement.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-default-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {requirement.project.applicationName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(requirement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      className="min-w-0 px-3"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleViewRequirement(requirement.project.id, requirement.id);
                      }}
                    >
                      {t("common.view") || "View"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}