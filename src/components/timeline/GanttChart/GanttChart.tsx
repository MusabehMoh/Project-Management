import { Requirement, Sprint, Subtask, Task, Timeline } from "@/types/timeline";
import { FC, useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "@heroui/use-theme";
import { Gantt } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import "./gantt-custom.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { GanttRef } from "wx-react-gantt";

type GanttProps = { timeline: Timeline; loading?: boolean; isFullScreen?: boolean };

type GanttTask = {
  id: string;
  text: string;
  start: Date;
  end: Date;
  duration: number;
  details: string;
  progress?: number;
  parent?: string | number;
  type?: "summary" | "task" | "milestone" | string;
  open: boolean;
};

type GanttLink = { id: string; source: string | number; target: string | number; type?: string };

// Extend GanttRef interface (optional)
declare module "wx-react-gantt" {
  interface GanttRef {
    toggleTask?: (taskId: string) => void;
    expandAll?: () => void;
    collapseAll?: () => void;
  }
}

const FlattenSingleTimelineToGantt: FC<GanttProps> = ({ timeline, loading = false, isFullScreen = false }) => {
  const { theme } = useTheme();
  const [isDarkApp, setIsDarkApp] = useState(false);
  const { t, language } = useLanguage();
  const apiRef = useRef<GanttRef | undefined>();
  const isRTL = language === "ar";

  // Detect app theme changes
  useEffect(() => {
    const html = typeof document !== "undefined" ? document.documentElement : null;
    const computeDark = () => {
      if (!html) return theme === "dark";
      const domDark = html.classList.contains("dark") || html.getAttribute("data-theme") === "dark";
      return theme === "dark" || domDark;
    };
    setIsDarkApp(computeDark());
    if (!html) return;
    const observer = new MutationObserver(() => setIsDarkApp(computeDark()));
    observer.observe(html, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, [theme]);

  // --- Define custom task types (this is the key part) ---
  const taskTypes = useMemo(
    () => [
      { id: "task", label: t("timeline.task") },           // built-in
      { id: "summary", label: t("timeline.sprint") },      // built-in
      { id: "milestone", label: t("timeline.milestone") }, // built-in
      { id: "requirement", label: t("timeline.requirement") }, // custom (base: task)
      { id: "feature", label: t("timeline.task") },            // custom (base: task)
      { id: "sub", label: t("timeline.subtask") },             // custom (base: task)
    ],
    [t]
  );

  const tasks: GanttTask[] = [];
  const links: GanttLink[] = [];
  const genId = (prefix: string, id: number | string) => `${prefix}-${id}`;
  const calcDuration = (start: Date, end: Date) => Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

  // Build Gantt tasks
  timeline.sprints.forEach((sprint: Sprint) => {
    const sprintId = genId("S", sprint.id);
    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);

    tasks.push({
      id: sprintId,
      text: sprint.name,
      start: sprintStart,
      end: sprintEnd,
      duration: sprint.duration ?? calcDuration(sprintStart, sprintEnd),
      type: "summary", // summary (aka project)
      details: sprint.description ?? "",
      open: true,
    });

    sprint.requirements.forEach((req: Requirement) => {
      const reqId = genId("R", req.id);
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);

      tasks.push({
        id: reqId,
        text: req.name,
        start: reqStart,
        end: reqEnd,
        duration: req.duration ?? calcDuration(reqStart, reqEnd),
        progress: req.progress,
        parent: sprintId,
        type: "requirement", // ← custom type
        details: req.description ?? "",
        open: (req.tasks ?? []).length > 0,
      });

      req.depTasks?.forEach((dep) => {
        links.push({
          id: `${reqId}-dep-${dep.id}`,
          source: genId("T", String(dep.id)),
          target: reqId,
          type: "e2e",
        });
      });

      req.tasks.forEach((task: Task) => {
        const taskId = genId("T", task.id);
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);

        tasks.push({
          id: taskId,
          text: task.name,
          start: taskStart,
          end: taskEnd,
          duration: task.duration ?? calcDuration(taskStart, taskEnd),
          progress: task.progress,
          parent: reqId,
          type: "feature", // ← custom type
          details: task.description ?? "",
          open: (task.subtasks ?? []).length > 0,
        });

        task.depTasks?.forEach((dep) => {
          links.push({
            id: `${taskId}-dep-${dep.id}`,
            source: genId("T", String(dep.id)),
            target: taskId,
            type: "e2e",
          });
        });

        task.subtasks?.forEach((sub: Subtask) => {
          const subId = genId("U", sub.id);
          const subStart = sub.startDate ? new Date(sub.startDate) : taskStart;
          const subEnd = sub.endDate ? new Date(sub.endDate) : taskEnd;

          tasks.push({
            id: subId,
            text: sub.name,
            start: subStart,
            end: subEnd,
            duration: sub.duration ?? calcDuration(subStart, subEnd),
            progress: sub.progress ?? 0,
            parent: taskId,
            type: "sub", // ← custom type
            details: sub.description ?? "",
            open: false,
          });

          sub.depTasks?.forEach((dep) => {
            links.push({
              id: `${subId}-dep-${dep.id}`,
              source: genId("T", String(dep.id)),
              target: subId,
              type: "e2e",
            });
          });
        });
      });
    });
  });

  // Localized date formatting
  // Replace your formatDate function with this improved version
  const formatDate = (date: Date, format: string) => {
    if (language === "ar") {
      // Use the Gregorian calendar explicitly for Arabic
      const options: Intl.DateTimeFormatOptions = {
        calendar: "gregory", // Explicitly use Gregorian calendar
        numberingSystem: "arab", // Use Arabic numerals
      };
      
      if (format.includes("yyyy")) options.year = "numeric";
      if (format.includes("MMMM")) options.month = "long";
      if (format.includes("MMM")) options.month = "short";
      if (format.includes("d")) options.day = "numeric";
      if (format.includes("EEE")) options.weekday = "short";
      
      return date.toLocaleDateString("ar-SA", options);
    }
    
    // English formatting remains the same
    if (format === "MMMM yyyy") return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (format === "MMM") return date.toLocaleDateString("en-US", { month: "short" });
    if (format === "yyyy") return date.toLocaleDateString("en-US", { year: "numeric" });
    if (format === "d") return String(date.getDate());
    if (format === "EEE d") return `${date.toLocaleDateString("en-US", { weekday: "short" })} ${date.getDate()}`;
    return date.toLocaleDateString("en-US");
  };

  const scales = useMemo(
    () => [
      { unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMMM yyyy") },
      { unit: "day" as const, step: 1, format: (d: Date) => formatDate(d, "d") },
    ],
    [language]
  );

  const zoomConfigNormal = useMemo(
    () => ({
      level: 5,
      levels: [
        { minCellWidth: 300, scales: [{ unit: "year" as const, step: 1, format: (d: Date) => formatDate(d, "yyyy") }] },
        {
          minCellWidth: 200,
          scales: [
            { unit: "year" as const, step: 1, format: (d: Date) => formatDate(d, "yyyy") },
            { unit: "month" as const, step: 6, format: (d: Date) => formatDate(d, "MMM") },
          ],
        },
        {
          minCellWidth: 160,
          scales: [
            { unit: "year" as const, step: 1, format: (d: Date) => formatDate(d, "yyyy") },
            { unit: "month" as const, step: 3, format: (d: Date) => formatDate(d, "MMM") },
          ],
        },
        { minCellWidth: 120, scales: [{ unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMMM yyyy") }] },
        {
          minCellWidth: 100,
          scales: [
            { unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMM") },
            { unit: "day" as const, step: 7, format: (d: Date) => formatDate(d, "d") },
          ],
        },
        {
          minCellWidth: 80,
          scales: [
            { unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMM") },
            { unit: "day" as const, step: 1, format: (d: Date) => formatDate(d, "EEE d") },
          ],
        },
      ],
    }),
    [language]
  );

  const zoomConfigFullScreen = useMemo(
  () => ({
    level: 5, // middle zoom by default
    levels: [
      {
        minCellWidth: 600,
        scales: [{ unit: "year" as const, step: 1, format: (d: Date) => formatDate(d, "yyyy") }],
      },
      {
        minCellWidth: 500,
        scales: [
          { unit: "year" as const, step: 1, format: (d: Date) => formatDate(d, "yyyy") },
          { unit: "month" as const, step: 6, format: (d: Date) => formatDate(d, "MMM") },
        ],
      },
      {
        minCellWidth: 400,
        scales: [
          { unit: "year" as const, step: 1, format: (d: Date) => formatDate(d, "yyyy") },
          { unit: "month" as const, step: 3, format: (d: Date) => formatDate(d, "MMM") },
        ],
      },
      {
        minCellWidth: 300,
        scales: [
          { unit: "quarter" as const, step: 1, format: (d: Date) => `Q${Math.floor(d.getMonth() / 3) + 1}` },
          { unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMM") },
        ],
      },
      {
        minCellWidth: 250,
        scales: [{ unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMMM yyyy") }],
      },
      {
        minCellWidth: 200,
        scales: [
          { unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMM") },
          { unit: "day" as const, step: 1, format: (d: Date) => formatDate(d, "d") },
        ],
      },
      {
        minCellWidth: 160,
        scales: [
          { unit: "month" as const, step: 1, format: (d: Date) => formatDate(d, "MMM") },
          { unit: "day" as const, step: 1, format: (d: Date) => formatDate(d, "EEE d") },
        ],
      },
    ],
  }),
  [language]
);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-default-600">Loading Gantt chart...</div>
        </div>
      </div>
    );
  }

  const currentThemeClass = isDarkApp ? "wx-willow-dark-theme" : "wx-willow-theme";
  const textColumnWidth = isFullScreen ? 350 : 220;
  const zoomConfig = isFullScreen ? zoomConfigFullScreen : zoomConfigNormal;

  const columns = [
    { id: "text", header: t("timeline.taskName"), flexgrow: 2, align: "start" },
    { id: "start", header: t("timeline.startDate"), flexgrow: 1, align: isRTL ? "end" : "start" },
    { id: "duration", header: t("timeline.duration"), flexgrow: 0.65, align: isRTL ? "end" : "start" },
  ];

  return (
  <div
    className={currentThemeClass}
    style={{
      width: "100%",
      overflowX: "auto",
      minWidth: textColumnWidth + 900,
      direction: isRTL ? "rtl" : "ltr",
      height: isFullScreen ? "calc(100vh - 100px)" : "auto",
    }}
  >
    <div
      className="gantt-scroll-container"
      style={{
        height: isFullScreen ? "100%" : "auto",
        overflowY: isFullScreen ? "auto" : "visible",
      }}
    >
      <Gantt
        onInit={(api: GanttRef) => (apiRef.current = api)}
        zoom={zoomConfig}
        tasks={tasks}
        links={links}
        scales={scales}
        taskTypes={taskTypes}
        cellBorders="full"
        columns={columns}
        scaleHeight={isFullScreen ? 36 : 34}
        cellHeight={isFullScreen ? 38 : 26}
        cellWidth={isFullScreen ? 90 : 70}
      />
    </div>
  </div>
);

};

export default FlattenSingleTimelineToGantt;
