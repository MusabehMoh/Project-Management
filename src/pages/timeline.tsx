import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
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
import { PlusIcon, FilterIcon, RefreshIcon, BuildingIcon, CalendarIcon } from "@/components/icons";
import { useTimelines } from "@/hooks/useTimelines";
import { useProjects } from "@/hooks/useProjects";
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
  const projectId = searchParams.get('projectId') ? parseInt(searchParams.get('projectId')!) : undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(projectId);

  // Projects hook for all projects
  const { projects, loading: projectsLoading } = useProjects();

  // State for all projects with their timelines (including projects with no timelines)
  const [projectsWithTimelines, setProjectsWithTimelines] = useState<Array<{
    project: any;
    timelines: Timeline[];
    loading: boolean;
  }>>([]);

  // Timeline state management
  const {
    timelines,
    selectedTimeline,
    departments,
    resources,
    loading,
    error,
    createTimeline,
    updateTimeline,
    deleteTimeline,
    createSprint,
    updateSprint,
    deleteSprint,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    setSelectedTimeline,
    loadTimelines: fetchTimelines
  } = useTimelines(selectedProjectId);

  // Add missing filter functionality
  const [filters, setFilters] = useState({
    departments: [],
    resources: [],
    status: [],
    priority: [],
    search: ''
  });

  const applyFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      departments: [],
      resources: [],
      status: [],
      priority: [],
      search: ''
    });
  }, []);

  const clearError = useCallback(() => {
    // Error clearing would be handled by the hook
  }, []);

  const refreshData = useCallback(() => {
    fetchTimelines();
    loadAllProjectsWithTimelines();
  }, [fetchTimelines]);

  // Load all projects and their timelines
  const loadAllProjectsWithTimelines = useCallback(async () => {
    if (!projects.length) return;

    // Initialize all projects with loading state
    const initialProjects = projects.map(project => ({
      project,
      timelines: [],
      loading: true
    }));
    setProjectsWithTimelines(initialProjects);

    try {
      // Load all timelines in parallel without individual state updates
      const projectTimelinePromises = projects.map(async (project) => {
        try {
          const response = await timelineService.getProjectTimelines(project.id);
          return {
            project,
            timelines: response.data || [],
            loading: false
          };
        } catch (error) {
          console.warn(`Failed to load timelines for project ${project.id}:`, error);
          return {
            project,
            timelines: [],
            loading: false
          };
        }
      });

      // Wait for all to complete and update state once
      const results = await Promise.all(projectTimelinePromises);
      setProjectsWithTimelines(results);
      
    } catch (error) {
      console.error('Failed to load projects with timelines:', error);
    }
  }, [projects]);

  // Load projects with timelines when projects change
  useEffect(() => {
    if (projects.length > 0) {
      loadAllProjectsWithTimelines();
    }
  }, [projects]); // Removed loadAllProjectsWithTimelines from dependencies

  // Auto-select timeline when projectsWithTimelines loads and we have a selected project
  useEffect(() => {
    if (selectedProjectId && projectsWithTimelines.length > 0 && !selectedTimeline) {
      const projectWithTimelines = projectsWithTimelines.find(
        p => p.project.id === selectedProjectId
      );
      
      if (projectWithTimelines && projectWithTimelines.timelines.length > 0) {
        console.log('Auto-selecting first timeline for project', selectedProjectId);
        setSelectedTimeline(projectWithTimelines.timelines[0]);
      }
    }
  }, [selectedProjectId, projectsWithTimelines, selectedTimeline, setSelectedTimeline]);

  // UI state
  const [view, setView] = useState<TimelineView>({
    type: 'tree', // Start with tree view by default
    showDetails: true,
    selectedItem: undefined,
    selectedItemType: undefined,
    filters: {
      departments: [],
      resources: [],
      status: [],
      priority: [],
      search: ''
    }
  });

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
  const { isOpen: isFiltersOpen, onOpen: onFiltersOpen, onOpenChange: onFiltersOpenChange } = useDisclosure();

  // Handle project selection
  const handleProjectSelect = useCallback((projectIdStr: string) => {
    const projectIdNum = parseInt(projectIdStr);
    console.log('Selecting project:', projectIdNum, 'Current:', selectedProjectId);
    
    // Prevent unnecessary updates if same project is selected
    if (projectIdNum === selectedProjectId) {
      console.log('Same project selected, skipping update');
      return;
    }
    
    setSelectedProjectId(projectIdNum);
    
    // Auto-select the first timeline for this project if available
    const projectWithTimelines = projectsWithTimelines.find(
      p => p.project.id === projectIdNum
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
    newSearchParams.set('projectId', projectIdStr);
    setSearchParams(newSearchParams);
  }, [selectedProjectId, projectsWithTimelines, searchParams, setSearchParams, setSelectedTimeline]);

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

    projectsWithTimelines.forEach(({ project, timelines: projectTimelines, loading }) => {
      // Add project as a header - ALWAYS show all projects
      allTimelines.push({
        key: `project-${project.id}`,
        id: '',
        name: project.applicationName || `Project ${project.id}`,
        projectId: project.id,
        projectName: project.applicationName || `Project ${project.id}`,
        timeline: null,
        isProject: true,
        loading
      });

      // Add timelines for this project if any exist
      if (loading) {
        // Show loading state for this project
        allTimelines.push({
          key: `loading-${project.id}`,
          id: '',
          name: 'Loading timelines...',
          projectId: project.id,
          projectName: project.applicationName || `Project ${project.id}`,
          timeline: null,
          isProject: false,
          loading: true
        });
      } else if (projectTimelines.length > 0) {
        // Show actual timelines
        projectTimelines.forEach(timeline => {
          allTimelines.push({
            key: `${project.id}-${timeline.id}`,
            id: timeline.id,
            name: timeline.name,
            projectId: project.id,
            projectName: project.applicationName || `Project ${project.id}`,
            timeline: timeline,
            isProject: false
          });
        });
      } else {
        // Show "no timelines" message
        allTimelines.push({
          key: `no-timelines-${project.id}`,
          id: '',
          name: 'No timelines - Click "New Timeline" to create one',
          projectId: project.id,
          projectName: project.applicationName || `Project ${project.id}`,
          timeline: null,
          isProject: false
        });
      }
    });

    return allTimelines;
  };

  const allTimelines = useMemo(() => getAllTimelinesWithProjects(), [projectsWithTimelines]);
  
  // Debug logging (temporarily disabled)
  // console.log('Timeline page render:', {
  //   selectedProjectId,
  //   projects: projects.length,
  //   projectsWithTimelines: projectsWithTimelines.length,
  //   allTimelines: allTimelines.length
  // });

  // Handle view changes
  const handleViewChange = (newView: Partial<TimelineView>) => {
    setView(prev => ({ ...prev, ...newView }));
  };

  // Handle item selection
  const handleItemSelect = (itemId: string, itemType: 'timeline' | 'sprint' | 'task' | 'subtask') => {
    setView(prev => ({
      ...prev,
      selectedItem: itemId,
      selectedItemType: itemType,
      showDetails: true
    }));
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (event.key === 'n' && event.ctrlKey) {
        event.preventDefault();
        onCreateOpen();
      } else if (event.key === 'f' && event.ctrlKey) {
        event.preventDefault();
        onFiltersOpen();
      } else if (event.key === 'r' && event.ctrlKey) {
        event.preventDefault();
        refreshData();
      } else if (event.key === '1' && event.ctrlKey) {
        event.preventDefault();
        setView(prev => ({ ...prev, type: 'gantt' }));
      } else if (event.key === '2' && event.ctrlKey) {
        event.preventDefault();
        setView(prev => ({ ...prev, type: 'tree' }));
      } else if (event.key === 'Escape') {
        setView(prev => ({ ...prev, showDetails: false, selectedItem: undefined }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCreateOpen, onFiltersOpen, refreshData]);

  if (loading && timelines.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Spinner size="lg" color="primary" />
            <div>
              <p className="text-default-600">{t("common.loading")}</p>
              <p className="text-sm text-default-500">Loading project timelines...</p>
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
                  <p className="text-danger font-medium">Error Loading Timelines</p>
                  <p className="text-sm text-default-600">{error}</p>
                  <Button 
                    size="sm" 
                    color="danger" 
                    variant="light" 
                    className="mt-2"
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
              Project Timeline
            </h1>
            <p className="text-default-600">
              Manage project timelines, sprints, tasks, and subtasks
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={<PlusIcon />}
              onPress={onCreateOpen}
              isDisabled={loading}
            >
              New Timeline
            </Button>
            <Button
              variant="bordered"
              startContent={<FilterIcon />}
              onPress={onFiltersOpen}
            >
              Filters
            </Button>
            <Button
              variant="bordered"
              isIconOnly
              onPress={refreshData}
              isLoading={loading}
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
                label="Select Project & Timeline"
                placeholder="Choose a project and timeline"
                selectedKeys={
                  selectedTimeline && selectedProjectId 
                    ? [`${selectedProjectId}-${selectedTimeline.id}`]
                    : selectedProjectId 
                      ? [`project-${selectedProjectId}`]
                      : []
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  console.log('Selected key:', selectedKey);
                  
                  if (selectedKey && selectedKey.startsWith('project-')) {
                    // User clicked on a project header - just select the project
                    const projectIdStr = selectedKey.replace('project-', '');
                    handleProjectSelect(projectIdStr);
                  } else if (selectedKey && !selectedKey.startsWith('no-timelines-')) {
                    // User selected an actual timeline
                    const [projectIdStr, timelineId] = selectedKey.split('-');
                    const timeline = allTimelines.find(t => t.key === selectedKey && !t.isProject);
                    
                    if (timeline && timeline.timeline) {
                      handleProjectSelect(projectIdStr);
                      setSelectedTimeline(timeline.timeline);
                    }
                  }
                }}
                className="min-w-[300px]"
                size="sm"
              >
                {projectsLoading ? (
                  <SelectItem key="loading-projects" isDisabled>
                    Loading projects...
                  </SelectItem>
                ) : allTimelines.length === 0 ? (
                  <SelectItem key="no-projects" isDisabled>
                    No projects available
                  </SelectItem>
                ) : (
                  allTimelines.map((item) => (
                    <SelectItem 
                      key={item.key} 
                      textValue={item.name}
                      isDisabled={item.key.startsWith('no-timelines-') || item.key.startsWith('loading-')}
                    >
                      {item.isProject ? (
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <BuildingIcon className="w-4 h-4" />
                          {item.name}
                          {item.loading && <span className="text-xs text-default-400">(loading...)</span>}
                        </div>
                      ) : item.key.startsWith('loading-') ? (
                        <div className="ml-6 text-default-400 italic text-sm flex items-center gap-2">
                          <div className="w-3 h-3 border border-default-300 border-t-primary rounded-full animate-spin"></div>
                          {item.name}
                        </div>
                      ) : item.key.startsWith('no-timelines-') ? (
                        <div className="ml-6 text-default-500 italic text-sm">{item.name}</div>
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
                    {selectedTimeline.sprints.length} Sprint{selectedTimeline.sprints.length !== 1 ? 's' : ''}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {selectedTimeline.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0)} Task{selectedTimeline.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0) !== 1 ? 's' : ''}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {selectedTimeline.sprints.reduce((acc, sprint) => 
                      acc + sprint.tasks.reduce((taskAcc, task) => taskAcc + task.subtasks.length, 0), 0
                    )} Subtask{selectedTimeline.sprints.reduce((acc, sprint) => 
                      acc + sprint.tasks.reduce((taskAcc, task) => taskAcc + task.subtasks.length, 0), 0
                    ) !== 1 ? 's' : ''}
                  </Chip>
                </div>
              )}
            </div>

            {/* Search */}
            <Input
              placeholder="Search timelines, sprints, tasks..."
              value={filters.search || ''}
              onChange={(e) => applyFilters({ search: e.target.value })}
              className="max-w-xs"
              size="sm"
              isClearable
            />
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
                  <p className="text-lg text-default-600">No timelines found</p>
                  <p className="text-sm text-default-500">
                    {selectedProjectId 
                      ? 'This project doesn\'t have any timelines yet.'
                      : 'Select a project and create your first timeline to get started.'
                    }
                  </p>
                </div>
                <Button 
                  color="primary" 
                  onPress={onCreateOpen}
                  startContent={<PlusIcon />}
                >
                  Create Timeline
                </Button>
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
                  <p className="text-lg text-default-600">Select a timeline</p>
                  <p className="text-sm text-default-500">
                    Choose a timeline from the dropdown above to view its details.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* View Tabs */}
            <Tabs
              selectedKey={view.type}
              onSelectionChange={(key) => handleViewChange({ type: key as 'gantt' | 'tree' | 'timeline' })}
              className="w-full"
            >
              <Tab key="gantt" title="Gantt View" />
              <Tab key="tree" title="Tree View" />
            </Tabs>

            {/* Timeline Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main View */}
              <div className={view.showDetails ? "lg:col-span-2" : "lg:col-span-3"}>
                <Card className="h-[600px]">
                  <CardBody className="p-0">
                    {view.type === 'gantt' ? (
                      <TimelineGanttView
                        timeline={selectedTimeline}
                        onItemSelect={handleItemSelect}
                        onCreateSprint={createSprint}
                        onCreateTask={createTask}
                        onCreateSubtask={createSubtask}
                        onUpdateSprint={updateSprint}
                        onUpdateTask={updateTask}
                        onUpdateSubtask={updateSubtask}
                        onDeleteSprint={deleteSprint}
                        onDeleteTask={deleteTask}
                        onDeleteSubtask={deleteSubtask}
                        departments={departments}
                        resources={resources}
                        filters={filters}
                        selectedItem={view.selectedItem}
                        loading={loading}
                      />
                    ) : (
                      <TimelineTreeView
                        timeline={selectedTimeline}
                        onItemSelect={handleItemSelect}
                        onCreateSprint={createSprint}
                        onCreateTask={createTask}
                        onCreateSubtask={createSubtask}
                        onUpdateSprint={updateSprint}
                        onUpdateTask={updateTask}
                        onUpdateSubtask={updateSubtask}
                        onDeleteSprint={deleteSprint}
                        onDeleteTask={deleteTask}
                        onDeleteSubtask={deleteSubtask}
                        departments={departments}
                        resources={resources}
                        filters={filters}
                        selectedItem={view.selectedItem}
                        loading={loading}
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
                      <h3 className="text-lg font-semibold">Details</h3>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => handleViewChange({ showDetails: false })}
                      >
                        ✕
                      </Button>
                    </CardHeader>
                    <Divider />
                    <CardBody className="p-0">
                      <TimelineDetailsPanel
                        timeline={selectedTimeline}
                        selectedItem={view.selectedItem}
                        selectedItemType={view.selectedItemType}
                        onUpdateTimeline={updateTimeline}
                        onUpdateSprint={updateSprint}
                        onUpdateTask={updateTask}
                        onUpdateSubtask={updateSubtask}
                        departments={departments}
                        resources={resources}
                        loading={loading}
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
          onOpenChange={onCreateOpenChange}
          onCreateTimeline={createTimeline}
          projectId={selectedProjectId}
          loading={loading}
        />

        {/* Filters Modal */}
        <Modal isOpen={isFiltersOpen} onOpenChange={onFiltersOpenChange} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <FilterIcon />
                    Timeline Filters
                  </div>
                </ModalHeader>
                <ModalBody>
                  <TimelineFilters
                    filters={filters}
                    departments={departments}
                    resources={resources}
                    onFiltersChange={applyFilters}
                    onClearFilters={clearFilters}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={clearFilters}>
                    Clear All
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    Apply Filters
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
