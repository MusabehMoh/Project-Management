import type { Unit } from "@/types/unit";
import type { EmployeeSearchResult } from "@/types/user";
import type { MemberSearchResult } from "@/types/timeline";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Avatar } from "@heroui/avatar";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Skeleton } from "@heroui/skeleton";
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

import { useTeamSearchByDepartment } from "@/hooks/useTeamSearchByDepartment";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { projectService } from "@/services/api";
import {
  PlusIcon,
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
  SendIcon,
  DownloadIcon,
  SearchIcon,
  InfoIcon,
} from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { UnitSelector } from "@/components/UnitSelector";
import ProjectDetailsDrawer from "@/components/ProjectDetailsDrawer";
import { useProjects } from "@/hooks/useProjects";
import { useProjectStatus } from "@/hooks/useProjectStatus";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import useTeamSearch from "@/hooks/useTeamSearch";
import { Project, ProjectFormData } from "@/types/project";
import { usePageTitle } from "@/hooks";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Set page title
  usePageTitle("projects.title");
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
    stats,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshData,
    clearError,
    updateFilters,
    // Pagination
    currentPage,
    totalPages,
    totalProjects,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useProjects();

  // Handle URL parameters for editing specific projects
  const [searchParams, setSearchParams] = useSearchParams();
  const editProjectId = searchParams.get("edit");

  // State for project ID to fetch (for edit and details)
  const [projectIdForEdit, setProjectIdForEdit] = useState<number | undefined>(
    undefined,
  );
  const [projectIdForDetails, setProjectIdForDetails] = useState<
    number | undefined
  >(undefined);
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  // Phases hook for dynamic phase management
  const {
    phases,
    loading: phasesLoading,
    getProjectStatusName,
    getProjectStatusColor,
  } = useProjectStatus();

  // Hook to fetch project details for edit modal
  const { project: projectForEdit, loading: editLoading } = useProjectDetails({
    projectId: projectIdForEdit,
    enabled: projectIdForEdit !== undefined,
  });

  // Hook to fetch project details for drawer view
  const { project: projectDetailsData, loading: detailsLoading } =
    useProjectDetails({
      projectId: projectIdForDetails,
      enabled: projectIdForDetails !== undefined,
    });

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
  } = useTeamSearchByDepartment({
    departmentId: 1, // Design Department
    minLength: 1,
    maxResults: 100,
    loadInitialResults: true, // Load all designers initially
    initialResultsLimit: 100,
  });

  // Team search hook for responsible manager selection
  const {
    employees: responsibleManagers,
    loading: responsibleManagerSearchLoading,
    searchEmployees: searchResponsibleManager,
    clearResults: clearResponsibleManagerResults,
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
  // State for selected managers (single selection)
  const [selectedResponsibleManager, setSelectedResponsibleManager] =
    useState<MemberSearchResult | null>(null);
  const [analystInputValue, setAnalystInputValue] = useState<string>("");
  const [responsibleManagerInputValue, setResponsibleManagerInputValue] =
    useState<string>("");

  // State for input values to handle manual typing and clearing
  const [ownerInputValue, setOwnerInputValue] = useState<string>("");
  const [alternativeOwnerInputValue, setAlternativeOwnerInputValue] =
    useState<string>("");

  // State for project name filter
  const [projectNameFilter, setProjectNameFilter] = useState<string>("");
  // `searchQuery` is the debounced/applied filter value that triggers API calls
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    applicationName?: string;
    projectOwner?: string;
    owningUnit?: string;
    startDate?: string;
    expectedCompletionDate?: string;
    description?: string;
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

  // Debounce the input and only apply filter when user typed 3+ characters
  useEffect(() => {
    const value = projectNameFilter.trim();

    // If input is empty, clear the search query immediately
    if (value === "") {
      setSearchQuery("");

      return;
    }

    // Only apply automatic search when user typed 3 or more characters
    const timeout = setTimeout(() => {
      if (value.length >= 3) {
        setSearchQuery(value);
      }
    }, 350); // debounce delay

    return () => clearTimeout(timeout);
  }, [projectNameFilter]);

  // Apply filters when `searchQuery` changes (either via debounce or explicit search)
  useEffect(() => {
    updateFilters({
      search: searchQuery || undefined,
    });
  }, [searchQuery, updateFilters]);

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

  // Handle manager selection (single selection) - now handled inline in Autocomplete
  // Removed inline handler to prevent stale closures and race conditions

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
    responsibleManagerId: 0, // Single responsible manager ID
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

    if (!formData.description.trim()) {
      errors.description = t("projects.validation.descriptionRequired");
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const getStatusColor = (status: number) => {
    return getProjectStatusColor(status);
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
    setSelectedResponsibleManager(null);
    setOwnerInputValue("");
    setAlternativeOwnerInputValue("");
    setAnalystInputValue("");
    setResponsibleManagerInputValue("");
    setValidationErrors({});
    clearOwnerResults();
    clearAlternativeOwnerResults();
    clearAnalystResults();
    clearResponsibleManagerResults();
    setFormData({
      applicationName: "",
      projectOwner: 0, // Reset to 0 for numeric ID
      alternativeOwner: 0, // Reset to 0 for numeric ID
      owningUnit: 0, // Reset to 0 for numeric ID
      analysts: [], // Reset analysts array
      responsibleManagerId: 0, // Reset responsible manager ID
      startDate: null,
      expectedCompletionDate: null,
      description: "",
      remarks: "",
      status: 1, // Default to phase 1 (Under Study)
    });
    onOpen();
  };

  const handleEditProject = (projectId: number) => {
    setProjectIdForEdit(projectId);
    onOpen(); // Open modal immediately
  };

  // Effect to populate form when project is fetched for editing
  useEffect(() => {
    if (projectForEdit) {
      setIsEditing(true);
      setSelectedProject(projectForEdit);
      setValidationErrors({});

      // Create mock unit object based on project data
      const mockUnit = {
        id: projectForEdit.owningUnitId,
        name: projectForEdit.owningUnit,
        nameAr: projectForEdit.owningUnit,
        code: `UNIT${projectForEdit.owningUnitId}`,
        parentId: undefined,
        level: 1,
        isActive: true,
        children: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSelectedUnit(mockUnit);

      // Use the employee objects directly from the project
      const ownerEmployee = projectForEdit.projectOwnerEmployee;
      const altOwnerEmployee = projectForEdit.alternativeOwnerEmployee;
      const responsibleUnitManagerEmployee =
        projectForEdit.responsibleUnitManagerEmployee;

      // Convert User objects to EmployeeSearchResult objects
      const ownerResult = ownerEmployee
        ? {
            id: ownerEmployee.id,
            userName: ownerEmployee.userName,
            fullName: ownerEmployee.fullName,
            militaryNumber: ownerEmployee.militaryNumber,
            gradeName: ownerEmployee.gradeName,
            statusId: ownerEmployee.statusId,
          }
        : null;

      const altOwnerResult = altOwnerEmployee
        ? {
            id: altOwnerEmployee.id,
            userName: altOwnerEmployee.userName,
            fullName: altOwnerEmployee.fullName,
            militaryNumber: altOwnerEmployee.militaryNumber,
            gradeName: altOwnerEmployee.gradeName,
            statusId: altOwnerEmployee.statusId,
          }
        : null;

      setSelectedOwner(ownerResult);
      setSelectedAlternativeOwner(altOwnerResult);

      // Use analyst employee data directly from project
      if (
        projectForEdit.analystEmployees &&
        projectForEdit.analystEmployees.length > 0
      ) {
        const foundAnalysts: MemberSearchResult[] =
          projectForEdit.analystEmployees.map((analyst) => ({
            id: analyst.id,
            userName: analyst.userName,
            fullName: analyst.fullName,
            militaryNumber: analyst.militaryNumber,
            gradeName: analyst.gradeName,
            statusId: analyst.statusId || 0,
            department: analyst.department || "",
          }));

        setSelectedAnalysts(foundAnalysts);
      } else {
        setSelectedAnalysts([]);
      }

      // Use manager employee data directly from project if available
      if (responsibleUnitManagerEmployee) {
        const managerResult: MemberSearchResult = {
          id: responsibleUnitManagerEmployee.id,
          userName: responsibleUnitManagerEmployee.userName,
          fullName: responsibleUnitManagerEmployee.fullName,
          militaryNumber: responsibleUnitManagerEmployee.militaryNumber,
          gradeName: responsibleUnitManagerEmployee.gradeName,
          statusId: responsibleUnitManagerEmployee.statusId || 0,
          department: responsibleUnitManagerEmployee.department || "",
        };

        setSelectedResponsibleManager(managerResult);
        setResponsibleManagerInputValue(
          `${managerResult.gradeName} ${managerResult.fullName}`,
        );
      } else {
        setSelectedResponsibleManager(null);
        setResponsibleManagerInputValue("");
      }

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
        applicationName: projectForEdit.applicationName,
        projectOwner: projectForEdit.projectOwnerId,
        alternativeOwner: projectForEdit.alternativeOwnerId,
        owningUnit: projectForEdit.owningUnitId,
        analysts: Array.isArray(projectForEdit.analystIds)
          ? projectForEdit.analystIds
          : projectForEdit.analystIds
            ? [projectForEdit.analystIds]
            : [],
        responsibleManagerId: responsibleUnitManagerEmployee?.id || 0,
        startDate: projectForEdit.startDate
          ? parseDate(projectForEdit.startDate.split("T")[0])
          : null,
        expectedCompletionDate: projectForEdit.expectedCompletionDate
          ? parseDate(projectForEdit.expectedCompletionDate.split("T")[0])
          : null,
        description: projectForEdit.description,
        remarks: projectForEdit.remarks,
        status: projectForEdit.status,
      });

      // Reset projectIdForEdit to allow re-triggering on next edit
      setProjectIdForEdit(undefined);
    }
  }, [projectForEdit]);

  // Effect to handle auto-editing when edit parameter is present in URL
  useEffect(() => {
    if (editProjectId) {
      handleEditProject(parseInt(editProjectId));
      // Clear the URL parameter after triggering edit
      setSearchParams((params) => {
        params.delete("edit");
        return params;
      });
    }
  }, [editProjectId, setSearchParams]);

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

  const handleViewDetails = (projectId: number) => {
    setProjectIdForDetails(projectId);
    onDetailsOpen(); // Open drawer immediately
  };

  // Effect to open details drawer when project is fetched
  useEffect(() => {
    if (projectDetailsData) {
      setSelectedProjectForDetails(projectDetailsData);

      // Reset projectIdForDetails to allow re-triggering on next view
      setProjectIdForDetails(undefined);
    }
  }, [projectDetailsData]);

  const handleDetailsClose = () => {
    setSelectedProjectForDetails(null);
    setProjectIdForDetails(undefined);
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
          responsibleManagerId: formData.responsibleManagerId, // Send the manager ID
        };

        const updatedProject = await updateProject(updateData);

        if (updatedProject) {
          console.log("Project updated successfully");
          // Clear any previous errors
          clearError();
          // Stay on current page after update
          handlePageChange(currentPage);
          onOpenChange(); // Only close modal on success
          addToast({
            title:
              t("projects.updateSuccess") || "Project updated successfully",
            color: "success",
          });
        } else {
          // Clear hook's error state since we're showing our own toast
          clearError();
          addToast({
            title: t("projects.updateError") || "Failed to update project",
            color: "danger",
          });
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
          responsibleManagerId: formData.responsibleManagerId, // Send the manager ID
        };

        const newProject = await createProject(createData);

        if (newProject) {
          console.log("Project created successfully");
          // Clear any previous errors
          clearError();
          // Go to first page to see the new project (assuming newest first)
          handlePageChange(1);
          onOpenChange(); // Only close modal on success
          addToast({
            title:
              t("projects.createSuccess") || "Project created successfully",
            color: "success",
          });
        } else {
          // Clear hook's error state since we're showing our own toast
          clearError();
          addToast({
            title: t("projects.createError") || "Failed to create project",
            color: "danger",
          });
        }
      }
    } catch (err) {
      console.error("Error saving project:", err);
      // Clear any error from the hook to prevent duplicate error display
      clearError();
      // Don't close modal on error - let user fix issues or manually close
      addToast({
        title: t("projects.saveError") || "Failed to save project",
        description:
          t("projects.saveErrorDescription") ||
          "Please check your input and try again.",
        color: "danger",
      });
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
        "Project Owner":
          project.projectOwnerEmployee?.fullName || t("common.none"),
        "Alternative Owner":
          project.alternativeOwnerEmployee?.fullName || t("common.none"),
        "Owning Unit": project.owningUnit || t("common.none"),
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
    <>
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
            {hasPermission({ actions: ["projects.create"] }) && (
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
              size="lg"
              startContent={<DownloadIcon />}
              variant="bordered"
              onPress={handleExportData}
            >
              {t("projects.exportData")}
            </Button>
          </div>
        </div>

        {/* Quick Stats - Modern Minimalist Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* Total Projects */}
          <div className="bg-default-100 dark:bg-default-50/5 border border-default-200 rounded-lg px-4 py-3">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-default-700 dark:text-default-600">
                {stats?.total || 0}
              </p>
              <p className="text-sm text-default-500">
                {t("projects.totalProjects")}
              </p>
            </div>
          </div>

          {/* New */}
          <div className="bg-default-100 dark:bg-default-50/5 border border-default-200 rounded-lg px-4 py-3">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-default-700 dark:text-default-600">
                {stats?.new || 0}
              </p>
              <p className="text-sm text-default-500">
                {language === "ar"
                  ? stats?.statusNames?.new.ar || "جديد"
                  : stats?.statusNames?.new.en || "New"}
              </p>
            </div>
          </div>

          {/* Under Study */}
          <div className="bg-default-100 dark:bg-default-50/5 border border-default-200 rounded-lg px-4 py-3">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-default-700 dark:text-default-600">
                {stats?.underStudy || 0}
              </p>
              <p className="text-sm text-default-500">
                {language === "ar"
                  ? stats?.statusNames?.underStudy.ar || "قيد التحليل"
                  : stats?.statusNames?.underStudy.en || "Under Analysis"}
              </p>
            </div>
          </div>

          {/* Under Development */}
          <div className="bg-default-100 dark:bg-default-50/5 border border-default-200 rounded-lg px-4 py-3">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-default-700 dark:text-default-600">
                {stats?.underDevelopment || 0}
              </p>
              <p className="text-sm text-default-500">
                {language === "ar"
                  ? stats?.statusNames?.underDevelopment.ar || "قيد البرمجة"
                  : stats?.statusNames?.underDevelopment.en ||
                    "Under Development"}
              </p>
            </div>
          </div>

          {/* Under Testing */}
          <div className="bg-default-100 dark:bg-default-50/5 border border-default-200 rounded-lg px-4 py-3">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-default-700 dark:text-default-600">
                {stats?.underTesting || 0}
              </p>
              <p className="text-sm text-default-500">
                {language === "ar"
                  ? stats?.statusNames?.underTesting.ar || "بيئة الفحص"
                  : stats?.statusNames?.underTesting.en || "Under Testing"}
              </p>
            </div>
          </div>

          {/* Production */}
          <div className="bg-default-100 dark:bg-default-50/5 border border-default-200 rounded-lg px-4 py-3">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-success-600 dark:text-success-500">
                {stats?.production || 0}
              </p>
              <p className="text-sm text-default-500">
                {language === "ar"
                  ? stats?.statusNames?.production.ar || "بيئة الانتاج"
                  : stats?.statusNames?.production.en ||
                    "Production Environment"}
              </p>
            </div>
          </div>

          {/* Delayed */}
          <div className="bg-default-100 dark:bg-default-50/5 border border-default-200 rounded-lg px-4 py-3">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-warning-600 dark:text-warning-500">
                {stats?.delayed || 0}
              </p>
              <p className="text-sm text-default-500">
                {language === "ar"
                  ? stats?.statusNames?.delayed.ar || "مؤجل"
                  : stats?.statusNames?.delayed.en || "Postponed"}
              </p>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="space-y-6">
          {/* Project Name Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Input
              className="max-w-xl w-full"
              endContent={
                <div className="flex items-center gap-2">
                  <button
                    aria-label={t("common.search") || "Search"}
                    className="text-default-400 hover:text-default-600"
                    type="button"
                    onClick={() => setSearchQuery(projectNameFilter.trim())}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {projectNameFilter ? (
                    <button
                      aria-label={t("common.clear") || "Clear"}
                      className="text-default-400 hover:text-default-600"
                      type="button"
                      onClick={() => {
                        setProjectNameFilter("");
                        setSearchQuery("");
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              }
              placeholder={
                t("projects.searchByName") || "Search by project name"
              }
              startContent={
                <svg
                  className="w-4 h-4 text-default-400"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              value={projectNameFilter}
              onChange={(e) => setProjectNameFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setSearchQuery(projectNameFilter.trim());
                }
              }}
            />
          </div>

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
                disallowEmptySelection={true}
                isOpen={isOptionOpen}
                selectedKeys={[normalizePageSize(pageSize, 10).toString()]}
                size="sm"
                onOpenChange={setIsOptionOpen}
                onSelectionChange={(keys) => {
                  const newSize = parseInt(Array.from(keys)[0] as string);

                  handlePageSizeChange(newSize);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.toString()}
                    textValue={opt.toString()}
                    onPress={() => {
                      setIsOptionOpen(false); // Force close when any item is clicked
                    }}
                  >
                    {opt}
                  </SelectItem>
                ))}
              </Select>
              <span className="text-sm text-default-600">
                {t("pagination.perPage")}
              </span>
            </div>
          </div>

          <Card>
            <CardBody className="p-0 overflow-x-auto">
              {loading ? (
                <Table aria-label="Loading projects table">
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
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <div className="flex flex-col space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-20 rounded" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-20 rounded" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 rounded" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : projects.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    {searchQuery || projectNameFilter.trim() ? (
                      <SearchIcon
                        className="mx-auto text-default-400"
                        height={64}
                        width={64}
                      />
                    ) : (
                      <SearchIcon
                        className="mx-auto text-default-400"
                        height={64}
                        width={64}
                      />
                    )}
                    <div>
                      <p className="text-lg text-default-600">
                        {searchQuery || projectNameFilter.trim()
                          ? t("projects.noSearchResults") ||
                            `No projects found matching "${searchQuery || projectNameFilter}"`
                          : t("projects.noProjectsFound") ||
                            "No projects found"}
                      </p>
                      <p className="text-sm text-default-500">
                        {searchQuery || projectNameFilter.trim()
                          ? t("projects.tryDifferentSearch") ||
                            "Try adjusting your search terms or filters."
                          : totalProjects > 0
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
                            <span>
                              {project.projectOwnerEmployee?.fullName ||
                                t("common.none")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>
                              {project.alternativeOwnerEmployee?.fullName ||
                                t("common.none")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.owningUnit || t("common.none")}
                        </TableCell>
                        <TableCell>
                          {project.startDate?.split("T")[0] || ""}
                        </TableCell>
                        <TableCell>
                          {project.expectedCompletionDate?.split("T")[0] || ""}
                        </TableCell>
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
                              <DropdownItem
                                key="details"
                                startContent={<InfoIcon />}
                                onPress={() => handleViewDetails(project.id)}
                              >
                                {t("projects.viewDetails")}
                              </DropdownItem>

                              {hasPermission({
                                actions: ["projects.update"],
                              }) ? (
                                <DropdownItem
                                  key="edit"
                                  startContent={<EditIcon />}
                                  onPress={() => handleEditProject(project.id)}
                                >
                                  {t("projects.editProject")}
                                </DropdownItem>
                              ) : null}

                              {hasPermission({
                                actions: ["projects.sendToAnylsis"],
                              }) && project.status === 1 ? (
                                <DropdownItem
                                  key="send"
                                  startContent={<SendIcon />}
                                  onPress={() => handleSendProject(project)}
                                >
                                  {t("projects.send")}
                                </DropdownItem>
                              ) : null}

                              {hasPermission({
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
                {isEditing && (editLoading || !projectForEdit) ? (
                  <div className="space-y-6">
                    {/* Loading skeletons for form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      isRequired
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
                      isRequired
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
                              name={employee.fullName || t("common.none")}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {employee.gradeName}{" "}
                                {employee.fullName || t("common.none")}
                              </span>
                              <span className="text-sm text-default-500">
                                {employee.militaryNumber || "N/A"}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.userName || t("common.none")}
                              </span>
                            </div>
                          </div>
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                    <Autocomplete
                      allowsCustomValue
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
                          const selectedEmployee =
                            alternativeOwnerEmployees.find(
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
                              name={employee.fullName || t("common.none")}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {employee.gradeName}{" "}
                                {employee.fullName || t("common.none")}
                              </span>
                              <span className="text-sm text-default-500">
                                {employee.militaryNumber || "N/A"}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.userName || t("common.none")}
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
                        onOpenChange={(isOpen) => {
                          if (isOpen && analystEmployees.length === 0) {
                            searchAnalystEmployees("");
                          }
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
                                name={employee.fullName || t("common.none")}
                                size="sm"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {employee.gradeName}{" "}
                                  {employee.fullName || t("common.none")}
                                </span>
                                <span className="text-sm text-default-500">
                                  {employee.militaryNumber || "N/A"}
                                </span>
                                <span className="text-xs text-default-400">
                                  @{employee.userName || t("common.none")}
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
                      isRequired
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
                    {/* responsible manager */}
                    <div>
                      {selectedUnit && (
                        <Autocomplete
                          allowsCustomValue
                          isClearable
                          className="max-w-full"
                          inputValue={responsibleManagerInputValue}
                          isLoading={responsibleManagerSearchLoading}
                          items={responsibleManagers}
                          label={t("projects.selectResponsibleManager")}
                          placeholder={t("projects.searchManagers")}
                          selectedKey={
                            selectedResponsibleManager?.id.toString() || ""
                          }
                          onInputChange={(value) => {
                            setResponsibleManagerInputValue(value);
                            // Clear selection if input doesn't match the selected manager
                            if (
                              selectedResponsibleManager &&
                              value !==
                                `${selectedResponsibleManager.gradeName} ${selectedResponsibleManager.fullName}`
                            ) {
                              setSelectedResponsibleManager(null);
                              setFormData((prev) => ({
                                ...prev,
                                responsibleManagerId: 0,
                              }));
                            }
                            searchResponsibleManager(value);
                          }}
                          onSelectionChange={(key) => {
                            if (key) {
                              const managerId = key.toString();
                              const selectedManager = responsibleManagers.find(
                                (e) => e.id.toString() === managerId,
                              );

                              if (selectedManager) {
                                // Directly set all values to ensure consistency
                                setSelectedResponsibleManager(selectedManager);
                                setResponsibleManagerInputValue(
                                  `${selectedManager.gradeName} ${selectedManager.fullName}`,
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  responsibleManagerId: selectedManager.id,
                                }));
                              }
                            } else {
                              // Clear selection
                              setSelectedResponsibleManager(null);
                              setResponsibleManagerInputValue("");
                              setFormData((prev) => ({
                                ...prev,
                                responsibleManagerId: 0,
                              }));
                            }
                          }}
                        >
                          {responsibleManagers.map((employee) => (
                            <AutocompleteItem
                              key={employee.id.toString()}
                              textValue={`${employee.gradeName} ${employee.fullName}`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={employee.fullName || t("common.none")}
                                  size="sm"
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {employee.gradeName}{" "}
                                    {employee.fullName || t("common.none")}
                                  </span>
                                  <span className="text-sm text-default-500">
                                    {employee.militaryNumber || "N/A"}
                                  </span>
                                  <span className="text-xs text-default-400">
                                    @{employee.userName || t("common.none")}
                                  </span>
                                </div>
                              </div>
                            </AutocompleteItem>
                          ))}
                        </Autocomplete>
                      )}
                    </div>

                    <DatePicker
                      isRequired
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
                      isRequired
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
                        isRequired
                        errorMessage={validationErrors.description}
                        isInvalid={!!validationErrors.description}
                        label={t("projects.description")}
                        placeholder={t("projects.description")}
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          });
                          // Clear validation error when user starts typing
                          if (validationErrors.description) {
                            setValidationErrors({
                              ...validationErrors,
                              description: undefined,
                            });
                          }
                        }}
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
                )}
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
                  {t("projects.deleteConfirmMessage")}{" "}
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

      {/* Project Details Drawer */}
      <ProjectDetailsDrawer
        isOpen={isDetailsOpen}
        project={selectedProjectForDetails as any}
        loading={detailsLoading}
        onOpenChange={handleDetailsClose}
        onViewRequirements={(project) => {
          // Navigate to project requirements page
          navigate(`/requirements/${project.id}`);
          handleDetailsClose();
        }}
      />
    </>
  );
}
