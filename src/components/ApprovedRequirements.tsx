import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, User, AlertCircle } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useApprovedRequirements } from "@/hooks/useApprovedRequirements";

interface ApprovedRequirementsProps {
  className?: string;
}

export default function ApprovedRequirements({ 
  className = "" 
}: ApprovedRequirementsProps) {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  
  const { 
    requirements, 
    loading, 
    error, 
    refresh,
    totalCount 
  } = useApprovedRequirements({
    limit: 5,
    autoRefresh: true
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return t("priority.high");
      case "medium":
        return t("priority.medium");
      case "low":
        return t("priority.low");
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
    navigate(`/development-requirements?highlightRequirement=${requirementId}&scrollTo=${requirementId}`);
  };

  const handleViewAllRequirements = () => {
    navigate("/development-requirements");
  };

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="flex items-center justify-center min-h-[200px]">
          <Spinner size="lg" />
          <p className="mt-3 text-default-500">
            {t("common.loading")}
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
            {t("common.error")}
          </p>
          <p className="text-sm text-default-500 mb-4">{error}</p>
          <Button size="sm" variant="flat" onPress={refresh}>
            {t("common.refresh")}
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
            <CheckCircle className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">
              {t("developerDashboard.approvedRequirements")}
            </h3>
            <Chip size="sm" color="success" variant="flat">
              {totalCount}
            </Chip>
          </div>
          <Button
            size="sm"
            variant="light"
            color="primary"
            onPress={handleViewAllRequirements}
            className="text-xs"
          >
            {t("common.viewAll")}
          </Button>
        </div>
      </CardHeader>
      
      <CardBody className="pt-0">
        {requirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-12 h-12 text-default-300 mb-3" />
            <p className="text-default-500 text-center">
              {t("developerDashboard.noApprovedRequirements")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((requirement, index) => (
              <div key={requirement.id}>
                <div 
                  className="flex items-start justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors cursor-pointer"
                  onClick={() => handleViewRequirement(requirement.project?.id || 0, requirement.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground truncate">
                        {requirement.name}
                      </p>
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
                          {requirement.project?.applicationName || t("common.unknownProject")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(requirement.expectedCompletionDate)}</span>
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
                        handleViewRequirement(requirement.project?.id || 0, requirement.id);
                      }}
                    >
                      {t("common.view")}
                    </Button>
                  </div>
                </div>
                
                {index < requirements.length - 1 && <Divider className="my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}