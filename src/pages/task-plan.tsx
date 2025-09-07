import type { ProjectRequirement } from "@/types/projectRequirement";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  Search,
  Filter,
  RefreshCw,
  Calendar,
  FileText,
  MoreVertical,
  Eye,
} from "lucide-react";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useTaskPlan } from "@/hooks/useTaskPlan";

export default function TaskPlanPage() {
  const { t } = useLanguage();
  const {
    requirements,
    projects,
    loading,
    error,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    clearError,
    refreshData,
  } = useTaskPlan({ pageSize: 20 });

  // Local filter states for controlled inputs
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");

  // Pagination page size options
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
  const effectivePageSize = PAGE_SIZE_OPTIONS.includes(pageSize)
    ? pageSize
    : 20;

  // Update filters when local states change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(priorityFilter && { priority: priorityFilter as any }),
        ...(projectFilter && { projectId: parseInt(projectFilter) }),
      };

      updateFilters(newFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, priorityFilter, projectFilter, updateFilters]);

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
      case "pending":
        return "warning";
      case "approved":
        return "primary";
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

  const handleViewRequirement = (_requirement: ProjectRequirement) => {
    // Navigate to requirement details
    // This would typically navigate to a detailed view
    // Implementation pending
  };

  if (error) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
          <div className="text-danger text-center">
            <h3 className="text-lg font-semibold">
              {t("common.unexpectedError")}
            </h3>
            <p className="text-default-500 mt-2">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button color="danger" variant="light" onPress={clearError}>
              {t("common.close")}
            </Button>
            <Button color="primary" onPress={refreshData}>
              {t("common.retry")}
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("taskPlan.title")}
              </h1>
              <p className="text-default-500">{t("taskPlan.subtitle")}</p>
            </div>
            <Button
              color="primary"
              endContent={<RefreshCw className="w-4 h-4" />}
              isLoading={loading}
              variant="flat"
              onPress={refreshData}
            >
              {t("common.refresh")}
            </Button>
          </div>

          {/* Stats */}
          {!loading && totalRequirements > 0 && (
            <div className="text-sm text-default-600">
              {`${t("taskPlan.showingResults").replace("{total}", totalRequirements.toString())}`}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-semibold">Filters</span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Input
                className="md:max-w-xs"
                placeholder={t("taskPlan.searchRequirements")}
                startContent={<Search className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />

              <Select
                className="md:max-w-xs"
                placeholder={t("requirements.filterByPriority")}
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

              <Select
                className="md:max-w-xs"
                placeholder={t("taskPlan.filterByProject")}
                selectedKeys={projectFilter ? [projectFilter] : []}
                onSelectionChange={(keys) =>
                  setProjectFilter((Array.from(keys)[0] as string) || "")
                }
              >
                <SelectItem key="">{t("taskPlan.allProjects")}</SelectItem>
                <>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.id.toString()}
                      textValue={project.name}
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </>
              </Select>

              <Button
                color="default"
                variant="flat"
                onPress={() => {
                  setSearchTerm("");
                  setPriorityFilter("");
                  setProjectFilter("");
                }}
              >
                {t("common.clear")}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Requirements Table */}
        <Card>
          <CardBody className="p-0">
            {/* Results info and page size selector */}
            {!loading && totalRequirements > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between px-4 pt-4 pb-2 border-b border-default-200">
                <div className="text-sm text-default-600">
                  {t("pagination.showing")}{" "}
                  {(currentPage - 1) * effectivePageSize + 1}{" "}
                  {t("pagination.to")}{" "}
                  {Math.min(currentPage * effectivePageSize, totalRequirements)}{" "}
                  {t("pagination.of")} {totalRequirements} requirements
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-600">
                    {t("common.show")}:
                  </span>
                  <Select
                    className="w-24"
                    selectedKeys={[effectivePageSize.toString()]}
                    size="sm"
                    onSelectionChange={(keys) => {
                      const newSizeStr = Array.from(keys)[0] as string;

                      if (!newSizeStr) return;

                      const newSize = parseInt(newSizeStr, 10);

                      if (!Number.isNaN(newSize)) {
                        handlePageSizeChange(newSize);
                      }
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => {
                      const val = opt.toString();

                      return (
                        <SelectItem key={val} textValue={val}>
                          {val}
                        </SelectItem>
                      );
                    })}
                  </Select>
                  <span className="text-sm text-default-600">
                    {t("pagination.perPage")}
                  </span>
                </div>
              </div>
            )}

            {loading && requirements.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Spinner label={t("common.loading")} size="lg" />
              </div>
            ) : requirements.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-default-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-default-700">
                      {t("taskPlan.noRequirements")}
                    </h3>
                    <p className="text-default-500 mt-2 max-w-md">
                      {t("taskPlan.noRequirementsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Table aria-label="Task plan requirements table">
                <TableHeader>
                  <TableColumn>{t("taskPlan.project")}</TableColumn>
                  <TableColumn>{t("taskPlan.requirementName")}</TableColumn>
                  <TableColumn>{t("taskPlan.priority")}</TableColumn>
                  <TableColumn>{t("taskPlan.status")}</TableColumn>
                  <TableColumn>{t("taskPlan.dueDate")}</TableColumn>
                  <TableColumn>{t("taskPlan.actions")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {requirements.map((requirement) => (
                    <TableRow key={requirement.id}>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {requirement.project?.applicationName ||
                            "Unknown Project"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{requirement.name}</div>
                          <div className="text-sm text-default-500 line-clamp-2">
                            {requirement.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getPriorityColor(requirement.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {t(`requirements.${requirement.priority}`)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(requirement.status)}
                          size="sm"
                          variant="flat"
                        >
                          {t("taskPlan.inDevelopment")}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-default-400" />
                          <span>
                            {formatDate(requirement.expectedCompletionDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="view"
                              startContent={<Eye className="w-4 h-4" />}
                              onPress={() => handleViewRequirement(requirement)}
                            >
                              {t("common.view")}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {!loading && totalRequirements > effectivePageSize && (
          <div className="flex justify-center">
            <GlobalPagination
              currentPage={currentPage}
              isLoading={loading}
              pageSize={effectivePageSize}
              showInfo={false}
              totalItems={totalRequirements}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
