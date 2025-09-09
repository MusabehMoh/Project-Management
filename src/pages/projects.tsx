import type { Unit } from "@/types/unit";
import type { EmployeeSearchResult } from "@/types/user";
import type { MemberSearchResult } from "@/types/timeline";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Avatar } from "@heroui/avatar";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import { parseDate } from "@internationalized/date";
import { addToast } from "@heroui/toast";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasPermission } from "@/utils/permissions";
import { projectService } from "@/services/api";
import {
  PlusIcon,
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
  CalendarIcon,
  InfoIcon,
  SendIcon,
  DownloadIcon,
} from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { UnitSelector } from "@/components/UnitSelector";
import { ProjectDetailsModal } from "@/components/ProjectDetailsModal";
import { useProjects } from "@/hooks/useProjects";
import { useProjectStatus } from "@/hooks/useProjectStatus";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import useTeamSearch from "@/hooks/useTeamSearch";
import { Project, ProjectFormData } from "@/types/project";

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const { user: currentUser } = useCurrentUser();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onOpenChange: onDetailsOpenChange,
  } = useDisclosure();

  // Use the projects hook for data management
  const {
    projects,
    users,
    owningUnits,
    stats,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    filterUsers,
    refreshData,
    clearError,
    // Pagination
    currentPage,
    totalPages,
    totalProjects,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useProjects();

  // Phases hook for dynamic phase management
  const {
    phases,
    loading: phasesLoading,
    getProjectStatusName,
  } = useProjectStatus();

  // Employee search hooks for project owner and alternative owner
  const {
    employees: ownerEmployees,
    loading: ownerSearchLoading,
    searchEmployees: searchOwnerEmployees,
    clearResults: clearOwnerResults,
  } = useEmployeeSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  const {
    employees: alternativeOwnerEmployees,
    loading: alternativeOwnerSearchLoading,
    searchEmployees: searchAlternativeOwnerEmployees,
    clearResults: clearAlternativeOwnerResults,
  } = useEmployeeSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  // Team search hook for analysts selection
  const {
    employees: analystEmployees,
    loading: analystSearchLoading,
    searchEmployees: searchAnalystEmployees,
    clearResults: clearAnalystResults,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  // State for selected employees
  const [selectedOwner, setSelectedOwner] =
    useState<EmployeeSearchResult | null>(null);
  const [selectedAlternativeOwner, setSelectedAlternativeOwner] =
    useState<EmployeeSearchResult | null>(null);

  // State for selected analysts (multiple selection)
  const [selectedAnalysts, setSelectedAnalysts] = useState<
    MemberSearchResult[]
  >([]);
  const [analystInputValue, setAnalystInputValue] = useState<string>("");

  // State for input values to handle manual typing and clearing
  const [ownerInputValue, setOwnerInputValue] = useState<string>("");
  const [alternativeOwnerInputValue, setAlternativeOwnerInputValue] =
    useState<string>("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    applicationName?: string;
    projectOwner?: string;
    owningUnit?: string;
    startDate?: string;
    expectedCompletionDate?: string;
  }>({});

  // Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === "INPUT") return;

      if (event.key === "ArrowLeft" && event.ctrlKey && currentPage > 1) {
        event.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (
        event.key === "ArrowRight" &&
        event.ctrlKey &&
        currentPage < totalPages
      ) {
        event.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (event.key === "Home" && event.ctrlKey && currentPage > 1) {
        event.preventDefault();
        handlePageChange(1);
      } else if (
        event.key === "End" &&
        event.ctrlKey &&
        currentPage < totalPages
      ) {
        event.preventDefault();
        handlePageChange(totalPages);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, handlePageChange]);

  // Handle owner selection
  const handleOwnerSelect = (employee: EmployeeSearchResult) => {
    setSelectedOwner(employee);
    setOwnerInputValue(`${employee.gradeName} ${employee.fullName}`);
    setFormData({ ...formData, projectOwner: employee.id });
  };

  // Handle alternative owner selection
  const handleAlternativeOwnerSelect = (employee: EmployeeSearchResult) => {
    setSelectedAlternativeOwner(employee);
    setAlternativeOwnerInputValue(`${employee.gradeName} ${employee.fullName}`);
    setFormData({ ...formData, alternativeOwner: employee.id });
  };

  // Handle analyst selection (multiple)
  const handleAnalystSelect = (analyst: MemberSearchResult) => {
    // Check if analyst is already selected
    const isAlreadySelected = selectedAnalysts.some(
      (selected) => selected.id === analyst.id,
    );

    if (!isAlreadySelected) {
      const updatedAnalysts = [...selectedAnalysts, analyst];
      setSelectedAnalysts(updatedAnalysts);
      setFormData({
        ...formData,
        analysts: updatedAnalysts.map((a) => a.id),
      });
    }

    // Clear the input
    setAnalystInputValue("");
  };

  // Handle analyst removal
  const handleAnalystRemove = (analystId: number) => {
    const updatedAnalysts = selectedAnalysts.filter(
      (analyst) => analyst.id !== analystId,
    );
    setSelectedAnalysts(updatedAnalysts);
    setFormData({
      ...formData,
      analysts: updatedAnalysts.map((a) => a.id),
    });
  };

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] =
    useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(undefined);
  const [formData, setFormData] = useState<ProjectFormData>({
    applicationName: "",
    projectOwner: 0, // Changed to numeric ID
    alternativeOwner: 0, // Changed to numeric ID
    owningUnit: 0, // Changed to numeric ID
    analysts: [], // Array of analyst IDs
    startDate: null,
    expectedCompletionDate: null,
    description: "",
    remarks: "",
    status: 1, // Default to phase 1 (Under Study)
  });

  // Validation function
  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!formData.applicationName.trim()) {
      errors.applicationName = t("projects.validation.applicationNameRequired");
    }

    if (!formData.projectOwner || formData.projectOwner === 0) {
      errors.projectOwner = t("projects.validation.projectOwnerRequired");
    }

    if (!formData.owningUnit) {
      errors.owningUnit = t("projects.validation.owningUnitRequired");
    }

    if (!formData.startDate) {
      errors.startDate = t("projects.validation.startDateRequired");
    }

    if (!formData.expectedCompletionDate) {
      errors.expectedCompletionDate = t(
        "projects.validation.expectedCompletionRequired",
      );
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Helper function to get user name by ID
  const getUserNameById = (userId: number): string => {
    if (!userId) return "Unknown";
    const user = users.find((u) => u.id === userId);

    return user?.name || `User #${userId}`;
  };

  // Helper function to get user by ID
  const getUserById = (userId: number) => {
    if (!userId) return null;

    return users.find((u) => u.id === userId) || null;
  };

  // Helper function to get unit name by ID
  const getUnitNameById = (unitId: number): string => {
    if (!unitId) return "Unknown Unit";
    // TODO: This should use actual units data when available
    // For now, return a placeholder based on the ID
    const unitNames = {
      1: "Information Technology Division",
      2: "Finance and Budgeting",
      3: "Operations and Strategic Planning",
      4: "Research and Development",
      5: "Human Resources Division",
    };

    return unitNames[unitId as keyof typeof unitNames] || `Unit #${unitId}`;
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // Under Study
        return "secondary";
      case 2: // Under Development
        return "primary";
      case 3: // Testing Environment
        return "warning";
      case 4: // Operating Environment
        return "success";
      case 5: // Production Environment
        return "success";
      default:
        return "default";
    }
  };

  const getStatusText = (status: number) => {
    return getProjectStatusName(status);
  };

  const handleAddProject = () => {
    setIsEditing(false);
    setSelectedProject(null);
    setSelectedUnit(undefined);
    setSelectedOwner(null);
    setSelectedAlternativeOwner(null);
    setSelectedAnalysts([]);
    setOwnerInputValue("");
    setAlternativeOwnerInputValue("");
    setAnalystInputValue("");
    setValidationErrors({});
    clearOwnerResults();
    clearAlternativeOwnerResults();
    clearAnalystResults();
    setFormData({
      applicationName: "",
      projectOwner: 0, // Reset to 0 for numeric ID
      alternativeOwner: 0, // Reset to 0 for numeric ID
      owningUnit: 0, // Reset to 0 for numeric ID
      analysts: [], // Reset analysts array
      startDate: null,
      expectedCompletionDate: null,
      description: "",
      remarks: "",
      status: 1, // Default to phase 1 (Under Study)
    });
    onOpen();
  };

  const handleEditProject = (project: Project) => {
    setIsEditing(true);
    setSelectedProject(project);
    setValidationErrors({});

    // Find the unit by ID from project.owningUnitId
    // For now, create a mock unit object based on the ID
    // TODO: Replace this with actual unit lookup when units hook is available
    const mockUnit = {
      id: project.owningUnitId,
      name: project.owningUnit,
      nameAr: project.owningUnit, // TODO: Add Arabic names
      code: `UNIT${project.owningUnitId}`,
      parentId: undefined,
      level: 1,
      isActive: true,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedUnit(mockUnit);

    // Find the employees by their IDs and set them as selected
    const ownerEmployee = users.find((u) => u.id === project.projectOwnerId);
    const altOwnerEmployee = users.find(
      (u) => u.id === project.alternativeOwnerId,
    );

    // Convert User objects to EmployeeSearchResult objects
    const ownerResult = ownerEmployee
      ? {
          id: ownerEmployee.id,
          userName: ownerEmployee.userName,
          fullName: ownerEmployee.fullName,
          militaryNumber: ownerEmployee.militaryNumber,
          gradeName: ownerEmployee.gradeName,
          statusId: ownerEmployee.isVisible ? 1 : 0,
        }
      : null;

    const altOwnerResult = altOwnerEmployee
      ? {
          id: altOwnerEmployee.id,
          userName: altOwnerEmployee.userName,
          fullName: altOwnerEmployee.fullName,
          militaryNumber: altOwnerEmployee.militaryNumber,
          gradeName: altOwnerEmployee.gradeName,
          statusId: altOwnerEmployee.isVisible ? 1 : 0,
        }
      : null;

    setSelectedOwner(ownerResult);
    setSelectedAlternativeOwner(altOwnerResult);

    // Handle analysts if they exist in the project
    const analystResults: MemberSearchResult[] = [];
    if (project.analystIds && project.analystIds.length > 0) {
      // Convert analyst IDs to MemberSearchResult objects
      project.analystIds.forEach((analystId) => {
        const analystUser = users.find((u) => u.id === analystId);

        if (analystUser) {
          analystResults.push({
            id: analystUser.id,
            userName: analystUser.userName,
            fullName: analystUser.fullName,
            militaryNumber: analystUser.militaryNumber,
            gradeName: analystUser.gradeName,
            statusId: analystUser.isVisible ? 1 : 0,
            department: analystUser.department,
          });
        }
      });
    }
    setSelectedAnalysts(analystResults);

    // Set input values
    setOwnerInputValue(
      ownerResult ? `${ownerResult.gradeName} ${ownerResult.fullName}` : "",
    );
    setAlternativeOwnerInputValue(
      altOwnerResult
        ? `${altOwnerResult.gradeName} ${altOwnerResult.fullName}`
        : "",
    );
    setAnalystInputValue("");

    setFormData({
      applicationName: project.applicationName,
      projectOwner: project.projectOwnerId, // Use numeric ID
      alternativeOwner: project.alternativeOwnerId, // Use numeric ID
      owningUnit: project.owningUnitId, // Use numeric ID
      analysts: project.analystIds || [], // Use analyst IDs or empty array
      startDate: parseDate(project.startDate),
      expectedCompletionDate: project.expectedCompletionDate
        ? parseDate(project.expectedCompletionDate)
        : null,
      description: project.description,
      remarks: project.remarks,
      status: project.status,
    });
    onOpen();
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    onDeleteOpen();
  };

  const handleSendProject = async (project: Project) => {
    try {
      const result = await projectService.sendProject(project.id);

      if (result.success) {
        addToast({
          title:
            t("projects.sendSuccess") || "Project sent for review successfully",
          color: "success",
        });
        refreshData(); // Refresh the project list to show updated status
      } else {
        addToast({
          title:
            result.message ||
            t("projects.sendError") ||
            "Failed to send project for review",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error sending project for review:", error);
      addToast({
        title: t("common.unexpectedError") || "An unexpected error occurred",
        color: "danger",
      });
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProjectForDetails(project);
    onDetailsOpen();
  };

  const handleDetailsClose = () => {
    setSelectedProjectForDetails(null);
    onDetailsOpenChange();
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        const success = await deleteProject(projectToDelete.id);

        if (success) {
          console.log("Project deleted successfully");
          // If we're on the last page and it becomes empty, go to previous page
          const remainingOnPage = projects.length - 1;

          if (remainingOnPage === 0 && currentPage > 1) {
            handlePageChange(currentPage - 1);
          } else {
            // Refresh current page
            handlePageChange(currentPage);
          }
        }
        setProjectToDelete(null);
        onDeleteOpenChange();
      } catch (err) {
        console.error("Error deleting project:", err);
      }
    }
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && selectedProject) {
        // Edit existing project
        const updateData = {
          id: selectedProject.id,
          ...formData,
          startDate: formData.startDate?.toString() || "",
          expectedCompletionDate:
            formData.expectedCompletionDate?.toString() || "",
          status: formData.status, // Already numeric
          analysts: formData.analysts, // Include analysts array
        };

        const updatedProject = await updateProject(updateData);

        if (updatedProject) {
          console.log("Project updated successfully");
          // Stay on current page after update
          handlePageChange(currentPage);
        }
      } else {
        // Add new project
        const createData = {
          ...formData,
          startDate: formData.startDate?.toString() || "",
          expectedCompletionDate:
            formData.expectedCompletionDate?.toString() || "",
          status: formData.status, // Already numeric
          analysts: formData.analysts, // Include analysts array
        };

        const newProject = await createProject(createData);

        if (newProject) {
          console.log("Project created successfully");
          // Go to first page to see the new project (assuming newest first)
          handlePageChange(1);
        }
      }
      onOpenChange();
    } catch (err) {
      console.error("Error saving project:", err);
    }
  };

  const handleExportData = () => {
    try {
      // Check if there are projects to export
      if (!projects || projects.length === 0) {
        addToast({
          title:
            t("projects.noDataToExport") || "No projects available to export",
          color: "danger",
        });
        return;
      }

      // Prepare the data for export
      const exportData = projects.map((project) => ({
        "Application Name": project.applicationName,
        "Project Owner": project.projectOwner || "Unknown",
        "Alternative Owner": project.alternativeOwner || "Unknown",
        "Owning Unit": project.owningUnit || "Unknown Unit",
        "Start Date": project.startDate,
        "Expected Completion Date": project.expectedCompletionDate,
        Status: getStatusText(project.status),
        Description: project.description || "",
        Remarks: project.remarks || "",
      }));

      // Convert to CSV format
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row] || "";

              // Escape commas and quotes in CSV
              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(","),
        ),
      ].join("\n");

      // Add UTF-8 BOM for proper Arabic text encoding
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      // Create and download the file
      const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `projects_export_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        title: t("projects.exportSuccess") || "Projects exported successfully",
        color: "success",
      });
    } catch (error) {
      console.error("Error exporting projects:", error);
      addToast({
        title: t("projects.exportError") || "Failed to export projects",
        color: "danger",
      });
    }
  };

  return (
    <DefaultLayout>
      <div className={`space-y-8 ${language === "ar" ? "rtl" : "ltr"}`}>
        {/* Error Display */}
        {error && (
          <Card className="border-danger">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="text-danger">⚠️</div>
                <div>
                  <p className="text-danger font-medium">
                    Error Loading Projects
                  </p>
                  <p className="text-sm text-default-600">{error}</p>
                  <Button
                    className="mt-2"
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => {
                      clearError();
                      refreshData();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {t("projects.title")}
          </h1>
          <p className="text-lg text-default-600">{t("projects.subtitle")}</p>

          <div className="flex gap-4 justify-center">
            {hasPermission(currentUser, { actions: ["projects.create"] }) && (
              <Button
                color="primary"
                isDisabled={loading}
                size="lg"
                startContent={<PlusIcon />}
                onPress={handleAddProject}
              >
                {t("projects.newProject")}
              </Button>
            )}

            <Button
              isDisabled={loading || projects.length === 0}
              onPress={handleExportData}
              size="lg"
              startContent={<DownloadIcon />}
              variant="bordered"
            >
              {t("projects.exportData")}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-primary">
                {stats?.total || 0}
              </p>
              <p className="text-sm text-default-600">
                {t("projects.totalProjects")}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-secondary">
                {stats?.new || 0}
              </p>
              <p className="text-sm text-default-600">
                {language === "ar" ? "جديد" : "New"}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-warning">
                {stats?.delayed || 0}
              </p>
              <p className="text-sm text-default-600">
                {language === "ar" ? "مؤجل" : "Delayed"}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-secondary">
                {stats?.underReview || 0}
              </p>
              <p className="text-sm text-default-600">
                {language === "ar" ? "قيد الدراسة" : "Under Review"}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-primary">
                {stats?.underDevelopment || 0}
              </p>
              <p className="text-sm text-default-600">
                {language === "ar" ? "قيد التطوير" : "Under Development"}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-success">
                {stats?.production || 0}
              </p>
              <p className="text-sm text-default-600">
                {language === "ar" ? "بيئة الانتاج" : "Production Environment"}
              </p>
            </div>
          </Card>
        </div>

        {/* Projects Table */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("projects.allProjects")}
            </h2>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-default-600">
                {t("common.show")}:
              </span>
              <Select
                className="w-20"
                selectedKeys={[pageSize.toString()]}
                size="sm"
                onSelectionChange={(keys) => {
                  const newSize = parseInt(Array.from(keys)[0] as string);

                  handlePageSizeChange(newSize);
                }}
              >
                <SelectItem key="5">5</SelectItem>
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="20">20</SelectItem>
                <SelectItem key="50">50</SelectItem>
                <SelectItem key="100">100</SelectItem>
              </Select>
              <span className="text-sm text-default-600">
                {t("pagination.perPage")}
              </span>
            </div>
          </div>

          {/* Results info */}
          {!loading && (
            <div className="text-sm text-default-600">
              {t("pagination.showing")} {(currentPage - 1) * pageSize + 1}{" "}
              {t("pagination.to")}{" "}
              {Math.min(currentPage * pageSize, totalProjects)}{" "}
              {t("pagination.of")} {totalProjects}{" "}
              {t("projects.totalProjects").toLowerCase()}
            </div>
          )}

          <Card>
            <CardBody className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    <Spinner color="primary" size="lg" />
                    <div>
                      <p className="text-default-600">{t("common.loading")}</p>
                      <p className="text-sm text-default-500">
                        {currentPage > 1
                          ? t("pagination.loadingPage").replace(
                              "{page}",
                              currentPage.toString(),
                            )
                          : t("common.pleaseWait")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">📋</div>
                    <div>
                      <p className="text-lg text-default-600">
                        {t("projects.noProjectsFound") || "No projects found"}
                      </p>
                      <p className="text-sm text-default-500">
                        {totalProjects > 0
                          ? t("projects.noProjectsOnPage") ||
                            `No projects on page ${currentPage}. Try a different page.`
                          : t("projects.startFirstProject") ||
                            "Start by creating your first project."}
                      </p>
                    </div>
                    <Button
                      color="primary"
                      startContent={<PlusIcon />}
                      onPress={handleAddProject}
                    >
                      {t("projects.newProject")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Table aria-label="Projects table">
                  <TableHeader>
                    <TableColumn className="min-w-[200px]">
                      {t("projects.applicationName")}
                    </TableColumn>
                    <TableColumn className="min-w-[150px]">
                      {t("projects.projectOwner")}
                    </TableColumn>
                    <TableColumn className="min-w-[150px]">
                      {t("projects.alternativeOwner")}
                    </TableColumn>
                    <TableColumn className="min-w-[120px]">
                      {t("projects.owningUnit")}
                    </TableColumn>
                    <TableColumn className="min-w-[110px]">
                      {t("projects.startDate")}
                    </TableColumn>
                    <TableColumn className="min-w-[120px]">
                      {t("projects.expectedCompletion")}
                    </TableColumn>
                    <TableColumn className="min-w-[100px]">
                      {t("projects.status")}
                    </TableColumn>
                    <TableColumn className="min-w-[80px]">
                      {t("projects.actions")}
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <p className="font-semibold">
                              {project.applicationName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={project.projectOwner || "Unknown"}
                              size="sm"
                            />
                            <span>{project.projectOwner || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={project.alternativeOwner || "Unknown"}
                              size="sm"
                            />
                            <span>{project.alternativeOwner || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.owningUnit || "Unknown Unit"}
                        </TableCell>
                        <TableCell>{project.startDate}</TableCell>
                        <TableCell>{project.expectedCompletionDate}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(project.status)}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(project.status)}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <MoreVerticalIcon />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Project actions">
                              {hasPermission(currentUser, {
                                actions: ["projects.update"],
                              }) ? (
                                <DropdownItem
                                  key="edit"
                                  startContent={<EditIcon />}
                                  onPress={() => handleEditProject(project)}
                                >
                                  {t("projects.editProject")}
                                </DropdownItem>
                              ) : null}

                              {hasPermission(currentUser, {
                                actions: ["projects.sendToAnylsis"],
                              }) ? (
                                <DropdownItem
                                  key="send"
                                  startContent={<SendIcon />}
                                  onPress={() => handleSendProject(project)}
                                >
                                  {t("projects.send")}
                                </DropdownItem>
                              ) : null}

                              {hasPermission(currentUser, {
                                actions: ["projects.delete"],
                              }) ? (
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={<DeleteIcon />}
                                  onPress={() => handleDeleteProject(project)}
                                >
                                  {t("projects.deleteProject")}
                                </DropdownItem>
                              ) : null}
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
          <div className="flex justify-center py-6">
            <GlobalPagination
              className="w-full max-w-md"
              currentPage={currentPage}
              isLoading={loading}
              pageSize={pageSize}
              showInfo={true}
              totalItems={totalProjects}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Project Modal */}
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="3xl"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {isEditing
                  ? t("projects.editProject")
                  : t("projects.addProject")}
                <p className="text-sm text-default-500 font-normal">
                  {isEditing
                    ? t("projects.updateProjectInfo")
                    : t("projects.fillProjectDetails")}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    errorMessage={validationErrors.applicationName}
                    isInvalid={!!validationErrors.applicationName}
                    label={t("projects.applicationName")}
                    placeholder={t("projects.applicationName")}
                    value={formData.applicationName}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        applicationName: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.applicationName) {
                        setValidationErrors({
                          ...validationErrors,
                          applicationName: undefined,
                        });
                      }
                    }}
                  />
                  <Autocomplete
                    isClearable
                    errorMessage={validationErrors.projectOwner}
                    inputValue={ownerInputValue}
                    isInvalid={!!validationErrors.projectOwner}
                    isLoading={ownerSearchLoading}
                    items={ownerEmployees}
                    label={t("projects.projectOwner")}
                    menuTrigger="input"
                    placeholder={t("projects.searchByName")}
                    selectedKey={selectedOwner?.id.toString()}
                    onInputChange={(value) => {
                      setOwnerInputValue(value);
                      // Clear selection if input doesn't match the selected owner
                      if (
                        selectedOwner &&
                        value !==
                          `${selectedOwner.gradeName} ${selectedOwner.fullName}`
                      ) {
                        setSelectedOwner(null);
                        setFormData({ ...formData, projectOwner: 0 });
                      }
                      // Clear validation error when user starts typing
                      if (validationErrors.projectOwner) {
                        setValidationErrors({
                          ...validationErrors,
                          projectOwner: undefined,
                        });
                      }
                      // Search for employees
                      searchOwnerEmployees(value);
                    }}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedEmployee = ownerEmployees.find(
                          (e) => e.id.toString() === key,
                        );

                        if (selectedEmployee) {
                          handleOwnerSelect(selectedEmployee);
                        }
                      } else {
                        // Clear selection
                        setSelectedOwner(null);
                        setOwnerInputValue("");
                        setFormData({ ...formData, projectOwner: 0 });
                      }
                      // Clear validation error when user selects
                      if (validationErrors.projectOwner) {
                        setValidationErrors({
                          ...validationErrors,
                          projectOwner: undefined,
                        });
                      }
                    }}
                  >
                    {ownerEmployees.map((employee) => (
                      <AutocompleteItem
                        key={employee.id.toString()}
                        textValue={`${employee.gradeName} ${employee.fullName}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={employee.fullName || "Unknown"}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {employee.gradeName}{" "}
                              {employee.fullName || "Unknown User"}
                            </span>
                            <span className="text-sm text-default-500">
                              {employee.militaryNumber || "N/A"}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.userName || "unknown"}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                  <Autocomplete
                    isClearable
                    inputValue={alternativeOwnerInputValue}
                    isLoading={alternativeOwnerSearchLoading}
                    items={alternativeOwnerEmployees}
                    label={t("projects.alternativeOwner")}
                    menuTrigger="input"
                    placeholder={t("projects.searchByName")}
                    selectedKey={selectedAlternativeOwner?.id.toString()}
                    onInputChange={(value) => {
                      setAlternativeOwnerInputValue(value);
                      // Clear selection if input doesn't match the selected alternative owner
                      if (
                        selectedAlternativeOwner &&
                        value !==
                          `${selectedAlternativeOwner.gradeName} ${selectedAlternativeOwner.fullName}`
                      ) {
                        setSelectedAlternativeOwner(null);
                        setFormData({ ...formData, alternativeOwner: 0 });
                      }
                      // Search for employees
                      searchAlternativeOwnerEmployees(value);
                    }}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedEmployee = alternativeOwnerEmployees.find(
                          (e) => e.id.toString() === key,
                        );

                        if (selectedEmployee) {
                          handleAlternativeOwnerSelect(selectedEmployee);
                        }
                      } else {
                        // Clear selection
                        setSelectedAlternativeOwner(null);
                        setAlternativeOwnerInputValue("");
                        setFormData({ ...formData, alternativeOwner: 0 });
                      }
                    }}
                  >
                    {alternativeOwnerEmployees.map((employee) => (
                      <AutocompleteItem
                        key={employee.id.toString()}
                        textValue={`${employee.gradeName} ${employee.fullName}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={employee.fullName || "Unknown"}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {employee.gradeName}{" "}
                              {employee.fullName || "Unknown User"}
                            </span>
                            <span className="text-sm text-default-500">
                              {employee.militaryNumber || "N/A"}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.userName || "unknown"}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Analysts Selection Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("projects.analysts")}
                    </label>
                    <Autocomplete
                      allowsCustomValue
                      className="max-w-full"
                      inputValue={analystInputValue}
                      isLoading={analystSearchLoading}
                      items={analystEmployees}
                      label={t("projects.selectAnalysts")}
                      placeholder={t("projects.searchAnalysts")}
                      onInputChange={(value) => {
                        setAnalystInputValue(value);
                        searchAnalystEmployees(value);
                      }}
                      onSelectionChange={(key) => {
                        if (key) {
                          const selectedEmployee = analystEmployees.find(
                            (e) => e.id.toString() === key,
                          );

                          if (selectedEmployee) {
                            handleAnalystSelect(selectedEmployee);
                          }
                        }
                      }}
                    >
                      {analystEmployees.map((employee) => (
                        <AutocompleteItem
                          key={employee.id.toString()}
                          textValue={`${employee.gradeName} ${employee.fullName}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={employee.fullName || "Unknown"}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {employee.gradeName}{" "}
                                {employee.fullName || "Unknown User"}
                              </span>
                              <span className="text-sm text-default-500">
                                {employee.militaryNumber || "N/A"}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.userName || "unknown"}
                              </span>
                            </div>
                          </div>
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>

                    {/* Selected Analysts Display */}
                    {selectedAnalysts.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm text-default-600">
                          {t("projects.selectedAnalysts")}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysts.map((analyst) => (
                            <Chip
                              key={analyst.id}
                              color="primary"
                              variant="flat"
                              onClose={() => handleAnalystRemove(analyst.id)}
                            >
                              {analyst.gradeName} {analyst.fullName}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <UnitSelector
                    allowClear
                    errorMessage={validationErrors.owningUnit}
                    isInvalid={!!validationErrors.owningUnit}
                    label={t("projects.owningUnit")}
                    placeholder={t("projects.owningUnit")}
                    selectedUnit={selectedUnit}
                    onUnitSelect={(unit) => {
                      setSelectedUnit(unit);
                      setFormData({
                        ...formData,
                        owningUnit: unit ? unit.id : 0,
                      });
                      // Clear validation error when user selects
                      if (validationErrors.owningUnit) {
                        setValidationErrors({
                          ...validationErrors,
                          owningUnit: undefined,
                        });
                      }
                    }}
                  />
                  <DatePicker
                    errorMessage={validationErrors.startDate}
                    isInvalid={!!validationErrors.startDate}
                    label={t("projects.startDate")}
                    value={formData.startDate}
                    onChange={(date) => {
                      setFormData({ ...formData, startDate: date });
                      // Clear validation error when user selects
                      if (validationErrors.startDate) {
                        setValidationErrors({
                          ...validationErrors,
                          startDate: undefined,
                        });
                      }
                    }}
                  />
                  <DatePicker
                    errorMessage={validationErrors.expectedCompletionDate}
                    isInvalid={!!validationErrors.expectedCompletionDate}
                    label={t("projects.expectedCompletion")}
                    value={formData.expectedCompletionDate}
                    onChange={(date) => {
                      setFormData({
                        ...formData,
                        expectedCompletionDate: date,
                      });
                      // Clear validation error when user selects
                      if (validationErrors.expectedCompletionDate) {
                        setValidationErrors({
                          ...validationErrors,
                          expectedCompletionDate: undefined,
                        });
                      }
                    }}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label={t("projects.description")}
                      placeholder={t("projects.description")}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label={t("projects.remarks")}
                      placeholder={t("projects.remarks")}
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                    />
                  </div>
                  <Select
                    isLoading={phasesLoading}
                    label={t("projects.status")}
                    placeholder={t("projects.status")}
                    selectedKeys={
                      formData.status ? [formData.status.toString()] : []
                    }
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;

                      setFormData({
                        ...formData,
                        status: selected ? parseInt(selected) : 1,
                      });
                    }}
                  >
                    {phases.map((phase) => (
                      <SelectItem key={phase.code.toString()}>
                        {language === "ar" ? phase.nameAr : phase.nameEn}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={loading}
                  onPress={handleSave}
                >
                  {isEditing
                    ? t("projects.updateProject")
                    : t("projects.addProject")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} size="md" onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("projects.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p>
                  {t("projects.deleteConfirmMessage")}
                  <strong>{projectToDelete?.applicationName}</strong>?{" "}
                  {t("projects.actionCannotBeUndone")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  isDisabled={loading}
                  variant="light"
                  onPress={onClose}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  color="danger"
                  isDisabled={loading}
                  isLoading={loading}
                  onPress={confirmDelete}
                >
                  {t("projects.deleteProject")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={isDetailsOpen}
        project={selectedProjectForDetails}
        onOpenChange={handleDetailsClose}
      />
    </DefaultLayout>
  );
}
