import type {
  ProjectRequirement,
  AssignedProject,
} from "@/types/projectRequirement";

import React, { useState } from "react";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
// ...existing code...
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
// modal removed
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import {
  Search,
  Calendar,
  Code,
} from "lucide-react";
import { RefreshIcon } from "@/components/icons";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevelopmentRequirements } from "@/hooks/useDevelopmentRequirements";

import { GlobalPagination } from "@/components/GlobalPagination";

// RequirementCard component
const RequirementCard = ({ requirement }: { requirement: ProjectRequirement }) => {
  const { t } = useLanguage();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "in_development":
      case "in-development":
        return "secondary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {requirement.name}
            </h3>
            <p className="text-sm text-default-500 line-clamp-2 mt-1">
              {requirement.project?.applicationName || "N/A"}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <Chip
              color={getPriorityColor(requirement.priority)}
              size="sm"
              variant="flat"
            >
              {t(`requirements.${requirement.priority}`)}
            </Chip>
            <Chip
              color={getStatusColor(requirement.status)}
              size="sm"
              variant="flat"
            >
              {t(`requirements.${requirement.status.replace("-", "")}`)}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <div className="space-y-4">
          <div className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg">
            <p className="text-sm line-clamp-4">{requirement.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-default-400" />
            <span className="text-sm">
              {formatDate(requirement.expectedCompletionDate)}
            </span>
          </div>

          {/* actions removed */}
        </div>
      </CardBody>
    </Card>
  );
};

// Form data type for editing requirements
interface RequirementFormData {
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "in_development" | "completed";
}

export default function DevelopmentRequirementsPage() {
  const { t } = useLanguage();
  
  // Grid-only view

  const {
    requirements,
    loading,
    error,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
  // updateRequirement, deleteRequirement removed (read-only grid)
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    clearError,
    refreshData,
    projects,
    setProjectFilter,
  } = useDevelopmentRequirements({
    pageSize: 20,
  });

  // edit/delete removed; grid is read-only

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // Update filters when search/filter states change (with debouncing)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(priorityFilter && { priority: priorityFilter }),
      };

      updateFilters(newFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, priorityFilter, updateFilters]);

  // edit/delete handlers removed - grid is read-only

  // (Helpers are defined within RequirementCard where needed)

  if (loading && requirements.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" label={t("common.loading")} />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code className="w-6 h-6" />
              {t("requirements.developmentRequirements")}
            </h1>
            <p className="text-default-500">
              {t("requirements.developmentRequirementsSubtitle")}
            </p>
          </div>

          {/* Stats Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Code className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {totalRequirements}
                  </div>
                  <div className="text-sm text-default-500">
                    {t("requirements.totalInDevelopment")}
                  </div>
                </div>
              </div>
              <Chip color="secondary" variant="flat">
                {t("requirements.inDevelopment")}
              </Chip>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Input
                placeholder={t("requirements.searchRequirements")}
                startContent={<Search className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="md:w-100"
              />

              {/* Project filter dropdown - appears before Priority */}
              <Select
                placeholder={t("taskPlan.filterByProject")}
                className="md:w-86"
                selectedKeys={filters.projectId ? [String(filters.projectId)] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setProjectFilter(val ? Number(val) : undefined);
                }}
              >
                <SelectItem key="">{t("taskPlan.allProjects")}</SelectItem>
                {projects?.map((p: AssignedProject) => (
                  <SelectItem key={String(p.id)}>{p.applicationName}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder={t("requirements.filterByPriority")}
                className="md:w-40"
                selectedKeys={priorityFilter ? [priorityFilter] : []}
                onSelectionChange={(keys) =>
                  setPriorityFilter((Array.from(keys)[0] as string) || "")
                }
              >
                <SelectItem key="">
                  {t("requirements.allPriorities")}
                </SelectItem>
                <SelectItem key="high">{t("requirements.high")}</SelectItem>
                <SelectItem key="medium">{t("requirements.medium")}</SelectItem>
                <SelectItem key="low">{t("requirements.low")}</SelectItem>
              </Select>

              {/* Grid-only view (no toggle) */}
                
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">{t("common.show")}</span>
                <Select
                  className="w-20"
                  size="sm"
                  selectedKeys={[pageSize.toString()]}
                  onSelectionChange={(keys) => {
                    const newSize = parseInt(Array.from(keys)[0] as string);
                    handlePageSizeChange(newSize);
                  }}
                >
                  <SelectItem key="10">10</SelectItem>
                  <SelectItem key="20">20</SelectItem>
                  <SelectItem key="50">50</SelectItem>
                  <SelectItem key="100">100</SelectItem>
                </Select>
                <span className="text-sm text-default-600">{t("pagination.perPage")}</span>
              </div>
              
              {/* Reset filters button */}
              <div>
                <Button
                  isIconOnly
                  variant="bordered"
                  onPress={() => {
                    // Clear local UI filters
                    setSearchTerm("");
                    setPriorityFilter("");
                    // Clear hook/server filters
                    updateFilters({});
                    // Clear project filter if set
                    setProjectFilter(undefined);
                    // Refresh data
                    refreshData();
                  }}
                >
                  <RefreshIcon />
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Requirements Content */}
        {requirements.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center">
                    <Code className="w-12 h-12 text-default-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-default-700">
                      {t("requirements.noDevelopmentRequirements")}
                    </h3>
                    <p className="text-default-500">
                      {t("requirements.noDevelopmentRequirementsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              style={{ alignItems: "start" }}
            >
              {requirements.map((requirement) => (
                <RequirementCard key={requirement.id} requirement={requirement} />
              ))}
            </div>
            
            {/* Grid-only UI (list view removed) */}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <GlobalPagination
              currentPage={currentPage}
              isLoading={loading}
              pageSize={pageSize}
              showInfo={true}
              totalItems={totalRequirements}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

  {/* edit/delete modals removed */}
    </DefaultLayout>
  );
}
