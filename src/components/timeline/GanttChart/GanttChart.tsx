import { FC, useState, useEffect, useMemo } from "react";
import { useTheme } from "@heroui/use-theme";
import { Gantt } from "wx-react-gantt";

import { Timeline } from "@/types/timeline";

import "wx-react-gantt/dist/gantt.css";

import "./gantt-custom.css";

type GanttProps = { timeline: Timeline; loading?: boolean };

type GanttTask = {
  id: number;

  text: string;

  start: Date;

  end: Date;

  duration: number;

  progress?: number;

  parent?: number;

  type?: "summary" | "task" | "milestone" | "subtask";

  open: boolean;

  cssClass: string;
};

type GanttLink = { id: number; source: number; target: number; type?: string };

const FlattenSingleTimelineToGantt: FC<GanttProps> = ({
  timeline,
  loading = false,
}) => {
  const { theme } = useTheme(); // "light" | "dark" | "system"

  const [isDarkApp, setIsDarkApp] = useState(false);

  // Detect app theme changes

  useEffect(() => {
    const html =
      typeof document !== "undefined" ? document.documentElement : null;

    const computeDark = () => {
      if (!html) return theme === "dark";

      const domDark =
        html.classList.contains("dark") ||
        html.getAttribute("data-theme") === "dark";

      return theme === "dark" || domDark;
    };

    setIsDarkApp(computeDark());

    if (!html) return;

    const observer = new MutationObserver(() => setIsDarkApp(computeDark()));

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, [theme]);

  // --- build tasks & links ---

  const tasks: GanttTask[] = [];

  const links: GanttLink[] = [];

  timeline.sprints.forEach((sprint) => {
    const sprintId = Number(sprint.id);

    tasks.push({
      id: sprintId,

      text: sprint.name,

      start: new Date(sprint.startDate),

      end: new Date(sprint.endDate),

      duration: sprint.duration,

      type: "summary",

      open: true,

      cssClass: "summary",
    });
  });

  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },

    { unit: "day", step: 1, format: "d" },
  ];

  const zoomConfig = {
    level: 5,
    levels: [
      {
        minCellWidth: 300,
        scales: [{ unit: "year", step: 1, format: "yyyy" }],
      },
      {
        minCellWidth: 200,
        scales: [
          { unit: "year", step: 1, format: "yyyy" },
          { unit: "month", step: 6, format: "MMM" },
        ],
      },
      {
        minCellWidth: 160,
        scales: [
          { unit: "year", step: 1, format: "yyyy" },
          { unit: "month", step: 3, format: "MMM" },
        ],
      },
      {
        minCellWidth: 120,
        scales: [
          { unit: "month", step: 1, format: "MMMM yyyy" },
          { unit: "week", step: 1, format: "'W'w" },
        ],
      },
      {
        minCellWidth: 100,
        scales: [
          { unit: "month", step: 1, format: "MMM" },
          { unit: "day", step: 7, format: "d" },
        ],
      },
      {
        minCellWidth: 80,
        scales: [
          { unit: "week", step: 1, format: "'Week' w" },
          { unit: "day", step: 1, format: "EEE d" },
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-default-600">Loading Gantt chart...</div>
        </div>
      </div>
    );
  }

  const currentThemeClass = isDarkApp
    ? "wx-willow-dark-theme"
    : "wx-willow-theme";

  // Force a clean re-mount on theme change

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const chartKey = useMemo(() => `${currentThemeClass}`, [currentThemeClass]);

  return (
    // eslint-disable-next-line no-console
    console.log("---?>>>>"),
    // eslint-disable-next-line no-console
    console.log(tasks),
    (
      <div
        key={chartKey}
        className={currentThemeClass}
        style={{ width: "100%", overflowX: "auto", minWidth: "1200px" }}
      >
        <Gantt
          links={links}
          scales={scales}
          taskClassName={(task: GanttTask) => `wx-bar ${task.cssClass}`}
          tasks={tasks}
          zoom={zoomConfig}
        />
      </div>
    )
  );
};

export default FlattenSingleTimelineToGantt;
