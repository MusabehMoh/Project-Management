import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
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
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  FilterIcon,
  RefreshIcon,
  BuildingIcon,
  CalendarIcon,
} from "@/components/icons";
import { useTimelines } from "@/hooks/useTimelines";
import { useTimelineProjects } from "@/hooks/useTimelineProjects";
import { usePageTitle } from "@/hooks";
import { timelineService } from "@/services/api";
import { TimelineView, Timeline } from "@/types/timeline";
// Import timeline components
import TimelineTreeView from "@/components/timeline/TimelineTreeView";
import TimelineDetailsPanel from "@/components/timeline/TimelineDetailsPanel";
import TimelineCreateModal from "@/components/timeline/TimelineCreateModal";
import TimelineFilters from "@/components/timeline/TimelineFilters";
import DHTMLXGantt from "@/components/timeline/GanttChart/dhtmlx/DhtmlxGantt";
import AllProjectsOverview from "@/components/timeline/AllProjectsOverview";
// Import skeleton components
import TimelineTreeSkeleton from "@/components/timeline/skeletons/TimelineTreeSkeleton";
import TimelineGanttSkeleton from "@/components/timeline/skeletons/TimelineGanttSkeleton";
import TimelineSelectionSkeleton from "@/components/timeline/skeletons/TimelineSelectionSkeleton";

export default function TimelinePage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId")
    ? parseInt(searchParams.get("projectId")!)
    : undefined;
  const timelineId = searchParams.get("timelineId")
    ? parseInt(searchParams.get("timelineId")!)
    : undefined;
  const taskId = searchParams.get("taskId") || undefined;
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
    deleteEntity,
    updateEntity,
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

  // Load projects with basic timeline info for dropdown (Performance Optimized)
  const loadProjectsWithTimelineInfo = useCallback(async () => {
    if (!projects || projects.length === 0) return;

    const initialProjects = projects.map((project) => ({
      project,
      timelines: [], // Only basic timeline info for dropdown
      loading: true,
    }));

    setProjectsWithTimelines(initialProjects);

    // Get basic timeline info for all projects (no full hierarchy)
    const response = await timelineService.getProjectsWithTimelines();

    if (response.success && response.data) {
      const projectsWithTimelineData = projects.map((project) => {
        const projectData = response.data.find(
          (p: any) => p.projectId === project.id,
        );

        return {
          project,
          timelines: projectData?.timelines || [], // Basic timeline info only
          loading: false,
        };
      });

      setProjectsWithTimelines(projectsWithTimelineData);

      return;
    }
  }, [projects]);

  // Load full timeline hierarchy for a specific project (only when needed)
  const loadProjectTimelinesHierarchy = useCallback(
    async (projectId: number) => {
      try {
        const response = await timelineService.getProjectTimelines(projectId);

        if (response.success && response.data) {
          // Update the specific project in projectsWithTimelines with full hierarchy
          setProjectsWithTimelines((prev) =>
            prev.map((item) =>
              item.project.id === projectId
                ? { ...item, timelines: response.data, loading: false }
                : item,
            ),
          );

          return response.data;
        }
      } catch {
        // Error handled silently - projectsWithTimelines will show basic info
      }

      return [];
    },
    [],
  );

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
          // Refresh projects with basic timeline info for the dropdown
          if (projects.length > 0) {
            loadProjectsWithTimelineInfo();
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
      loadProjectsWithTimelineInfo,
      setSelectedTimeline,
    ],
  );

  // Enhanced sprint creation that refreshes dropdown data
  const handleCreateSprint = useCallback(
    async (sprintData: any) => {
      try {
        const newSprint = await createSprint(sprintData);

        if (newSprint) {
          // Refresh projects with basic timeline info for the dropdown
          if (projects.length > 0) {
            loadProjectsWithTimelineInfo();
          }
        }

        return newSprint;
      } catch (error) {
        throw error; // Re-throw to let the component handle it
      }
    },
    [createSprint, projects.length, loadProjectsWithTimelineInfo],
  );

  // Enhanced task update that refreshes dropdown data
  const handleUpdateTask = useCallback(
    async (data: any) => {
      try {
        const updatedTask = await updateTask(data);

        if (updatedTask) {
          // Refresh projects with basic timeline info for the dropdown to reflect changes
          if (projects.length > 0) {
            loadProjectsWithTimelineInfo();
          }
        }

        return updatedTask;
      } catch (error) {
        throw error; // Re-throw to let the component handle it
      }
    },
    [updateTask, projects.length, loadProjectsWithTimelineInfo],
  );

  // Enhanced sprint update that refreshes dropdown data
  const handleUpdateSprint = useCallback(
    async (data: any) => {
      try {
        const updatedSprint = await updateSprint(data);

        if (updatedSprint) {
          // Refresh projects with basic timeline info for the dropdown to reflect changes
          if (projects.length > 0) {
            loadProjectsWithTimelineInfo();
          }
        }

        return updatedSprint;
      } catch (error) {
        throw error; // Re-throw to let the component handle it
      }
    },
    [updateSprint, projects.length, loadProjectsWithTimelineInfo],
  );

  const refreshData = useCallback(() => {
    if (selectedProjectId) {
      // If we have a selected project, refresh that project's timelines
      fetchTimelines();
    }

    // Always refresh all projects with basic timeline info for the dropdown
    if (projects.length > 0) {
      loadProjectsWithTimelineInfo();
    }
  }, [
    fetchTimelines,
    selectedProjectId,
    projects.length,
    loadProjectsWithTimelineInfo,
  ]);

  // Load projects with basic timeline info when projects change - ALWAYS load for dropdown
  useEffect(() => {
    if (projects.length > 0) {
      // Always load all projects with basic timeline info for the dropdown
      loadProjectsWithTimelineInfo();
    }
  }, [projects.length, loadProjectsWithTimelineInfo]); // ✅ Remove selectedProjectId dependency

  // Auto-select project and timeline based on taskId parameter
  useEffect(() => {
    if (!taskId || !projects || projects.length === 0) return;

    const fetchTaskAndSelectProject = async () => {
      try {
        // Fetch task details
        const taskResponse = await timelineService.getTaskById(parseInt(taskId));
        if (taskResponse.success && taskResponse.data) {
          const task = taskResponse.data;
          // Task has sprintId, sprint has timelineId
          if (task.sprintId) {
            // Fetch sprint to get timelineId
            const sprintResponse = await timelineService.getSprintById(task.sprintId);
            if (sprintResponse.success && sprintResponse.data) {
              const sprint = sprintResponse.data;
              if (sprint.timelineId) {
                // Fetch timeline to get projectId
                const timelineResponse = await timelineService.getTimelineById(sprint.timelineId);
                if (timelineResponse.success && timelineResponse.data) {
                  const timeline = timelineResponse.data;
                  // Set projectId and timelineId in URL params
                  setSearchParams({
                    projectId: timeline.projectId.toString(),
                    timelineId: sprint.timelineId.toString(),
                    taskId: taskId,
                  });
                  setSelectedProjectId(timeline.projectId);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching task details:", error);
      }
    };

    fetchTaskAndSelectProject();
  }, [taskId, projects, setSearchParams]);

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

        // Fallback: Load full hierarchy for the project to find the timeline
        loadProjectTimelinesHierarchy(selectedProjectId).then(
          (projectTimelines) => {
            const urlTimeline = projectTimelines.find(
              (t: any) => t.id === timelineId,
            );

            if (urlTimeline) {
              setSelectedTimeline(urlTimeline);
            }
          },
        );

        return;
      }

      // Priority 2: Use timelines from useTimelines hook (more up-to-date)
      if (timelines.length > 0) {
        // Auto-select the first timeline (newest is at index 0 due to [newTimeline, ...prev])
        const latestTimeline = timelines[0];

        setSelectedTimeline(latestTimeline);

        return;
      }

      // Priority 3: Load full hierarchy if only basic info is available
      const projectWithTimelines = projectsWithTimelines.find(
        (p) => p.project.id === selectedProjectId,
      );

      if (projectWithTimelines && projectWithTimelines.timelines.length > 0) {
        // Check if we have basic info only (no sprints/tasks hierarchy)
        const firstTimeline = projectWithTimelines.timelines[0];

        if (!firstTimeline.sprints || firstTimeline.sprints.length === 0) {
          // Load full hierarchy
          loadProjectTimelinesHierarchy(selectedProjectId).then(
            (projectTimelines) => {
              if (projectTimelines.length > 0) {
                setSelectedTimeline(projectTimelines[0]);
              }
            },
          );
        } else {
          // We already have full hierarchy
          setSelectedTimeline(firstTimeline);
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
    loadProjectTimelinesHierarchy,
    t,
  ]);

  // Set page title
  usePageTitle("timeline.title");

  // UI state
  const [view, setView] = useState<TimelineView>({
    type: "tree", // Start with tree view by default
    showDetails: false, // Hidden by default
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
      <>
        <div className={`space-y-6 ${language === "ar" ? "rtl" : "ltr"}`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("timeline.pageTitle")}
              </h1>
              <p className="text-default-600">
                {t("timeline.pageDescription")}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                startContent={<FilterIcon />}
                variant="bordered"
                onPress={onFiltersOpen}
              >
                {t("timeline.filters")}
              </Button>
              <Button
                isIconOnly
                isLoading={true}
                variant="bordered"
                onPress={refreshData}
              >
                <RefreshIcon />
              </Button>
            </div>
          </div>

          {/* Timeline Selection Skeleton */}
          <TimelineSelectionSkeleton />

          {/* Main Content Skeleton */}
          <div className="space-y-6">
            {/* View Tabs Skeleton */}
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-default-200 rounded-lg animate-pulse" />
              <div className="h-10 w-24 bg-default-100 rounded-lg animate-pulse" />
            </div>

            {/* Timeline Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TimelineTreeSkeleton />
              </div>
              <div className="lg:col-span-1">
                <Card className="h-[600px]">
                  <CardHeader className="flex justify-between items-center">
                    <div className="h-6 w-16 bg-default-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-default-200 rounded animate-pulse" />
                  </CardHeader>
                  <Divider />
                  <CardBody className="p-4">
                    <div className="space-y-4">
                      <div className="h-4 w-3/4 bg-default-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-default-200 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-default-200 rounded animate-pulse" />
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${language === "ar" ? "rtl" : "ltr"}`}>
        {/* Error Display */}
        {error && (
          <Card className="border-2 border-danger-200 bg-danger-50 dark:bg-danger-950/30">
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-danger-100 dark:bg-danger-900/50 p-3 flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-danger" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-semibold text-danger">
                    {language === "ar"
                      ? "خطأ في تحميل الجداول الزمنية"
                      : "Error Loading Timelines"}
                  </h4>
                  <p className="text-sm text-danger-700 dark:text-danger-300">
                    {error}
                  </p>
                  <Button
                    className="mt-2"
                    color="danger"
                    size="sm"
                    startContent={<RefreshCw className="w-4 h-4" />}
                    variant="flat"
                    onPress={() => {
                      clearError();
                      refreshData();
                    }}
                  >
                    {language === "ar" ? "إعادة المحاولة" : "Try Again"}
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
            {/* Back to Overview button - shows when project is selected */}
            {selectedProjectId && (
              <Button
                startContent={<ArrowLeft className="w-4 h-4" />}
                variant="bordered"
                onPress={() => {
                  // Navigate back to overview - pass current selection via state
                  window.location.href = `/timeline?restore=${selectedProjectId}${selectedTimeline ? `-${selectedTimeline.id}` : ''}`;
                }}
              >
                {t("common.back")}
              </Button>
            )}
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
        {projectsLoading ? (
          <TimelineSelectionSkeleton />
        ) : (
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

                        // Check if we need to load full hierarchy
                        if (
                          !timeline.timeline.sprints ||
                          timeline.timeline.sprints.length === 0
                        ) {
                          // Load full hierarchy for better timeline view
                          loadProjectTimelinesHierarchy(
                            parseInt(projectIdStr),
                          ).then((projectTimelines) => {
                            const fullTimeline = projectTimelines.find(
                              (t: any) => t.id === timeline.timeline.id,
                            );

                            if (fullTimeline) {
                              setSelectedTimeline(fullTimeline);
                            } else {
                              setSelectedTimeline(timeline.timeline);
                            }
                          });
                        } else {
                          setSelectedTimeline(timeline.timeline);
                        }
                      }
                    }
                  }}
                >
                  {allTimelines.length === 0 ? (
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
                      {selectedTimeline.sprints?.length || 0}{" "}
                      {(selectedTimeline.sprints?.length || 0) !== 1
                        ? t("timeline.sprints")
                        : t("timeline.sprint")}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {(selectedTimeline.sprints || []).reduce(
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
        )}

        {/* Main Content */}
        {!selectedProjectId && !projectsLoading ? (
          // Show all projects overview when no project is selected
          <AllProjectsOverview projects={projects} />
        ) : timelines.length === 0 ? (
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
            {/* View Tabs - RTL Support */}
            <Tabs
              className="w-full"
              classNames={
                language === "ar"
                  ? {
                      tabList: "flex-row-reverse",
                      cursor: "rtl-cursor",
                    }
                  : undefined
              }
              selectedKey={view.type}
              onSelectionChange={(key) =>
                handleViewChange({ type: key as "gantt" | "tree" | "timeline" })
              }
            >
              <Tab key="gantt" title={t("timeline.ganttView")} />
              <Tab key="tree" title={t("timeline.treeView")} />
            </Tabs>
            {/* Timeline Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main View */}
              <div
                className={view.showDetails ? "lg:col-span-2" : "lg:col-span-3"}
              >
                <Card className="h-[600px]">
                  <CardBody className="p-0">
                    {loading && selectedTimeline ? (
                      // Show skeleton when refreshing existing timeline
                      view.type === "gantt" ? (
                        <TimelineGanttSkeleton height="600px" />
                      ) : (
                        <TimelineTreeSkeleton />
                      )
                    ) : view.type === "gantt" ? (
                      <DHTMLXGantt
                        projectId={selectedProjectId}
                        timeline={selectedTimeline}
                        onDeleteEntity={deleteEntity}
                        onUpdateEntity={updateEntity}
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
                        onUpdateTimeline={updateTimeline}
                        highlightTaskId={taskId}
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
    </>
  );
}
