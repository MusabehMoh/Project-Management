import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PlusIcon,
  FilterIcon,
  RefreshIcon,
  BuildingIcon,
  CalendarIcon,
} from "@/components/icons";
import { useTimelines } from "@/hooks/useTimelines";
import { useTimelineProjects } from "@/hooks/useTimelineProjects";
import { timelineService } from "@/services/api";
import { TimelineView, Timeline } from "@/types/timeline";
// Import timeline components
import TimelineTreeView from "@/components/timeline/TimelineTreeView";
import TimelineGanttView from "@/components/timeline/TimelineGanttView";
import TimelineDetailsPanel from "@/components/timeline/TimelineDetailsPanel";
import TimelineCreateModal from "@/components/timeline/TimelineCreateModal";
import TimelineFilters from "@/components/timeline/TimelineFilters";

export default function TimelinePage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId")
    ? parseInt(searchParams.get("projectId")!)
    : undefined;
  const timelineId = searchParams.get("timelineId")
    ? parseInt(searchParams.get("timelineId")!)
    : undefined;
  const requirementId = searchParams.get("requirementId")
    ? parseInt(searchParams.get("requirementId")!)
    : undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | undefined
  >(projectId);

  // Projects hook for all projects (optimized for timeline - no users/owning-units loading)
  const {
    projects,
    loading: projectsLoading,
    loadProjects,
  } = useTimelineProjects();

  // Effect to load all projects for timeline dropdown
  useEffect(() => {
    // Load all projects (up to 100) for the timeline dropdown
    loadProjects(1, 100);
  }, [loadProjects]);

  // State for all projects with their timelines (including projects with no timelines)
  const [projectsWithTimelines, setProjectsWithTimelines] = useState<
    Array<{
      project: any;
      timelines: Timeline[];
      loading: boolean;
    }>
  >([]);

  // Timeline state management - only run when projects are loaded and we have a selected project
  const {
    timelines,
    selectedTimeline,
    departments,
    loading,
    error,
    createTimeline,
    updateTimeline,
    createSprint,
    updateSprint,
    deleteSprint,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    moveTaskToSprint,
    updateSubtask,
    setSelectedTimeline,
    loadTimelines: fetchTimelines,
  } = useTimelines(
    selectedProjectId && !projectsLoading ? selectedProjectId : undefined,
  ); // ✅ Only load when projects are ready

  // Add temporary placeholder functions for GanttView compatibility
  const createSubtask = async () => null;
  const deleteSubtask = async () => false;

  // Add missing filter functionality
  const [filters, setFilters] = useState({
    departments: [],
    members: [],
    status: [],
    priority: [],
  });

  const applyFilters = useCallback((newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      departments: [],
      members: [],
      status: [],
      priority: [],
    });
  }, []);

  const clearError = useCallback(() => {
    // Error clearing would be handled by the hook
  }, []);

  // Load all projects and their timelines with a single API call (Performance Optimized)
  const loadAllProjectsWithTimelines = useCallback(async () => {
    if (!projects || projects.length === 0) return;

    const initialProjects = projects.map((project) => ({
      project,
      timelines: [],
      loading: true,
    }));

    setProjectsWithTimelines(initialProjects);

    try {
      // Try the bulk endpoint first for optimal performance
      const response = await timelineService.getProjectsWithTimelines();

      if (response.success && response.data) {
        const projectsWithTimelineData = projects.map((project) => {
          const projectData = response.data.find(
            (p: any) => p.projectId === project.id,
          );

          return {
            project,
            timelines: projectData?.timelines || [],
            loading: false,
          };
        });

        setProjectsWithTimelines(projectsWithTimelineData);

        return;
      }

      // Fall back to individual API calls
      throw new Error("Bulk endpoint failed");
    } catch {
      // Fall back to individual API calls
      const projectTimelinePromises = projects.map(async (project) => {
        try {
          const response = await timelineService.getProjectTimelines(
            project.id,
          );

          return {
            project,
            timelines: response.data || [],
            loading: false,
          };
        } catch {
          return {
            project,
            timelines: [],
            loading: false,
          };
        }
      });

      const results = await Promise.all(projectTimelinePromises);

      setProjectsWithTimelines(results);
    }
  }, [projects]);

  // Enhanced timeline creation that refreshes data and auto-selects new timeline
  const handleCreateTimeline = useCallback(
    async (timelineData: any) => {
      try {
        // Clear current selection to ensure new timeline gets selected
        setSelectedTimeline(null);

        const newTimeline = await createTimeline(timelineData);

        if (newTimeline) {
          // Refresh timelines for the current project
          await fetchTimelines();
          // Refresh projects with timelines for the dropdown
          if (projects.length > 0) {
            loadAllProjectsWithTimelines();
          }
          // The useEffect will auto-select the new timeline
        }

        return newTimeline;
      } catch (error) {
        throw error; // Re-throw to let the modal handle it
      }
    },
    [
      createTimeline,
      fetchTimelines,
      projects.length,
      loadAllProjectsWithTimelines,
      setSelectedTimeline,
    ],
  );

  // Enhanced sprint creation that refreshes dropdown data
  const handleCreateSprint = useCallback(
    async (sprintData: any) => {
      try {
        const newSprint = await createSprint(sprintData);

        if (newSprint) {
          // Refresh projects with timelines for the dropdown
          if (projects.length > 0) {
            loadAllProjectsWithTimelines();
          }
        }

        return newSprint;
      } catch (error) {
        throw error; // Re-throw to let the component handle it
      }
    },
    [createSprint, projects.length, loadAllProjectsWithTimelines],
  );

  // Enhanced task update that refreshes dropdown data
  const handleUpdateTask = useCallback(
    async (data: any) => {
      try {
        const updatedTask = await updateTask(data);

        if (updatedTask) {
          // Refresh projects with timelines for the dropdown to reflect changes
          if (projects.length > 0) {
            loadAllProjectsWithTimelines();
          }
        }

        return updatedTask;
      } catch (error) {
        throw error; // Re-throw to let the component handle it
      }
    },
    [updateTask, projects.length, loadAllProjectsWithTimelines],
  );

  // Enhanced sprint update that refreshes dropdown data
  const handleUpdateSprint = useCallback(
    async (data: any) => {
      try {
        const updatedSprint = await updateSprint(data);

        if (updatedSprint) {
          // Refresh projects with timelines for the dropdown to reflect changes
          if (projects.length > 0) {
            loadAllProjectsWithTimelines();
          }
        }

        return updatedSprint;
      } catch (error) {
        throw error; // Re-throw to let the component handle it
      }
    },
    [updateSprint, projects.length, loadAllProjectsWithTimelines],
  );

  const refreshData = useCallback(() => {
    if (selectedProjectId) {
      // If we have a selected project, refresh that project's timelines
      fetchTimelines();
    }

    // Always refresh all projects with timelines for the dropdown
    if (projects.length > 0) {
      loadAllProjectsWithTimelines();
    }
  }, [
    fetchTimelines,
    selectedProjectId,
    projects.length,
    loadAllProjectsWithTimelines,
  ]);

  // Load projects with timelines when projects change - ALWAYS load for dropdown
  useEffect(() => {
    if (projects.length > 0) {
      // Always load all projects with timelines for the dropdown
      loadAllProjectsWithTimelines();
    }
  }, [projects.length, loadAllProjectsWithTimelines]); // ✅ Remove selectedProjectId dependency

  // Auto-select timeline when data loads and we have a selected project
  useEffect(() => {
    if (selectedProjectId && !selectedTimeline) {
      // Priority 1: If timelineId is provided in URL, find and select that specific timeline
      if (timelineId) {
        // First try to find in timelines from useTimelines hook (more up-to-date)
        if (timelines.length > 0) {
          const urlTimeline = timelines.find((t) => t.id === timelineId);

          if (urlTimeline) {
            setSelectedTimeline(urlTimeline);

            return;
          }
        }

        // Fallback: Try to find in projectsWithTimelines
        if (projectsWithTimelines.length > 0) {
          for (const projectWithTimelines of projectsWithTimelines) {
            const urlTimeline = projectWithTimelines.timelines.find(
              (t) => t.id === timelineId,
            );

            if (urlTimeline) {
              // Also update the selected project if the timeline belongs to a different project
              if (projectWithTimelines.project.id !== selectedProjectId) {
                setSelectedProjectId(projectWithTimelines.project.id);
              }
              setSelectedTimeline(urlTimeline);

              return;
            }
          }
        }
      }

      // Priority 2: Use timelines from useTimelines hook (more up-to-date)
      if (timelines.length > 0) {
        // Auto-select the first timeline (newest is at index 0 due to [newTimeline, ...prev])
        const latestTimeline = timelines[0];

        setSelectedTimeline(latestTimeline);

        return;
      }

      // Priority 3: Fall back to projectsWithTimelines if timelines not loaded yet
      if (projectsWithTimelines.length > 0) {
        const projectWithTimelines = projectsWithTimelines.find(
          (p) => p.project.id === selectedProjectId,
        );

        if (projectWithTimelines && projectWithTimelines.timelines.length > 0) {
          setSelectedTimeline(projectWithTimelines.timelines[0]);
        }
      }
    }
  }, [
    selectedProjectId,
    timelineId,
    timelines,
    projectsWithTimelines,
    selectedTimeline,
    setSelectedTimeline,
    setSelectedProjectId,
    t,
  ]);

  // Set page title
  useEffect(() => {
    document.title = `${t("timeline.title")} - PMA`;

    return () => {
      document.title = "PMA";
    };
  }, [t]);

  // UI state
  const [view, setView] = useState<TimelineView>({
    type: "tree", // Start with tree view by default
    showDetails: true,
    selectedItem: undefined,
    selectedItemType: undefined,
    filters: {
      departments: [],
      members: [],
      status: [],
      priority: [],
    },
  });

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onOpenChange: onCreateOpenChange,
  } = useDisclosure();
  const {
    isOpen: isFiltersOpen,
    onOpen: onFiltersOpen,
    onOpenChange: onFiltersOpenChange,
  } = useDisclosure();

  // Handle project selection
  const handleProjectSelect = useCallback(
    (projectIdStr: string) => {
      const projectIdNum = parseInt(projectIdStr);

      // Prevent unnecessary updates if same project is selected
      if (projectIdNum === selectedProjectId) {
        return;
      }

      setSelectedProjectId(projectIdNum);

      // Auto-select the first timeline for this project if available
      const projectWithTimelines = projectsWithTimelines.find(
        (p) => p.project.id === projectIdNum,
      );

      if (projectWithTimelines && projectWithTimelines.timelines.length > 0) {
        // Auto-select the first timeline
        setSelectedTimeline(projectWithTimelines.timelines[0]);
      } else {
        // Clear selected timeline if no timelines available
        setSelectedTimeline(null);
      }

      // Update URL with new project ID
      const newSearchParams = new URLSearchParams(searchParams);

      newSearchParams.set("projectId", projectIdStr);
      setSearchParams(newSearchParams);
    },
    [
      selectedProjectId,
      projectsWithTimelines,
      searchParams,
      setSearchParams,
      setSelectedTimeline,
    ],
  );

  // Get all timelines from ALL projects for the dropdown
  const getAllTimelinesWithProjects = () => {
    const allTimelines: Array<{
      key: string;
      id: string;
      name: string;
      projectId: number;
      projectName: string;
      timeline: any;
      isProject: boolean;
      loading?: boolean;
    }> = [];

    projectsWithTimelines.forEach(
      ({ project, timelines: projectTimelines, loading }) => {
        // Add project as a header - ALWAYS show all projects
        allTimelines.push({
          key: `project-${project.id}`,
          id: "",
          name: project.applicationName || `Project ${project.id}`,
          projectId: project.id,
          projectName: project.applicationName || `Project ${project.id}`,
          timeline: null,
          isProject: true,
          loading,
        });

        // Add timelines for this project if any exist
        if (loading) {
          // Show loading state for this project
          allTimelines.push({
            key: `loading-${project.id}`,
            id: "",
            name: "", // Will be translated in the JSX
            projectId: project.id,
            projectName: project.applicationName || `Project ${project.id}`,
            timeline: null,
            isProject: false,
            loading: true,
          });
        } else if (projectTimelines.length > 0) {
          // Show actual timelines
          projectTimelines.forEach((timeline) => {
            allTimelines.push({
              key: `${project.id}-${timeline.id}`,
              id: timeline.id.toString(),
              name: timeline.name,
              projectId: project.id,
              projectName: project.applicationName || `Project ${project.id}`,
              timeline: timeline,
              isProject: false,
            });
          });
        } else {
          // Show "no timelines" message
          allTimelines.push({
            key: `no-timelines-${project.id}`,
            id: "",
            name: "", // Will be translated in the JSX
            projectId: project.id,
            projectName: project.applicationName || `Project ${project.id}`,
            timeline: null,
            isProject: false,
          });
        }
      },
    );

    return allTimelines;
  };

  const allTimelines = useMemo(
    () => getAllTimelinesWithProjects(),
    [projectsWithTimelines],
  );

  // Debug logging removed

  // Handle view changes
  const handleViewChange = (newView: Partial<TimelineView>) => {
    setView((prev) => ({ ...prev, ...newView }));
  };

  // Handle item selection
  const handleItemSelect = (
    itemId: string,
    itemType: "timeline" | "sprint" | "task" | "subtask",
  ) => {
    setView((prev) => ({
      ...prev,
      selectedItem: itemId,
      selectedItemType: itemType,
      showDetails: true,
    }));
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === "INPUT") return;

      if (event.key === "n" && event.ctrlKey) {
        event.preventDefault();
        onCreateOpen();
      } else if (event.key === "f" && event.ctrlKey) {
        event.preventDefault();
        onFiltersOpen();
      } else if (event.key === "r" && event.ctrlKey) {
        event.preventDefault();
        refreshData();
      } else if (event.key === "1" && event.ctrlKey) {
        event.preventDefault();
        setView((prev) => ({ ...prev, type: "gantt" }));
      } else if (event.key === "2" && event.ctrlKey) {
        event.preventDefault();
        setView((prev) => ({ ...prev, type: "tree" }));
      } else if (event.key === "Escape") {
        setView((prev) => ({
          ...prev,
          showDetails: false,
          selectedItem: undefined,
        }));
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCreateOpen, onFiltersOpen, refreshData]);

  if (loading && timelines.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Spinner color="primary" size="lg" />
            <div>
              <p className="text-default-600">{t("common.loading")}</p>
              <p className="text-sm text-default-500">
                Loading project timelines...
              </p>
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className={`space-y-6 ${language === "ar" ? "rtl" : "ltr"}`}>
        {/* Error Display */}
        {error && (
          <Card className="border-danger">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="text-danger">⚠️</div>
                <div>
                  <p className="text-danger font-medium">
                    Error Loading Timelines
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("timeline.pageTitle")}
            </h1>
            <p className="text-default-600">{t("timeline.pageDescription")}</p>
          </div>

          <div className="flex gap-2">
            {/* <Button
              color="primary"
              isDisabled={loading}
              startContent={<PlusIcon />}
              onPress={onCreateOpen}
            >
              {t("timeline.newTimeline")}
            </Button> */}
            <Button
              startContent={<FilterIcon />}
              variant="bordered"
              onPress={onFiltersOpen}
            >
              {t("timeline.filters")}
            </Button>
            <Button
              isIconOnly
              isLoading={loading}
              variant="bordered"
              onPress={refreshData}
            >
              <RefreshIcon />
            </Button>
          </div>
        </div>

        {/* Timeline Selection and Quick Stats */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Select
                className="min-w-[400px]"
                label={t("timeline.selectProjectTimeline")}
                placeholder={t("timeline.chooseProjectTimeline")}
                selectedKeys={(() => {
                  let keysToSelect: string[] = [];

                  if (selectedTimeline && selectedProjectId) {
                    const timelineKey = `${selectedProjectId}-${selectedTimeline.id}`;

                    if (allTimelines.some((t) => t.key === timelineKey)) {
                      keysToSelect = [timelineKey];
                    }
                  } else if (selectedProjectId) {
                    const projectKey = `project-${selectedProjectId}`;

                    if (allTimelines.some((t) => t.key === projectKey)) {
                      keysToSelect = [projectKey];
                    }
                  }

                  return keysToSelect;
                })()}
                size="sm"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  if (selectedKey && selectedKey.startsWith("project-")) {
                    // User clicked on a project header - just select the project
                    const projectIdStr = selectedKey.replace("project-", "");

                    handleProjectSelect(projectIdStr);
                  } else if (
                    selectedKey &&
                    !selectedKey.startsWith("no-timelines-")
                  ) {
                    // User selected an actual timeline
                    const [projectIdStr] = selectedKey.split("-");
                    const timeline = allTimelines.find(
                      (t) => t.key === selectedKey && !t.isProject,
                    );

                    if (timeline && timeline.timeline) {
                      handleProjectSelect(projectIdStr);
                      setSelectedTimeline(timeline.timeline);
                    }
                  }
                }}
              >
                {projectsLoading ? (
                  <SelectItem key="loading-projects" isDisabled>
                    {t("timeline.loadingProjects")}
                  </SelectItem>
                ) : allTimelines.length === 0 ? (
                  <SelectItem key="no-projects" isDisabled>
                    {t("timeline.noProjectsAvailable")}
                  </SelectItem>
                ) : (
                  allTimelines.map((item) => (
                    <SelectItem
                      key={item.key}
                      isDisabled={
                        item.key.startsWith("no-timelines-") ||
                        item.key.startsWith("loading-")
                      }
                      textValue={item.name}
                    >
                      {item.isProject ? (
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <BuildingIcon className="w-4 h-4" />
                          {item.name}
                          {item.loading && (
                            <span className="text-xs text-default-400">
                              (loading...)
                            </span>
                          )}
                        </div>
                      ) : item.key.startsWith("loading-") ? (
                        <div className="ml-6 text-default-400 italic text-sm flex items-center gap-2">
                          <div className="w-3 h-3 border border-default-300 border-t-primary rounded-full animate-spin" />
                          {t("timeline.loadingTimelines")}
                        </div>
                      ) : item.key.startsWith("no-timelines-") ? (
                        <div className="ml-6 text-default-500 italic text-sm">
                          {t("timeline.noTimelines")}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 ml-6 text-default-700">
                          <CalendarIcon className="w-4 h-4" />
                          {item.name}
                        </div>
                      )}
                    </SelectItem>
                  ))
                )}
              </Select>

              {selectedTimeline && (
                <div className="flex gap-2">
                  <Chip size="sm" variant="flat">
                    {selectedTimeline.sprints.length}{" "}
                    {selectedTimeline.sprints.length !== 1
                      ? t("timeline.sprints")
                      : t("timeline.sprint")}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {selectedTimeline.sprints.reduce(
                      (acc: number, sprint: any) => {
                        // Count direct sprint tasks
                        const directTasks = (sprint.tasks || []).length;

                        // Count tasks in requirements structure
                        const requirementTasks = (
                          sprint.requirements || []
                        ).reduce(
                          (reqAcc: number, req: any) =>
                            reqAcc + (req.tasks?.length || 0),
                          0,
                        );

                        return acc + directTasks + requirementTasks;
                      },
                      0,
                    )}{" "}
                    {t("timeline.tasks")}
                  </Chip>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {timelines.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="space-y-4">
                <div className="mb-4">
                  <CalendarIcon className="w-16 h-16 mx-auto text-default-300" />
                </div>
                <div>
                  <p className="text-lg text-default-600">
                    {t("timeline.noTimelinesFound")}
                  </p>
                  <p className="text-sm text-default-500">
                    {selectedProjectId
                      ? t("timeline.noTimelinesDescription")
                      : t("timeline.noTimelinesGeneral")}
                  </p>
                </div>
                {/* <Button
                  color="primary"
                  startContent={<PlusIcon />}
                  onPress={onCreateOpen}
                >
                  {t("timeline.createTimeline")}
                </Button> */}
              </div>
            </CardBody>
          </Card>
        ) : !selectedTimeline ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="space-y-4">
                <div className="mb-4">
                  <CalendarIcon className="w-16 h-16 mx-auto text-default-300" />
                </div>
                <div>
                  <p className="text-lg text-default-600">
                    {t("timeline.selectTimeline")}
                  </p>
                  <p className="text-sm text-default-500">
                    {t("timeline.selectTimelineDescription")}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* View Tabs */}
            <Tabs
              className="w-full"
              selectedKey={view.type}
              onSelectionChange={(key) =>
                handleViewChange({ type: key as "gantt" | "tree" | "timeline" })
              }
            >
              <Tab key="gantt" title={t("timeline.ganttView")} />
              <Tab key="tree" title={t("timeline.treeView")} />
            </Tabs>{" "}
            {/* Timeline Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main View */}
              <div
                className={view.showDetails ? "lg:col-span-2" : "lg:col-span-3"}
              >
                <Card className="h-[600px]">
                  <CardBody className="p-0">
                    {view.type === "gantt" ? (
                      <TimelineGanttView
                        departments={departments}
                        filters={filters}
                        loading={loading}
                        selectedItem={view.selectedItem}
                        timeline={selectedTimeline}
                        onCreateSprint={handleCreateSprint}
                        onCreateSubtask={createSubtask}
                        onCreateTask={createTask}
                        onDeleteSprint={deleteSprint}
                        onDeleteSubtask={deleteSubtask}
                        onDeleteTask={deleteTask}
                        onItemSelect={handleItemSelect}
                        onUpdateSprint={handleUpdateSprint}
                        onUpdateSubtask={updateSubtask}
                        onUpdateTask={handleUpdateTask}
                      />
                    ) : (
                      <TimelineTreeView
                        departments={departments}
                        filters={filters}
                        loading={loading}
                        selectedItem={view.selectedItem}
                        timeline={selectedTimeline}
                        onCreateSprint={handleCreateSprint}
                        onCreateSubtask={createSubtask}
                        onCreateTask={createTask}
                        onDeleteSprint={deleteSprint}
                        onDeleteSubtask={deleteSubtask}
                        onDeleteTask={deleteTask}
                        onItemSelect={handleItemSelect}
                        onMoveTask={moveTask}
                        onMoveTaskToSprint={moveTaskToSprint}
                        onUpdateSprint={handleUpdateSprint}
                        onUpdateSubtask={updateSubtask}
                        onUpdateTask={handleUpdateTask}
                      />
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Details Panel */}
              {view.showDetails && (
                <div className="lg:col-span-1">
                  <Card className="h-[600px]">
                    <CardHeader className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {t("timeline.details")}
                      </h3>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewChange({ showDetails: false })}
                      >
                        ✕
                      </Button>
                    </CardHeader>
                    <Divider />
                    <CardBody className="p-0">
                      <TimelineDetailsPanel
                        departments={departments}
                        loading={loading}
                        selectedItem={view.selectedItem}
                        selectedItemType={view.selectedItemType}
                        timeline={selectedTimeline}
                        onUpdateSprint={handleUpdateSprint}
                        onUpdateSubtask={updateSubtask}
                        onUpdateTask={handleUpdateTask}
                        onUpdateTimeline={updateTimeline}
                      />
                    </CardBody>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Timeline Modal */}
        <TimelineCreateModal
          isOpen={isCreateOpen}
          loading={loading}
          projectId={selectedProjectId}
          onCreateTimeline={handleCreateTimeline}
          onOpenChange={onCreateOpenChange}
        />

        {/* Filters Modal */}
        <Modal
          isOpen={isFiltersOpen}
          size="2xl"
          onOpenChange={onFiltersOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <FilterIcon />
                    {t("timeline.timelineFilters")}
                  </div>
                </ModalHeader>
                <ModalBody>
                  <TimelineFilters
                    departments={departments}
                    filters={filters}
                    onClearFilters={clearFilters}
                    onFiltersChange={applyFilters}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={clearFilters}>
                    {t("timeline.clearAll")}
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    {t("timeline.applyFilters")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
