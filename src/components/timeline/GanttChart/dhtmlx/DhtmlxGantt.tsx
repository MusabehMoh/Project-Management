// eslint-disable-next-line import/order
import { Sprint, Subtask, Task, Timeline } from "@/types/timeline";

import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import gantt from "dhtmlx-gantt";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Slider,
  DatePicker,
} from "@heroui/react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@heroui/use-theme";
import "./gantt-rtl.css";
import { useNavigate } from "react-router-dom";
import { Maximize } from "lucide-react";
import { CalendarDate } from "@internationalized/date";

import { useLanguage } from "@/contexts/LanguageContext";
import { MemberTask } from "@/types/membersTasks";

const DHTMLXGantt: FC<{
  projectId?: number | undefined;
  timeline?: Timeline;
  tasks?: MemberTask[];
  loading?: boolean;
  isFullScreen?: boolean;
  onTaskClick?: (task: MemberTask) => void;
  onDeleteEntity?: (id: string, type: string) => Promise<boolean>;
  onUpdateEntity?: (id: string, type: string, data: any) => Promise<boolean>;
}> = ({
  projectId,
  timeline,
  tasks,
  loading = false,
  isFullScreen = false,
  onTaskClick,
  onDeleteEntity,
  onUpdateEntity,
}) => {
  const el = useRef<HTMLDivElement | null>(null);
  const inited = useRef(false);
  const { t, language } = useLanguage();
  const [isDarkApp, setIsDarkApp] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isRTL = language === "ar";
  const [rowHeight, setRowHeight] = useState(26); // default height

  ///dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // --- helpers ---
  const formatDate = (d: string | Date | undefined) => {
    if (!d) return "";
    const x = typeof d === "string" ? new Date(d) : d;

    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };

  const daysBetween = (a?: string | Date, b?: string | Date) => {
    if (!a || !b) return 1;
    const A = typeof a === "string" ? new Date(a) : a;
    const B = typeof b === "string" ? new Date(b) : b;

    return Math.max(
      1,
      Math.ceil(Math.abs(B.getTime() - A.getTime()) / (1000 * 60 * 60 * 24))
    );
  };

  // --- locales ---
  const arLocale = useMemo(
    () => ({
      date: {
        month_full: [
          "يناير",
          "فبراير",
          "مارس",
          "أبريل",
          "مايو",
          "يونيو",
          "يوليو",
          "أغسطس",
          "سبتمبر",
          "أكتوبر",
          "نوفمبر",
          "ديسمبر",
        ],
        month_short: [
          "ينا",
          "فبر",
          "مار",
          "أبر",
          "ماي",
          "يون",
          "يول",
          "أغس",
          "سبت",
          "أكت",
          "نوف",
          "ديس",
        ],
        day_full: [
          "الأحد",
          "الاثنين",
          "الثلاثاء",
          "الأربعاء",
          "الخميس",
          "الجمعة",
          "السبت",
        ],
        day_short: ["أحد", "اثن", "ثلث", "أرب", "خمي", "جمع", "سبت"],
      },
    }),
    []
  );

  const enLocale = useMemo(
    () => ({
      date: {
        month_full: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
        month_short: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        day_full: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        day_short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      },
    }),
    []
  );

  // --- layouts ---
  const ltrLayout = useMemo(
    () => ({
      css: "gantt_container",
      rows: [
        {
          cols: [
            { view: "grid", scrollX: "scrollHor", scrollY: "scrollVer" },
            { resizer: true, width: 1 },
            { view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer" },
            { view: "scrollbar", id: "scrollVer" },
          ],
        },
        { view: "scrollbar", id: "scrollHor", height: 20 },
      ],
    }),
    []
  );

  const rtlLayout = useMemo(
    () => ({
      css: "gantt_container",
      rows: [
        {
          cols: [
            { view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer" },
            { resizer: true, width: 1 },
            { view: "grid", scrollX: "scrollHor", scrollY: "scrollVer" },
            { view: "scrollbar", id: "scrollVer" },
          ],
        },
        { view: "scrollbar", id: "scrollHor", height: 20 },
      ],
    }),
    []
  );

  const formatDateForGantt = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const parseDateFromGantt = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);

    return new Date(year, month - 1, day);
  };

  // Apply row height dynamically when rowHeight changes
  useEffect(() => {
    if (!inited.current) return;

    gantt.silent(() => {
      gantt.config.row_height = rowHeight;
      gantt.config.bar_height = rowHeight - 4; // keep bar inside row
    });

    gantt.render();
  }, [rowHeight]);

  // ==== watch theme ====
  useEffect(() => {
    const html = document.documentElement;
    const computeDark = () =>
      theme === "dark" ||
      html.classList.contains("dark") ||
      html.getAttribute("data-theme") === "dark";

    const next = computeDark();

    setIsDarkApp(next);

    const observer = new MutationObserver(() => setIsDarkApp(computeDark()));

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, [theme]);

  // ==== INIT ====
  useEffect(() => {
    if (!el.current) return;

    gantt.clearAll();
    gantt.config.date_format = "%Y-%m-%d";
    gantt.config.rtl = isRTL;
    gantt.skin = "material";

    gantt.config.autosize = isFullScreen ? false : "y";
    gantt.config.fix_grid_header = true;
    gantt.config.scrollable = true;

    // Make rows smaller (default ~40px)
    gantt.config.row_height = 28;

    // Optional: make task bars fit better inside smaller rows
    gantt.config.bar_height = 24;

    gantt.init(el.current);

    el.current.classList.toggle("gantt-dark", isDarkApp);
    el.current.classList.toggle("gantt-light", !isDarkApp);
    el.current.classList.toggle("gantt-rtl", isRTL);

    inited.current = true;

    ///dialog
    if (onTaskClick) {
      gantt.showLightbox = function (id: string) {
        // Find the task in your existing list
        const currentTask = tasks?.find((t) => t.id === id);

        if (currentTask) {
          onTaskClick(currentTask);
        } else {
          console.warn("Task not found for id:", id);
        }
      };
    } else {
      gantt.showLightbox = function (id: string) {
        const task = gantt.getTask(id);

        setSelectedTask(task); // Save task into state
        console.log("selected task is:: ");
        console.log(task);
        setDialogOpen(true); // Open React dialog
      };

      gantt.hideLightbox = function () {
        setDialogOpen(false);
      };
    }

    return () => {
      gantt.clearAll();
    };
    // run once
  }, [isFullScreen]);

  // === ZOOM CONFIG with localized week formatter ===
  const zoomConfig = useMemo(() => {
    const weekFormatter = (date: Date) => {
      const weekNum = gantt.date.date_to_str("%W")(date);

      return language === "ar" ? `الأسبوع ${weekNum}` : `Week #${weekNum}`;
    };

    return {
      day: [{ unit: "day", step: 1, format: gantt.date.date_to_str("%d %M") }],
      week: [
        { unit: "week", step: 1, format: weekFormatter },
        { unit: "day", step: 1, format: gantt.date.date_to_str("%D") },
      ],
      month: [
        { unit: "month", step: 1, format: gantt.date.date_to_str("%F %Y") },
        { unit: "week", step: 1, format: weekFormatter },
      ],
      year: [
        { unit: "year", step: 1, format: gantt.date.date_to_str("%Y") },
        { unit: "month", step: 1, format: gantt.date.date_to_str("%M") },
      ],
    };
  }, [language]);

  const [zoomLevel, setZoomLevel] = useState<"day" | "week" | "month" | "year">(
    "month"
  );

  const applyZoom = (level: "day" | "week" | "month" | "year") => {
    setZoomLevel(level);

    // --- capture current left-most visible date so we can restore it after zoom changes ---
    const prevState: any = gantt.getScrollState
      ? gantt.getScrollState()
      : { x: 0, y: 0 };
    const leftVisibleDate: any =
      gantt.dateFromPos && typeof prevState.x === "number"
        ? gantt.dateFromPos(prevState.x)
        : null;

    gantt.silent(() => {
      gantt.config.scales = zoomConfig[level];
    });

    gantt.resetLayout();
    gantt.render();

    // restore scroll so the previously left-most date stays at the left (or right in RTL)
    requestAnimationFrame(() => {
      try {
        const newState: any = gantt.getScrollState
          ? gantt.getScrollState()
          : { x: 0, y: 0 };

        // compute new pixel position for the saved date after zoom
        const newPos =
          leftVisibleDate && gantt.posFromDate
            ? gantt.posFromDate(leftVisibleDate)
            : prevState.x || 0;

        // total scrollable width (be defensive across gantt versions)
        let totalScrollable = 0;

        if (typeof newState.max_x === "number") {
          totalScrollable = newState.max_x;
        } else if (
          typeof newState.width === "number" &&
          typeof newState.inner_width === "number"
        ) {
          totalScrollable = Math.max(0, newState.width - newState.inner_width);
        } else if (typeof newState.width === "number") {
          // best-effort fallback: treat width as total scrollable
          totalScrollable = newState.width;
        }

        let finalX = Math.round(newPos || 0);

        if (isRTL) {
          finalX = Math.round(Math.max(0, totalScrollable - (newPos || 0)));
        }

        gantt.scrollTo(finalX, newState.y ?? prevState.y ?? 0);
      } catch (e) {
        // fallback: no-op
      }
    });
  };

  // ==== repaint on theme/lang/rtl ====
  useEffect(() => {
    if (!inited.current) return;

    // capture scroll
    const scrollState = gantt.getScrollState?.();
    const visibleDate =
      (gantt.dateFromPos && scrollState
        ? gantt.dateFromPos(scrollState.x)
        : null) || null;

    gantt.silent(() => {
      if (el.current) {
        el.current.classList.toggle("gantt-dark", isDarkApp);
        el.current.classList.toggle("gantt-light", !isDarkApp);
        el.current.classList.toggle("gantt-rtl", isRTL);
      }

      gantt.resetLightbox();

      gantt.templates.task_class = (_s: any, _e: any, task: any) => {
        let base = `${isRTL ? "rtl-task " : ""}${isDarkApp ? "task-dark" : "task-light"}`;

        if (task.type === "sprint") base += " task-sprint";
        if (task.type === "requirement") base += " task-requirement";
        if (task.type === "task") base += " task-main";
        if (task.type === "subtask") base += " task-sub";

        return base;
      };

      gantt.config.rtl = isRTL;
      gantt.config.layout = isRTL ? rtlLayout : ltrLayout;
      gantt.i18n.setLocale(isRTL ? arLocale : enLocale);

      gantt.config.columns = [
        {
          name: "text",
          label: ` ${t("timeline.taskName")} `,
          tree: true,
          width: 250,
          align: "left",
        },
        {
          name: "start_date",
          label: ` ${t("timeline.startDate")} `,
          width: 120,
          align: "center",
        },
        {
          name: "duration",
          label: t("timeline.duration"),
          width: 80,
          align: "center",
        },
      ];

      // 🔑 force re-apply zoom config when language changes
      gantt.config.scales = zoomConfig[zoomLevel];
    });

    gantt.resetLayout();
    gantt.render();
    gantt.refreshData();

    // restore scroll
    if (visibleDate || scrollState) {
      requestAnimationFrame(() => {
        try {
          const prev = scrollState || { x: 0, y: 0 };

          // after re-render get new scroll state
          const newState: any = gantt.getScrollState
            ? gantt.getScrollState()
            : { x: 0, y: 0 };

          // compute position of the previously visible left date in new coordinates
          const newPos =
            visibleDate && gantt.posFromDate
              ? gantt.posFromDate(visibleDate)
              : prev.x || 0;

          // compute total scrollable width defensively
          let totalScrollable = 0;

          if (typeof newState.max_x === "number") {
            totalScrollable = newState.max_x;
          } else if (
            typeof newState.width === "number" &&
            typeof newState.inner_width === "number"
          ) {
            totalScrollable = Math.max(
              0,
              newState.width - newState.inner_width
            );
          } else if (typeof newState.width === "number") {
            totalScrollable = newState.width;
          }

          let finalX = Math.round(newPos || 0);

          if (isRTL) {
            finalX = Math.round(Math.max(0, totalScrollable - (newPos || 0)));
          }

          gantt.scrollTo(finalX, newState.y ?? prev.y ?? 0);
        } catch (e) {
          // ignore
        }
      });
    }
  }, [
    isDarkApp,
    language,
    isRTL,
    arLocale,
    enLocale,
    ltrLayout,
    rtlLayout,
    t,
    zoomConfig,
    zoomLevel,
  ]);

  // --- write data ---
  useEffect(() => {
    console.log("----write data begins");
    console.log(timeline);
    if (!inited.current) return;

    const data = { data: [] as any[], links: [] as any[] };
    const id = (p: string, n: string | number) => `${p}-${n}`;

    if (timeline) {
      data.data.push({
        id: timeline.id,
        text: timeline.name,
        description: timeline.description ?? "",
        start_date: formatDate(timeline.startDate),
        duration: daysBetween(timeline.startDate, timeline.endDate),
        open: true,
        type: "timeline",
        color: "#3B82F6",
        border: "#3B82F6",
      });

      timeline.sprints.forEach((sprint: Sprint) => {
        const sid = id("S", sprint.id);

        data.data.push({
          id: sid,
          text: sprint.name,
          description: sprint.description ?? "",
          start_date: formatDate(sprint.startDate),
          duration: daysBetween(sprint.startDate, sprint.endDate),
          open: true,
          parent: timeline.id,
          type: "sprint",
          color: "#22C55E",
          border: "#22C55E",
        });

        sprint.tasks.forEach((task: Task) => {
          const rid = id("T", task.id);

          data.data.push({
            id: rid,
            text: task.name,
            description: task.description ?? "",
            progress: task.progress,
            start_date: formatDate(task.startDate),
            duration: daysBetween(task.startDate, task.endDate),
            parent: sid,
            open: true,
            type: "task",
            color: "#8B5CF6",
            border: "#8B5CF6",
          });

          task.subtasks?.forEach((sub: Subtask) => {
            const tid = id("U", sub.id);

            data.data.push({
              id: tid,
              text: sub.name,
              description: sub.description ?? "",
              progress: sub.progress,
              start_date: formatDate(sub.startDate || task.startDate),
              duration: daysBetween(
                sub.startDate || task.startDate,
                sub.endDate || task.endDate
              ),
              parent: rid,
              type: "subtask",
              color: "#EAB308",
              border: "#EAB308",
            });
          });
        });
      });
    } else {
      const colors = ["#3B82F6", "#22C55E", "#8B5CF6", "#EAB308"];

      tasks?.forEach((task: MemberTask, index) => {
        const color = colors[index % colors.length];

        data.data.push({
          id: task.id,
          text: task.name,
          description: task.description ?? "",
          start_date: formatDate(task.startDate),
          duration: daysBetween(task.startDate, task.endDate),
          open: false,
          type: "task",
          color: color,
          border: color,
        });
      });
    }

    gantt.clearAll();
    gantt.parse(data); // ✅ this is the correct place
  }, [timeline]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        Loading Gantt chart…
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Fixed Toolbar */}
      <div
        className="flex items-center justify-between h-14 px-4 mb-2 mt-4 
                 sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm"
      >
        {/* Zoom Controls */}
        <div className={`flex gap-2 ${isRTL ? "mr-4" : "ml-4"}`}>
          <button
            className={`px-3 py-1 rounded-md transition-colors ${
              isDarkApp
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : zoomLevel === "day"
                  ? "bg-blue-400 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => applyZoom("day")}
          >
            {t("timeline.day")}
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-colors ${
              isDarkApp
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : zoomLevel === "week"
                  ? "bg-blue-400 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => applyZoom("week")}
          >
            {t("timeline.week")}
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-colors ${
              isDarkApp
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : zoomLevel === "month"
                  ? "bg-blue-400 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => applyZoom("month")}
          >
            {t("timeline.month")}
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-colors ${
              isDarkApp
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : zoomLevel === "year"
                  ? "bg-blue-400 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => applyZoom("year")}
          >
            {t("timeline.year")}
          </button>
        </div>

        {/* Title + Fullscreen (only show when NOT fullscreen) */}
        {isFullScreen ? (
          <div
            className={`flex items-center gap-3 ${
              isRTL ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Label Text */}
            <span className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
              {t("timeline.controlCellHeight")}
            </span>

            {/* HeroUI Slider */}
            <div className="max-w-md" dir="ltr">
              <Slider
                aria-label="Row height"
                className="w-48"
                getValue={(value) => `${value}%`}
                maxValue={52}
                minValue={18}
                showTooltip={true}
                size="sm"
                step={1}
                value={rowHeight}
                onChange={(val) => setRowHeight(val as number)}
              />
            </div>

            {/* Value */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {52}px
            </span>
          </div>
        ) : !tasks ? (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              {t("timeline.ganttView")}
            </h3>
            <button
              aria-label="Open fullscreen Gantt chart"
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                navigate("/ganttChart", { state: { projectId, timeline } });
              }}
            >
              <Maximize className="w-5 h-5 text-gray-600 dark:text-gray-200" />
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Chart */}
      <div
        ref={el}
        style={{
          width: "100%",
          height: isFullScreen ? "calc(90vh - 140px)" : "auto",
          direction: "ltr", // Gantt handles RTL internally
        }}
      />

      {/* Modal */}
      <Modal isOpen={dialogOpen} size="lg" onOpenChange={setDialogOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("timeline.gantt.editTask")}
              </ModalHeader>
              <ModalBody className="space-y-4">
                {/* Task Name */}
                <Input
                  label={t("timeline.taskName")}
                  value={selectedTask?.text || ""}
                  onChange={(e) =>
                    setSelectedTask({ ...selectedTask, text: e.target.value })
                  }
                />
                {/* Task Description */}
                <Textarea
                  label={t("timeline.gantt.description")}
                  value={selectedTask?.description || ""}
                  onChange={(e) =>
                    setSelectedTask({
                      ...selectedTask,
                      description: e.target.value,
                    })
                  }
                />
                {/* Start Date */}
                <DatePicker
                  showMonthAndYearPickers
                  granularity="day"
                  label={t("timeline.startDate")}
                  value={
                    selectedTask?.start_date
                      ? new CalendarDate(
                          new Date(selectedTask.start_date).getFullYear(),
                          new Date(selectedTask.start_date).getMonth() + 1,
                          new Date(selectedTask.start_date).getDate()
                        )
                      : null
                  }
                  onChange={(val) =>
                    setSelectedTask({
                      ...selectedTask,
                      start_date: val
                        ? `${val.year}-${String(val.month).padStart(
                            2,
                            "0"
                          )}-${String(val.day).padStart(2, "0")}`
                        : "",
                    })
                  }
                />
                {/* Duration */}
                <Input
                  label={t("timeline.duration")}
                  type="number"
                  value={selectedTask?.duration || ""}
                  onChange={(e) =>
                    setSelectedTask({
                      ...selectedTask,
                      duration: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
                {/* Progress */}
                {(selectedTask?.type === "task" ||
                  selectedTask?.type === "subtask" ||
                  selectedTask?.type === "requirement") && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                      <span>{t("timeline.gantt.progress")}</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {selectedTask?.progress || 0}%
                      </span>
                    </label>
                    <Slider
                      aria-label="Task progress"
                      maxValue={100}
                      minValue={0}
                      step={1}
                      value={selectedTask?.progress || 0}
                      onChange={(val) =>
                        setSelectedTask({ ...selectedTask, progress: val })
                      }
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <Button
                  color="default"
                  variant="flat"
                  onPress={() => {
                    gantt.hideLightbox();
                    onClose();
                  }}
                >
                  {t("timeline.gantt.cancel")}
                </Button>
                <div className="flex gap-2">
                  <Button
                    color="danger"
                    variant="bordered"
                    onPress={async () => {
                      const success = await onDeleteEntity(
                        selectedTask.id,
                        selectedTask.type
                      );

                      if (success) {
                        gantt.deleteTask(selectedTask.id);
                        onClose();
                      }
                    }}
                  >
                    {t("timeline.gantt.delete")}
                  </Button>
                  <Button
                    color="primary"
                    onPress={async () => {
                      const success = await onUpdateEntity(
                        selectedTask.id,
                        selectedTask.type,
                        {
                          name: selectedTask.text,
                          description: selectedTask.description,
                          startDate: formatDateForGantt(
                            selectedTask.start_date
                          ),
                          duration: selectedTask.duration,
                          progress: selectedTask.progress ?? 0,
                        }
                      );

                      if (success) {
                        gantt.updateTask(selectedTask.id, selectedTask);
                        onClose();
                      }
                    }}
                  >
                    {t("timeline.gantt.save")}
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DHTMLXGantt;
