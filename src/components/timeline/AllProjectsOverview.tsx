import { useEffect, useState, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Tooltip } from "@heroui/tooltip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  Layers,
  User,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { timelineService } from "@/services/api";
import { Timeline } from "@/types/timeline";
import { CalendarIcon, BuildingIcon } from "@/components/icons";

interface AllProjectsOverviewProps {
  projects: Array<{ id: number; applicationName: string }>;
}

interface ProjectWithTimelines {
  project: { id: number; applicationName: string };
  timelines: Timeline[];
  loading: boolean;
  stats: {
    totalSprints: number;
    totalTasks: number;
    avgProgress: number;
  };
}

export default function AllProjectsOverview({
  projects,
}: AllProjectsOverviewProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projectsData, setProjectsData] = useState<ProjectWithTimelines[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [selectedTimeline, setSelectedTimeline] = useState<Timeline | null>(
    null,
  );
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, progress, timelines, sprints, tasks
  const [progressFilter, setProgressFilter] = useState("all"); // all, low, medium, high
  const isRTL = language === "ar";

  useEffect(() => {
    const loadAllProjectsTimelines = async () => {
      if (projects.length === 0) {
        setLoading(false);

        return;
      }

      setLoading(true);

      try {
        // Use optimized single API call to get all projects with timelines
        const response = await timelineService.getProjectsWithTimelines();

        if (response.success && response.data) {
          // Map the response data to match our component's structure
          const projectsWithTimelines = projects.map((project) => {
            const projectData = response.data.find(
              (p: any) => p.projectId === project.id,
            );
            const timelines = projectData?.timelines || [];

            // Calculate stats
            const totalSprints = timelines.reduce(
              (acc: number, t: any) => acc + (t.sprints?.length || 0),
              0,
            );
            const totalTasks = timelines.reduce((acc: number, t: any) => {
              return (
                acc +
                (t.sprints || []).reduce((sprintAcc: number, sprint: any) => {
                  return sprintAcc + (sprint.tasks?.length || 0);
                }, 0)
              );
            }, 0);

            const allTasks = timelines.flatMap((t: any) =>
              (t.sprints || []).flatMap((s: any) => s.tasks || []),
            );
            const avgProgress =
              allTasks.length > 0
                ? Math.round(
                    allTasks.reduce(
                      (acc: number, task: any) => acc + (task.progress || 0),
                      0,
                    ) / allTasks.length,
                  )
                : 0;

            return {
              project,
              timelines,
              loading: false,
              stats: { totalSprints, totalTasks, avgProgress },
            };
          });

          setProjectsData(projectsWithTimelines);
        } else {
          // Fallback to empty data
          setProjectsData(
            projects.map((project) => ({
              project,
              timelines: [],
              loading: false,
              stats: { totalSprints: 0, totalTasks: 0, avgProgress: 0 },
            })),
          );
        }
      } catch (error) {
        console.error("Error loading all projects timelines:", error);
        // Fallback to empty data
        setProjectsData(
          projects.map((project) => ({
            project,
            timelines: [],
            loading: false,
            stats: { totalSprints: 0, totalTasks: 0, avgProgress: 0 },
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    loadAllProjectsTimelines();
  }, [projects]);

  // Restore selection from URL params (when coming back from detail view)
  useEffect(() => {
    if (projectsData.length === 0 || loading) return;

    const restoreParam = searchParams.get("restore");

    if (restoreParam) {
      const [projectIdStr, timelineIdStr] = restoreParam.split("-");
      const projectId = parseInt(projectIdStr);
      const timelineId = timelineIdStr ? parseInt(timelineIdStr) : null;

      // Find the project and timeline
      const projectData = projectsData.find((p) => p.project.id === projectId);

      if (projectData) {
        setSelectedProjectId(projectId);
        setSelectedProjectName(projectData.project.applicationName);

        if (timelineId) {
          const timeline = projectData.timelines.find(
            (t) => t.id === timelineId,
          );

          if (timeline) {
            setSelectedTimeline(timeline);
          }
        }
      }
    }
  }, [projectsData, loading, searchParams]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projectsData];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        ({ project, timelines }) =>
          project.applicationName.toLowerCase().includes(query) ||
          timelines.some((t) => t.name.toLowerCase().includes(query)),
      );
    }

    // Progress filter
    if (progressFilter !== "all") {
      filtered = filtered.filter(({ stats }) => {
        if (progressFilter === "low") return stats.avgProgress < 40;
        if (progressFilter === "medium")
          return stats.avgProgress >= 40 && stats.avgProgress < 70;
        if (progressFilter === "high") return stats.avgProgress >= 70;

        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.project.applicationName.localeCompare(
            b.project.applicationName,
            language,
          );
        case "progress":
          return b.stats.avgProgress - a.stats.avgProgress;
        case "timelines":
          return b.timelines.length - a.timelines.length;
        case "sprints":
          return b.stats.totalSprints - a.stats.totalSprints;
        case "tasks":
          return b.stats.totalTasks - a.stats.totalTasks;
        default:
          return 0;
      }
    });

    return filtered;
  }, [projectsData, searchQuery, sortBy, progressFilter, language]);

  const handleProjectClick = (projectId: number, timelineId?: number) => {
    if (timelineId) {
      window.location.href = `/timeline?projectId=${projectId}&timelineId=${timelineId}&view=tree`;
    } else {
      window.location.href = `/timeline?projectId=${projectId}`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-[280px]">
            <CardBody>
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-default-200 rounded w-3/4" />
                <div className="h-4 bg-default-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-default-200 rounded" />
                  <div className="h-3 bg-default-200 rounded w-5/6" />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (projectsData.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="space-y-4">
            <BuildingIcon className="w-16 h-16 mx-auto text-default-300" />
            <div>
              <p className="text-lg text-default-600">
                {t("timeline.noProjectsAvailable")}
              </p>
              <p className="text-sm text-default-500">
                {t("timeline.noTimelinesGeneral")}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div
            className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${isRTL ? "text-right" : ""}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Search */}
            <Input
              isClearable
              classNames={{
                input: isRTL ? "text-right" : "",
              }}
              placeholder={t("timeline.searchProjects")}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              value={searchQuery}
              onClear={() => setSearchQuery("")}
              onValueChange={setSearchQuery}
            />

            {/* Sort By */}
            <Select
              disallowEmptySelection
              label={t("timeline.sortBy")}
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => {
                const keysArray = Array.from(keys);

                if (keysArray.length > 0) {
                  setSortBy(keysArray[0] as string);
                }
              }}
            >
              <SelectItem key="name">{t("timeline.sortByName")}</SelectItem>
              <SelectItem key="progress">
                {t("timeline.sortByProgress")}
              </SelectItem>
              <SelectItem key="timelines">
                {t("timeline.sortByTimelines")}
              </SelectItem>
              <SelectItem key="sprints">
                {t("timeline.sortBySprints")}
              </SelectItem>
              <SelectItem key="tasks">{t("timeline.sortByTasks")}</SelectItem>
            </Select>

            {/* Progress Filter */}
            <Select
              key={`progress-filter-${progressFilter}`}
              disallowEmptySelection
              label={t("timeline.filterByProgress")}
              selectedKeys={[progressFilter]}
              onSelectionChange={(keys) => {
                const keysArray = Array.from(keys);

                if (keysArray.length > 0) {
                  setProgressFilter(keysArray[0] as string);
                }
              }}
            >
              <SelectItem key="all">{t("common.all")}</SelectItem>
              <SelectItem key="low">{t("timeline.lowProgress")}</SelectItem>
              <SelectItem key="medium">
                {t("timeline.mediumProgress")}
              </SelectItem>
              <SelectItem key="high">{t("timeline.highProgress")}</SelectItem>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || progressFilter !== "all") && (
            <div
              className={`flex items-center gap-2 mt-4 flex-wrap ${isRTL ? "" : ""}`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <span className="text-sm text-default-500">
                {t("timeline.activeFilters")}:
              </span>
              {searchQuery && (
                <Chip
                  color="danger"
                  size="sm"
                  variant="flat"
                  onClose={() => setSearchQuery("")}
                >
                  {t("timeline.search")}: {searchQuery}
                </Chip>
              )}
              {progressFilter !== "all" && (
                <Chip
                  color="danger"
                  size="sm"
                  variant="flat"
                  onClose={() => setProgressFilter("all")}
                >
                  {t("common.progress")}:{" "}
                  {progressFilter === "low"
                    ? t("timeline.lowProgress")
                    : progressFilter === "medium"
                      ? t("timeline.mediumProgress")
                      : t("timeline.highProgress")}
                </Chip>
              )}
              <Button
                size="sm"
                variant="light"
                onPress={() => {
                  setSearchQuery("");
                  setProgressFilter("all");
                }}
              >
                {t("timeline.clearAll")}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody
            className="flex flex-row items-center gap-3 py-4"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="p-3 rounded-lg bg-primary/10">
              <BuildingIcon className="w-6 h-6 text-primary" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-default-500">{t("common.projects")}</p>
              <p className="text-2xl font-semibold">
                {filteredAndSortedProjects.length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody
            className="flex flex-row items-center gap-3 py-4"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="p-3 rounded-lg bg-success/10">
              <CalendarIcon className="w-6 h-6 text-success" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-default-500">
                {t("timeline.timelines")}
              </p>
              <p className="text-2xl font-semibold">
                {filteredAndSortedProjects.reduce(
                  (acc, p) => acc + p.timelines.length,
                  0,
                )}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody
            className="flex flex-row items-center gap-3 py-4"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="p-3 rounded-lg bg-warning/10">
              <Layers className="w-6 h-6 text-warning" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-default-500">
                {t("timeline.sprints")}
              </p>
              <p className="text-2xl font-semibold">
                {filteredAndSortedProjects.reduce(
                  (acc, p) => acc + p.stats.totalSprints,
                  0,
                )}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody
            className="flex flex-row items-center gap-3 py-4"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="p-3 rounded-lg bg-secondary/10">
              <Clock className="w-6 h-6 text-secondary" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-default-500">{t("timeline.tasks")}</p>
              <p className="text-2xl font-semibold">
                {filteredAndSortedProjects.reduce(
                  (acc, p) => acc + p.stats.totalTasks,
                  0,
                )}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Projects Accordion */}
      {filteredAndSortedProjects.length === 0 ? (
        /* No Results Message */
        <Card>
          <CardBody className="text-center py-12">
            <div className="space-y-4">
              <SlidersHorizontal className="w-16 h-16 mx-auto text-default-300" />
              <div>
                <p className="text-lg text-default-600">
                  {t("timeline.noResultsFound")}
                </p>
                <p className="text-sm text-default-500">
                  {t("timeline.tryDifferentFilters")}
                </p>
              </div>
              <Button
                variant="flat"
                onPress={() => {
                  setSearchQuery("");
                  setProgressFilter("all");
                }}
              >
                {t("timeline.clearFilters")}
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : !selectedTimeline ? (
        /* Full Width Accordion when no timeline selected */
        <div
          className={`w-full max-h-[600px] overflow-y-auto scrollbar-hide ${isRTL ? "pl-3" : "pr-3"}`}
          style={{ overflowY: "auto", overflowX: "visible", padding: "8px" }}
        >
          <Accordion
            className="space-y-4"
            dir={isRTL ? "rtl" : "ltr"}
            itemClasses={{
              trigger: "cursor-pointer",
            }}
            selectedKeys={
              selectedProjectId ? [selectedProjectId.toString()] : []
            }
            selectionMode="single"
            showDivider={false}
            variant="shadow"
            onSelectionChange={(keys) => {
              const keysArray = Array.from(keys);
              const selected =
                keysArray.length > 0 ? parseInt(keysArray[0] as string) : null;

              setSelectedProjectId(selected);
            }}
          >
            {filteredAndSortedProjects.map(({ project, timelines, stats }) => (
              <AccordionItem
                key={project.id.toString()}
                aria-label={project.applicationName}
                className="border-b border-default-200 last:border-b-0"
                title={
                  <div
                    className="flex items-center gap-3 py-2"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BuildingIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                      <h3 className="text-base font-semibold">
                        {project.applicationName}
                      </h3>
                      <div
                        className={`flex items-center gap-4 text-sm mt-1 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-default-400" />
                          <span className="text-default-600">
                            {timelines.length}{" "}
                            {timelines.length === 1
                              ? t("timeline.timeline")
                              : t("timeline.timelines")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-default-400" />
                          <span className="text-default-600">
                            {stats.totalSprints} {t("timeline.sprints")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-default-400" />
                          <span className="text-default-600">
                            {stats.totalTasks} {t("timeline.tasks")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {stats.totalTasks > 0 && (
                      <Chip
                        className={
                          stats.avgProgress >= 70
                            ? "bg-success/20 text-success"
                            : stats.avgProgress >= 40
                              ? "bg-warning/20 text-warning"
                              : "bg-danger/20 text-danger"
                        }
                        size="sm"
                      >
                        {stats.avgProgress}%
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="pb-4 space-y-3" dir={isRTL ? "rtl" : "ltr"}>
                  {/* Progress Bar */}
                  {stats.totalTasks > 0 && (
                    <div className="space-y-1">
                      <div
                        className={`flex items-center text-sm justify-between`}
                      >
                        {isRTL ? (
                          <>
                            <span className="text-default-500">
                              {t("common.progress")}
                            </span>
                            <span className="font-semibold text-default-700">
                              {stats.avgProgress}%
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-default-500">
                              {t("common.progress")}
                            </span>
                            <span className="font-semibold text-default-700">
                              {stats.avgProgress}%
                            </span>
                          </>
                        )}
                      </div>
                      <div className="w-full bg-default-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stats.avgProgress >= 70
                              ? "bg-success"
                              : stats.avgProgress >= 40
                                ? "bg-warning"
                                : "bg-danger"
                          }`}
                          style={{ width: `${stats.avgProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Timelines Grid */}
                  {timelines.length > 0 ? (
                    <div className="space-y-2">
                      <p
                        className={`text-xs text-default-500 font-medium uppercase ${isRTL ? "text-right" : ""}`}
                      >
                        {t("timeline.timelines")}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {timelines.map((timeline) => (
                          <div
                            key={timeline.id}
                            className={`group relative p-2 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border border-default-200 hover:border-primary/30 transition-all cursor-pointer ${isRTL ? "text-right" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTimeline(timeline);
                              setSelectedProjectId(project.id);
                              setSelectedProjectName(project.applicationName);
                            }}
                          >
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                {timeline.name}
                              </p>
                              <div
                                className={`flex items-center gap-1.5 text-[10px] text-default-500 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                              >
                                <div
                                  className={`flex items-center gap-0.5 ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                  <Layers className="w-2.5 h-2.5" />
                                  <span>{timeline.sprints?.length || 0}</span>
                                </div>
                                <div
                                  className={`flex items-center gap-0.5 ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>
                                    {(timeline.sprints || []).reduce(
                                      (acc, s) => acc + (s.tasks?.length || 0),
                                      0,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-default-400">
                        {t("timeline.noTimelines")}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : (
        /* Split View when timeline selected */
        <div className="flex gap-6">
          {/* Left Side - Projects List with Accordion (60%) */}
          <div
            className={`w-[60%] max-h-[600px] overflow-y-auto scrollbar-hide ${isRTL ? "pl-3" : "pr-3"}`}
            style={{ overflowY: "auto", overflowX: "visible", padding: "8px" }}
          >
            <Accordion
              className="space-y-4"
              dir={isRTL ? "rtl" : "ltr"}
              itemClasses={{
                trigger: "cursor-pointer",
              }}
              selectedKeys={
                selectedProjectId ? [selectedProjectId.toString()] : []
              }
              selectionMode="single"
              showDivider={false}
              variant="shadow"
              onSelectionChange={(keys) => {
                const keysArray = Array.from(keys);
                const selected =
                  keysArray.length > 0
                    ? parseInt(keysArray[0] as string)
                    : null;

                setSelectedProjectId(selected);
              }}
            >
              {filteredAndSortedProjects.map(
                ({ project, timelines, stats }) => (
                  <AccordionItem
                    key={project.id.toString()}
                    aria-label={project.applicationName}
                    className="border-b border-default-200 last:border-b-0"
                    title={
                      <div
                        className="flex items-center gap-3 py-2"
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BuildingIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                          <h3 className="text-base font-semibold">
                            {project.applicationName}
                          </h3>
                          <div
                            className={`flex items-center gap-4 text-sm mt-1 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-4 h-4 text-default-400" />
                              <span className="text-default-600">
                                {timelines.length}{" "}
                                {timelines.length === 1
                                  ? t("timeline.timeline")
                                  : t("timeline.timelines")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-default-400" />
                              <span className="text-default-600">
                                {stats.totalSprints} {t("timeline.sprints")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-default-400" />
                              <span className="text-default-600">
                                {stats.totalTasks} {t("timeline.tasks")}
                              </span>
                            </div>
                          </div>
                        </div>
                        {stats.totalTasks > 0 && (
                          <Chip
                            className={
                              stats.avgProgress >= 70
                                ? "bg-success/20 text-success"
                                : stats.avgProgress >= 40
                                  ? "bg-warning/20 text-warning"
                                  : "bg-danger/20 text-danger"
                            }
                            size="sm"
                          >
                            {stats.avgProgress}%
                          </Chip>
                        )}
                      </div>
                    }
                  >
                    <div className="pb-4 space-y-3" dir={isRTL ? "rtl" : "ltr"}>
                      {/* Progress Bar */}
                      {stats.totalTasks > 0 && (
                        <div className="space-y-1">
                          <div
                            className={`flex items-center text-sm justify-between`}
                          >
                            {isRTL ? (
                              <>
                                <span className="text-default-500">
                                  {t("common.progress")}
                                </span>
                                <span className="font-semibold text-default-700">
                                  {stats.avgProgress}%
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-default-500">
                                  {t("common.progress")}
                                </span>
                                <span className="font-semibold text-default-700">
                                  {stats.avgProgress}%
                                </span>
                              </>
                            )}
                          </div>
                          <div className="w-full bg-default-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                stats.avgProgress >= 70
                                  ? "bg-success"
                                  : stats.avgProgress >= 40
                                    ? "bg-warning"
                                    : "bg-danger"
                              }`}
                              style={{ width: `${stats.avgProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Timelines Grid */}
                      {timelines.length > 0 ? (
                        <div className="space-y-2">
                          <p
                            className={`text-xs text-default-500 font-medium uppercase ${isRTL ? "text-right" : ""}`}
                          >
                            {t("timeline.timelines")}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {timelines.map((timeline) => (
                              <div
                                key={timeline.id}
                                className={`group relative p-2 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border border-default-200 hover:border-primary/30 transition-all cursor-pointer ${isRTL ? "text-right" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTimeline(timeline);
                                  setSelectedProjectId(project.id);
                                  setSelectedProjectName(
                                    project.applicationName,
                                  );
                                }}
                              >
                                <div className="space-y-1.5">
                                  <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                    {timeline.name}
                                  </p>
                                  <div
                                    className={`flex items-center gap-1.5 text-[10px] text-default-500 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                                  >
                                    <div
                                      className={`flex items-center gap-0.5 ${isRTL ? "flex-row-reverse" : ""}`}
                                    >
                                      <Layers className="w-2.5 h-2.5" />
                                      <span>
                                        {timeline.sprints?.length || 0}
                                      </span>
                                    </div>
                                    <div
                                      className={`flex items-center gap-0.5 ${isRTL ? "flex-row-reverse" : ""}`}
                                    >
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>
                                        {(timeline.sprints || []).reduce(
                                          (acc, s) =>
                                            acc + (s.tasks?.length || 0),
                                          0,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-default-400">
                            {t("timeline.noTimelines")}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                ),
              )}
            </Accordion>
          </div>

          {/* Vertical Divider */}
          <div className="relative flex justify-center">
            <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-default-300 to-transparent" />
          </div>

          {/* Right Side - Timeline Details (40%) */}
          <div
            className={`w-[40%] space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide ${isRTL ? "pr-3" : "pl-3"}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="space-y-4">
              {/* Timeline Header */}
              <div className="space-y-2">
                <div
                  className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Button
                    isIconOnly
                    className="text-default-500 hover:text-default-700 flex-shrink-0"
                    variant="light"
                    onClick={() => setSelectedTimeline(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <h3
                    className={`text-lg font-semibold flex-1 truncate ${isRTL ? "text-right" : ""}`}
                  >
                    {selectedTimeline.name}
                  </h3>
                  <Button
                    className="flex-shrink-0"
                    color="primary"
                    size="sm"
                    onClick={() => {
                      console.log(
                        "Navigating to:",
                        selectedProjectId,
                        selectedTimeline.id,
                      );
                      handleProjectClick(
                        selectedProjectId!,
                        selectedTimeline.id,
                      );
                    }}
                  >
                    {t("common.viewDetails")}
                  </Button>
                </div>
                <p
                  className={`text-sm text-default-500 ${isRTL ? "text-right" : ""}`}
                >
                  {selectedProjectName}
                </p>
                {selectedTimeline.description && (
                  <p
                    className={`text-sm text-default-600 ${isRTL ? "text-right" : ""}`}
                  >
                    {selectedTimeline.description}
                  </p>
                )}
              </div>

              <Divider />

              {/* Timeline Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <div
                    className={`flex items-center gap-2 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Layers className="w-4 h-4 text-success" />
                    <p
                      className={`text-xs text-default-500 ${isRTL ? "text-right" : ""}`}
                    >
                      {t("timeline.sprints")}
                    </p>
                  </div>
                  <p
                    className={`text-xl font-semibold text-success block ${isRTL ? "text-right" : ""}`}
                  >
                    {selectedTimeline.sprints?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <div
                    className={`flex items-center gap-2 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Clock className="w-4 h-4 text-primary" />
                    <p
                      className={`text-xs text-default-500 ${isRTL ? "text-right" : ""}`}
                    >
                      {t("timeline.tasks")}
                    </p>
                  </div>
                  <p
                    className={`text-xl font-semibold text-primary block ${isRTL ? "text-right" : ""}`}
                  >
                    {(selectedTimeline.sprints || []).reduce(
                      (acc, s) => acc + (s.tasks?.length || 0),
                      0,
                    )}
                  </p>
                </div>
              </div>

              <Divider />

              {/* Sprints List */}
              <div className="space-y-3">
                <h4
                  className={`text-sm font-semibold text-default-700 ${isRTL ? "text-right" : ""}`}
                >
                  {t("timeline.sprints")}
                </h4>
                {selectedTimeline.sprints &&
                selectedTimeline.sprints.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTimeline.sprints.map((sprint) => (
                      <Card key={sprint.id} className="shadow-sm">
                        <CardBody className="p-3">
                          <div className="space-y-2">
                            <p
                              className={`text-sm font-medium ${isRTL ? "text-right" : ""}`}
                            >
                              {sprint.name}
                            </p>
                            {sprint.description && (
                              <p
                                className={`text-xs text-default-500 line-clamp-2 ${isRTL ? "text-right" : ""}`}
                              >
                                {sprint.description}
                              </p>
                            )}
                            <div
                              className={`flex items-center gap-3 text-xs text-default-500 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                            >
                              <div
                                className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {sprint.tasks?.length || 0}{" "}
                                  {t("timeline.tasks")}
                                </span>
                              </div>
                              <div
                                className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {sprint.duration} {t("common.days")}
                                </span>
                              </div>
                            </div>

                            {/* Tasks List */}
                            {sprint.tasks && sprint.tasks.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-default-200">
                                <p
                                  className={`text-xs font-medium text-default-600 mb-2 block w-full ${isRTL ? "text-right" : ""}`}
                                >
                                  {t("timeline.tasks")}:
                                </p>
                                <div className="space-y-1.5">
                                  {sprint.tasks.map((task) => {
                                    // Backend returns AssignedMembers (PascalCase), frontend expects members
                                    const taskMembers =
                                      (task as any).assignedMembers ||
                                      (task as any).AssignedMembers ||
                                      task.members ||
                                      [];

                                    // Build tooltip content
                                    const tooltipContent = (
                                      <div
                                        className="p-2 space-y-1.5 max-w-xs"
                                        dir={isRTL ? "rtl" : "ltr"}
                                      >
                                        <p
                                          className={`font-semibold text-sm ${isRTL ? "text-right" : ""}`}
                                        >
                                          {task.name}
                                        </p>
                                        {task.description && (
                                          <p
                                            className={`text-xs text-default-600 ${isRTL ? "text-right" : ""}`}
                                          >
                                            {task.description}
                                          </p>
                                        )}
                                        <Divider className="my-1" />
                                        {taskMembers &&
                                          taskMembers.length > 0 && (
                                            <div className="space-y-1">
                                              <p
                                                className={`text-xs font-medium flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                                              >
                                                {t("tasks.assignedTo")}:
                                                <User className="w-3 h-3" />
                                              </p>
                                              <div
                                                className={`space-y-0.5 ${isRTL ? "pr-4 text-right" : "pl-4"}`}
                                              >
                                                {taskMembers.map(
                                                  (
                                                    member: any,
                                                    idx: number,
                                                  ) => (
                                                    <p
                                                      key={idx}
                                                      className="text-xs text-default-600"
                                                    >
                                                      •{" "}
                                                      {member.fullName ||
                                                        member.userName}
                                                    </p>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        {task.startDate && (
                                          <p
                                            className={`text-xs text-default-600 ${isRTL ? "text-right" : ""}`}
                                          >
                                            <span className="font-medium">
                                              {t("common.startDate")}:
                                            </span>{" "}
                                            {new Date(
                                              task.startDate,
                                            ).toLocaleDateString()}
                                          </p>
                                        )}
                                        {task.endDate && (
                                          <p
                                            className={`text-xs text-default-600 ${isRTL ? "text-right" : ""}`}
                                          >
                                            <span className="font-medium">
                                              {t("common.endDate")}:
                                            </span>{" "}
                                            {new Date(
                                              task.endDate,
                                            ).toLocaleDateString()}
                                          </p>
                                        )}
                                        {task.duration !== undefined && (
                                          <p
                                            className={`text-xs text-default-600 ${isRTL ? "text-right" : ""}`}
                                          >
                                            <span className="font-medium">
                                              {t("common.duration")}:
                                            </span>{" "}
                                            {task.duration} {t("common.days")}
                                          </p>
                                        )}
                                        {task.progress !== undefined && (
                                          <p
                                            className={`text-xs text-default-600 ${isRTL ? "text-right" : ""}`}
                                          >
                                            <span className="font-medium">
                                              {t("common.progress")}:
                                            </span>{" "}
                                            {task.progress}%
                                          </p>
                                        )}
                                      </div>
                                    );

                                    return (
                                      <Tooltip
                                        key={task.id}
                                        content={tooltipContent}
                                        delay={300}
                                        placement={isRTL ? "right" : "left"}
                                      >
                                        <div
                                          className={`flex items-start gap-2 text-xs cursor-help hover:bg-default-100 rounded p-1 transition-colors px-2 ${isRTL ? "flex-row-reverse text-right" : ""}`}
                                        >
                                          <div
                                            className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}
                                          >
                                            <p className="text-default-700 line-clamp-1 flex items-center">
                                              {isRTL ? (
                                                <>
                                                  <span className="text-default-400 ml-1">
                                                    •
                                                  </span>
                                                  {task.name}
                                                </>
                                              ) : (
                                                <>
                                                  <span className="text-default-400 mr-1">
                                                    •
                                                  </span>
                                                  {task.name}
                                                </>
                                              )}
                                            </p>
                                            {task.progress !== undefined && (
                                              <div
                                                className={`flex items-center gap-2 mt-1 ${isRTL ? "flex-row-reverse" : ""}`}
                                              >
                                                <div
                                                  className="flex-1 h-1 bg-default-200 rounded-full overflow-hidden"
                                                  dir={isRTL ? "rtl" : "ltr"}
                                                >
                                                  <div
                                                    className={`h-full bg-success rounded-full transition-all ${isRTL ? "mr-auto" : ""}`}
                                                    style={{
                                                      width: `${task.progress}%`,
                                                    }}
                                                  />
                                                </div>
                                                <span className="text-[10px] text-default-500 whitespace-nowrap">
                                                  {task.progress}%
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Layers className="w-8 h-8 mx-auto text-default-300 mb-2" />
                    <p className="text-sm text-default-400">
                      {t("timeline.noSprints")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
