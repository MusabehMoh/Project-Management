import React, { useEffect, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { gantt } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

import { useLanguage } from "@/contexts/LanguageContext";

interface Task {
  id: string;
  text: string;
  start_date: string;
  duration: number;
  progress: number;
  parent?: string;
  type?: string;
  priority?: "high" | "medium" | "low";
  assignee?: string;
}

interface Link {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface DHtmlGanttChartProps {
  height?: string;
  showToolbar?: boolean;
  useMockData?: boolean;
}

const DHtmlGanttChart: React.FC<DHtmlGanttChartProps> = ({
  height = "600px",
  showToolbar = true,
  useMockData = true,
}) => {
  const { t, language } = useLanguage();
  const ganttRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const mockData = {
    data: [
      {
        id: "1",
        text: "Project Planning Phase",
        start_date: "2025-09-26",
        duration: 5,
        progress: 1,
        type: "project",
        priority: "high",
        assignee: "Team Lead",
      },
      {
        id: "2",
        text: "Requirements Analysis",
        start_date: "2025-09-26",
        duration: 3,
        progress: 1,
        parent: "1",
        priority: "high",
        assignee: "Business Analyst",
      },
      {
        id: "3",
        text: "System Design",
        start_date: "2025-09-29",
        duration: 2,
        progress: 0.8,
        parent: "1",
        priority: "high",
        assignee: "System Architect",
      },
      {
        id: "4",
        text: "Development Phase",
        start_date: "2025-10-01",
        duration: 15,
        progress: 0.4,
        type: "project",
        priority: "medium",
        assignee: "Development Team",
      },
      {
        id: "5",
        text: "Frontend Development",
        start_date: "2025-10-01",
        duration: 8,
        progress: 0.6,
        parent: "4",
        priority: "medium",
        assignee: "Frontend Developer",
      },
      {
        id: "6",
        text: "Backend Development",
        start_date: "2025-10-03",
        duration: 10,
        progress: 0.3,
        parent: "4",
        priority: "medium",
        assignee: "Backend Developer",
      },
      {
        id: "7",
        text: "API Integration",
        start_date: "2025-10-10",
        duration: 3,
        progress: 0.2,
        parent: "4",
        priority: "high",
        assignee: "Full Stack Developer",
      },
      {
        id: "8",
        text: "Testing Phase",
        start_date: "2025-10-16",
        duration: 5,
        progress: 0,
        type: "project",
        priority: "high",
        assignee: "QA Team",
      },
      {
        id: "9",
        text: "Unit Testing",
        start_date: "2025-10-16",
        duration: 3,
        progress: 0,
        parent: "8",
        priority: "medium",
        assignee: "QA Engineer",
      },
      {
        id: "10",
        text: "Integration Testing",
        start_date: "2025-10-18",
        duration: 2,
        progress: 0,
        parent: "8",
        priority: "high",
        assignee: "QA Lead",
      },
      {
        id: "11",
        text: "Deployment",
        start_date: "2025-10-21",
        duration: 2,
        progress: 0,
        priority: "high",
        assignee: "DevOps Engineer",
      },
    ] as Task[],
    links: [
      { id: "1", source: "2", target: "3", type: "0" },
      { id: "2", source: "3", target: "5", type: "0" },
      { id: "3", source: "5", target: "6", type: "1" },
      { id: "4", source: "6", target: "7", type: "0" },
      { id: "5", source: "7", target: "9", type: "0" },
      { id: "6", source: "9", target: "10", type: "0" },
      { id: "7", source: "10", target: "11", type: "0" },
    ] as Link[],
  };

  useEffect(() => {
    if (!ganttRef.current) return;

    // Configure Gantt
    gantt.config.date_format = "%Y-%m-%d";
    gantt.config.scale_unit = "day";
    gantt.config.date_scale = "%d %M";
    gantt.config.subscales = [{ unit: "month", step: 1, date: "%F %Y" }];
    gantt.config.columns = [
      {
        name: "text",
        label: t("gantt.task") || "Task",
        width: 200,
        tree: true,
      },
      {
        name: "assignee",
        label: t("gantt.assignee") || "Assignee",
        width: 120,
        align: "center",
      },
      {
        name: "priority",
        label: t("gantt.priority") || "Priority",
        width: 80,
        align: "center",
        template: (task: Task) => {
          const priorityColors = {
            high: "#ff4757",
            medium: "#ffa502",
            low: "#2ed573",
          };
          const color = priorityColors[task.priority || "medium"];

          return `<span style="color: ${color}; font-weight: bold;">${
            task.priority || "medium"
          }</span>`;
        },
      },
      {
        name: "start_date",
        label: t("gantt.startDate") || "Start",
        width: 80,
        align: "center",
      },
      {
        name: "duration",
        label: t("gantt.duration") || "Duration",
        width: 70,
        align: "center",
      },
    ];

    // Configure grid width
    gantt.config.grid_width = 550;
    gantt.config.row_height = 40;

    // Configure colors based on priority
    gantt.templates.task_class = (start: any, end: any, task: any) => {
      const priorityClass = task.priority ? `priority-${task.priority}` : "";

      return `gantt-task ${priorityClass}`;
    };

    // RTL support
    if (language === "ar") {
      gantt.config.rtl = true;
    }

    // Configure tooltips
    gantt.templates.tooltip_text = (start: any, end: any, task: any) => {
      return `
        <b>${t("gantt.task") || "Task"}:</b> ${task.text}<br/>
        <b>${t("gantt.assignee") || "Assignee"}:</b> ${task.assignee || "Unassigned"}<br/>
        <b>${t("gantt.priority") || "Priority"}:</b> ${task.priority || "medium"}<br/>
        <b>${t("gantt.progress") || "Progress"}:</b> ${Math.round(task.progress * 100)}%<br/>
        <b>${t("gantt.duration") || "Duration"}:</b> ${task.duration} ${t("gantt.days") || "days"}
      `;
    };

    // Initialize gantt
    gantt.init(ganttRef.current);

    // Load data
    if (useMockData) {
      gantt.parse(mockData);
    }

    // Cleanup
    return () => {
      if (gantt.destructor) {
        gantt.destructor();
      }
    };
  }, [language, useMockData, t]);

  const handleZoomIn = () => {
    gantt.config.scale_unit = "day";
    gantt.config.date_scale = "%d %M";
    gantt.render();
  };

  const handleZoomOut = () => {
    gantt.config.scale_unit = "month";
    gantt.config.date_scale = "%F %Y";
    gantt.render();
  };

  const handleFullscreen = () => {
    if (ganttRef.current) {
      gantt.expand();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("gantt.title") || "Project Timeline"}
          </h3>
          <p className="text-sm text-default-600">
            {t("gantt.subtitle") || "Track project progress and dependencies"}
          </p>
        </div>
        {showToolbar && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              className="min-w-0"
              onPress={handleZoomIn}
            >
              {t("gantt.zoomIn") || "Day View"}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="min-w-0"
              onPress={handleZoomOut}
            >
              {t("gantt.zoomOut") || "Month View"}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="min-w-0"
              onPress={handleFullscreen}
            >
              {t("gantt.fullscreen") || "Expand"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardBody className="p-0">
        <div
          ref={ganttRef}
          className="gantt-container"
          style={{ width: "100%", height }}
        />
      </CardBody>
    </Card>
  );
};

export default DHtmlGanttChart;