import type { CalendarEvent } from "@/services/api/calendarService";

import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker, TimeInput } from "@heroui/react";
import { Switch } from "@heroui/switch";
import { parseDate, Time, CalendarDate } from "@internationalized/date";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCalendar } from "@/hooks/useCalendar";

interface CalendarComponentProps {
  showSidebar?: boolean;
  maxHeight?: string;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  showSidebar = true,
  maxHeight = "600px",
}) => {
  const { t, direction, language } = useLanguage();
  const {
    events,
    stats,
    upcomingEvents,
    overdueEvents,
    loading,
    error,
    selectedDate,
    viewMode,
    setViewMode,
    goToPrevious,
    goToNext,
    goToToday,
    getEventsForDate,
    refreshCalendar,
    clearError,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendar();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] =
    useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  // Local UI filters for client-side filtering
  const [uiFilters, setUiFilters] = useState({
    type: "",
    priority: "",
    searchTerm: "",
  });

  // Validation functions
  const validateField = (field: string, value: any) => {
    const errors: Record<string, string> = {};

    switch (field) {
      case "title":
        if (!value.trim()) {
          errors.title = t("calendar.validation.titleRequired");
        } else if (value.trim().length < 3) {
          errors.title = t("calendar.validation.titleTooShort");
        }
        break;
      case "startDate":
        if (!value) {
          errors.startDate = t("calendar.validation.startDateRequired");
        }
        break;
      case "startTime":
        if (!eventForm.isAllDay && !value) {
          errors.startTime = t("calendar.validation.startTimeRequired");
        }
        break;
      case "endDate":
        if (
          value &&
          eventForm.startDate &&
          value.compare(eventForm.startDate) < 0
        ) {
          errors.endDate = t("calendar.validation.endDateBeforeStart");
        }
        break;
      case "endTime":
        if (
          !eventForm.isAllDay &&
          value &&
          eventForm.startTime &&
          eventForm.endDate &&
          eventForm.startDate &&
          eventForm.endDate.compare(eventForm.startDate) === 0 &&
          value.compare(eventForm.startTime) <= 0
        ) {
          errors.endTime = t("calendar.validation.endTimeBeforeStart");
        }
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] || "" }));

    return !errors[field];
  };

  const handleFieldChange = (field: string, value: any) => {
    setEventForm((prev) => ({ ...prev, [field]: value }));

    // Validate on change if field has been touched
    if (touchedFields[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    validateField(field, eventForm[field as keyof typeof eventForm]);
  };

  // Filter events based on current filters
  const filteredEvents = events.filter((event) => {
    // Filter by type
    if (uiFilters.type && event.type !== uiFilters.type) {
      return false;
    }

    // Filter by priority
    if (uiFilters.priority && event.priority !== uiFilters.priority) {
      return false;
    }

    // Filter by search term (title or description)
    if (uiFilters.searchTerm) {
      const searchLower = uiFilters.searchTerm.toLowerCase();
      const titleMatch = event.title.toLowerCase().includes(searchLower);
      const descMatch = event.description?.toLowerCase().includes(searchLower);

      if (!titleMatch && !descMatch) {
        return false;
      }
    }

    return true;
  });

  // Reset filters
  const resetFilters = () => {
    setUiFilters({
      type: "",
      priority: "",
      searchTerm: "",
    });
  };

  // Get filtered events for a specific date
  const getFilteredEventsForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date);

    return dayEvents.filter((event) => {
      // Filter by type
      if (uiFilters.type && event.type !== uiFilters.type) {
        return false;
      }

      // Filter by priority
      if (uiFilters.priority && event.priority !== uiFilters.priority) {
        return false;
      }

      // Filter by search term (title or description)
      if (uiFilters.searchTerm) {
        const searchLower = uiFilters.searchTerm.toLowerCase();
        const titleMatch = event.title.toLowerCase().includes(searchLower);
        const descMatch = event.description
          ?.toLowerCase()
          .includes(searchLower);

        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  };
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: null as CalendarDate | null,
    startTime: null as Time | null,
    endDate: null as CalendarDate | null,
    endTime: null as Time | null,
    type: "meeting" as CalendarEvent["type"],
    priority: "medium" as CalendarEvent["priority"],
    location: "",
    isAllDay: false,
  });

  // Get color for event type
  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "project":
        return "primary";
      case "requirement":
        return "secondary";
      case "meeting":
        return "success";
      case "deadline":
        return "danger";
      case "milestone":
        return "warning";
      default:
        return "default";
    }
  };

  // Get color for event status
  const getEventStatusColor = (status: CalendarEvent["status"]) => {
    switch (status) {
      case "upcoming":
        return "primary";
      case "in-progress":
        return "warning";
      case "completed":
        return "success";
      case "overdue":
        return "danger";
      default:
        return "default";
    }
  };

  // Get color for priority level
  const getPriorityColor = (priority: CalendarEvent["priority"]) => {
    switch (priority) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  // Get border style for priority (for visual emphasis)
  const getPriorityBorder = (priority: CalendarEvent["priority"]) => {
    const borderSide = direction === "rtl" ? "border-r" : "border-l";

    switch (priority) {
      case "critical":
        return `${borderSide}-4 border-danger-500`;
      case "high":
        return `${borderSide}-4 border-warning-500`;
      case "medium":
        return `${borderSide}-2 border-primary-500`;
      case "low":
        return `${borderSide}-2 border-success-500`;
      default:
        return "";
    }
  };

  // Get comprehensive event styling based on multiple factors
  const getEventStyling = (event: CalendarEvent) => {
    const baseClasses =
      "text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-all duration-200";
    const typeColor = getEventTypeColor(event.type);
    const priorityBorder = getPriorityBorder(event.priority);

    // Combine background color with priority border
    const backgroundColor = `var(--heroui-colors-${typeColor}-100)`;
    const borderColor =
      event.status === "overdue"
        ? "border-danger-300"
        : `border-${typeColor}-200`;

    return {
      className: `${baseClasses} ${priorityBorder} border ${borderColor} ${
        event.status === "overdue" ? "animate-pulse" : ""
      }`,
      style: {
        backgroundColor,
        boxShadow:
          event.priority === "critical"
            ? "0 2px 8px rgba(239, 68, 68, 0.3)"
            : event.priority === "high"
              ? "0 2px 6px rgba(245, 158, 11, 0.2)"
              : "none",
      },
    };
  };

  // Get priority icon
  const getPriorityIcon = (priority: CalendarEvent["priority"]) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="w-3 h-3 text-danger" />;
      case "high":
        return <AlertTriangle className="w-3 h-3 text-warning" />;
      case "medium":
        return <Clock className="w-3 h-3 text-primary" />;
      case "low":
        return <CheckCircle className="w-3 h-3 text-success" />;
      default:
        return null;
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate calendar grid for month view
  const generateCalendarGrid = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayEvents = getFilteredEventsForDate(current);
        const isCurrentMonth = current.getMonth() === month;
        const isToday = current.toDateString() === new Date().toDateString();

        weekDays.push({
          date: new Date(current),
          events: dayEvents,
          isCurrentMonth,
          isToday,
        });

        current.setDate(current.getDate() + 1);
      }
      days.push(weekDays);

      // Stop if we've covered the month and have reached the end of a week
      if (current > lastDay && current.getDay() === 0) break;
    }

    return days;
  };

  // Form handling functions
  const resetForm = () => {
    setEventForm({
      title: "",
      description: "",
      startDate: null,
      startTime: null,
      endDate: null,
      endTime: null,
      type: "meeting",
      priority: "medium",
      location: "",
      isAllDay: false,
    });
    setEditingEvent(null);
    setFieldErrors({});
    setTouchedFields({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    // Convert to CalendarDate and Time objects
    const calendarStartDate = parseDate(startDate.toISOString().split("T")[0]);
    const startTime = new Time(startDate.getHours(), startDate.getMinutes());

    const calendarEndDate = endDate
      ? parseDate(endDate.toISOString().split("T")[0])
      : null;
    const endTime = endDate
      ? new Time(endDate.getHours(), endDate.getMinutes())
      : null;

    setEventForm({
      title: event.title,
      description: event.description || "",
      startDate: calendarStartDate,
      startTime: startTime,
      endDate: calendarEndDate,
      endTime: endTime,
      type: event.type,
      priority: event.priority,
      location: event.location || "",
      isAllDay: event.isAllDay || false,
    });
    setEditingEvent(event);
    setFieldErrors({});
    setTouchedFields({});
    setShowCreateModal(true);
  };

  const handleSaveEvent = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate all fields
    const fieldsToValidate = ["title", "startDate"];

    if (!eventForm.isAllDay) {
      fieldsToValidate.push("startTime");
    }
    if (eventForm.endDate) {
      fieldsToValidate.push("endDate");
    }
    if (eventForm.endTime && !eventForm.isAllDay) {
      fieldsToValidate.push("endTime");
    }

    let hasErrors = false;

    fieldsToValidate.forEach((field) => {
      if (!validateField(field, eventForm[field as keyof typeof eventForm])) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      return;
    } // Create ISO date strings
    const createISOString = (
      date: CalendarDate,
      time?: Time | null,
      isAllDay?: boolean,
    ) => {
      if (isAllDay) {
        return `${date.toString()}T00:00:00.000Z`;
      }
      if (time) {
        return `${date.toString()}T${time.toString()}:00.000Z`;
      }

      return `${date.toString()}T00:00:00.000Z`;
    };

    const startDateTime = createISOString(
      eventForm.startDate!,
      eventForm.startTime,
      eventForm.isAllDay,
    );
    const endDateTime = eventForm.endDate
      ? createISOString(
          eventForm.endDate,
          eventForm.endTime,
          eventForm.isAllDay,
        )
      : eventForm.isAllDay
        ? `${eventForm.startDate!.toString()}T23:59:59.999Z`
        : eventForm.startTime
          ? `${eventForm.startDate!.toString()}T${eventForm.startTime.add({ hours: 1 }).toString()}:00.000Z`
          : `${eventForm.startDate!.toString()}T01:00:00.000Z`;
    const eventData = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim(),
      startDate: startDateTime,
      endDate: endDateTime,
      type: eventForm.type,
      status: "upcoming" as CalendarEvent["status"],
      priority: eventForm.priority,
      location: eventForm.location.trim() || undefined,
      isAllDay: eventForm.isAllDay,
      createdBy: 1, // Current user ID - should come from user context
      assignedTo: [1], // Current user - should be selectable
    };

    let success = false;

    if (editingEvent) {
      success = await updateEvent(editingEvent.id, eventData);
    } else {
      success = await createEvent(eventData);
    }

    if (success) {
      setShowCreateModal(false);
      resetForm();
    } else {
      // Handle save failure - could show a toast notification here
      // For now, we'll just keep the modal open so user can try again
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    const success = await deleteEvent(eventId);

    if (success) {
      setShowEventDetails(null);
    }
  };

  if (loading && events.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="flex justify-center items-center py-8">
          <Spinner label={t("common.loading")} size="lg" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardBody className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-danger text-center">
            <h3 className="text-lg font-semibold">{t("common.error")}</h3>
            <p className="text-default-500">{error}</p>
          </div>
          <Button
            color="primary"
            onPress={() => {
              clearError();
              refreshCalendar();
            }}
          >
            {t("common.retry")}
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Main Calendar */}
      <Card className={`${showSidebar ? "flex-1" : "w-full"}`}>
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              <h3 className="text-lg font-semibold">{t("calendar.title")}</h3>
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-1">
              {(["month", "week", "day"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? "solid" : "ghost"}
                  onPress={() => setViewMode(mode)}
                >
                  {t(`calendar.${mode}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              isIconOnly
              isLoading={loading}
              size="sm"
              variant="ghost"
              onPress={refreshCalendar}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* Filter Button */}
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>

            {/* Add Event Button */}
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="w-4 h-4" />}
              onPress={openCreateModal}
            >
              {t("calendar.addEvent")}
            </Button>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="p-6">
          <ScrollShadow hideScrollBar>
            {/* Calendar Header with Navigation - Fixed for RTL */}
            <div className="flex justify-between items-center mb-6">
              {/* Previous Button - Shows correct arrow based on language */}
              <Button
                isIconOnly
                aria-label={t("calendar.previousMonth")}
                variant="ghost"
                onPress={goToPrevious}
              >
                {language === "ar" ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>

              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {formatDate(selectedDate)}
                </h2>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="flat" onPress={goToToday}>
                  {t("calendar.today")}
                </Button>
                {/* Next Button - Shows correct arrow based on language */}
                <Button
                  isIconOnly
                  aria-label={t("calendar.nextMonth")}
                  variant="ghost"
                  onPress={goToNext}
                >
                  {language === "ar" ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mb-6 p-4 bg-default-50 dark:bg-default-100/50 rounded-lg border border-default-200">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      classNames={{
                        label: "text-foreground-600",
                        input: "text-foreground",
                      }}
                      label={t("calendar.search")}
                      placeholder={t("calendar.searchPlaceholder")}
                      size="sm"
                      value={uiFilters.searchTerm}
                      onChange={(e) =>
                        setUiFilters({
                          ...uiFilters,
                          searchTerm: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="min-w-[120px]">
                    <Select
                      classNames={{
                        label: "text-foreground-600",
                        value: "text-foreground",
                      }}
                      label={t("calendar.type")}
                      placeholder={t("calendar.allTypes")}
                      selectedKeys={uiFilters.type ? [uiFilters.type] : []}
                      size="sm"
                      onSelectionChange={(keys) => {
                        const value = (Array.from(keys)[0] as string) || "";

                        setUiFilters({ ...uiFilters, type: value });
                      }}
                    >
                      <SelectItem key="meeting">
                        {t("calendar.eventTypes.meeting")}
                      </SelectItem>
                      <SelectItem key="task">
                        {t("calendar.eventTypes.task")}
                      </SelectItem>
                      <SelectItem key="deadline">
                        {t("calendar.eventTypes.deadline")}
                      </SelectItem>
                      <SelectItem key="project">
                        {t("calendar.eventTypes.project")}
                      </SelectItem>
                      <SelectItem key="requirement">
                        {t("calendar.eventTypes.requirement")}
                      </SelectItem>
                    </Select>
                  </div>

                  <div className="min-w-[120px]">
                    <Select
                      classNames={{
                        label: "text-foreground-600",
                        value: "text-foreground",
                      }}
                      label={t("calendar.priority")}
                      placeholder={t("calendar.allPriorities")}
                      selectedKeys={
                        uiFilters.priority ? [uiFilters.priority] : []
                      }
                      size="sm"
                      onSelectionChange={(keys) => {
                        const value = (Array.from(keys)[0] as string) || "";

                        setUiFilters({ ...uiFilters, priority: value });
                      }}
                    >
                      <SelectItem key="low">
                        {t("calendar.priorities.low")}
                      </SelectItem>
                      <SelectItem key="medium">
                        {t("calendar.priorities.medium")}
                      </SelectItem>
                      <SelectItem key="high">
                        {t("calendar.priorities.high")}
                      </SelectItem>
                      <SelectItem key="urgent">
                        {t("calendar.priorities.urgent")}
                      </SelectItem>
                    </Select>
                  </div>

                  <Button size="sm" variant="flat" onPress={resetFilters}>
                    {t("calendar.clearFilters")}
                  </Button>
                </div>
              </div>
            )}

            {/* Color Legend */}
            <Accordion
              isCompact
              className="mb-4"
              defaultExpandedKeys={["legend"]}
            >
              <AccordionItem key="legend" title={t("calendar.colorLegend")}>
                <div className="mb-4 p-3 bg-default-50 dark:bg-default-100/50 rounded-lg border border-default-200">
                  <h4 className="text-sm font-semibold mb-2 text-foreground-600">
                    {t("calendar.colorLegend")}
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Event Types */}
                    <div>
                      <p className="font-medium mb-1">{t("calendar.type")}:</p>
                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-3 h-3 rounded bg-primary-100 border border-primary-200" />
                          <span>{t("calendar.eventTypes.project")}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-3 h-3 rounded bg-success-100 border border-success-200" />
                          <span>{t("calendar.eventTypes.meeting")}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-3 h-3 rounded bg-danger-100 border border-danger-200" />
                          <span>{t("calendar.eventTypes.deadline")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Priority Levels */}
                    <div>
                      <p className="font-medium mb-1">
                        {t("calendar.priority")}:
                      </p>
                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`w-3 h-3 rounded bg-danger-100 ${direction === "rtl" ? "border-r-4" : "border-l-4"} border-danger-500`}
                          />
                          <span>{t("calendar.priorities.urgent")}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`w-3 h-3 rounded bg-warning-100 ${direction === "rtl" ? "border-r-4" : "border-l-4"} border-warning-500`}
                          />
                          <span>{t("calendar.priorities.high")}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`w-3 h-3 rounded bg-primary-100 ${direction === "rtl" ? "border-r-2" : "border-l-2"} border-primary-500`}
                          />
                          <span>{t("calendar.priorities.medium")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div>
                      <p className="font-medium mb-1">
                        {t("calendar.status")}:
                      </p>
                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-3 h-3 rounded bg-danger-100 border border-danger-300 animate-pulse" />
                          <span>{t("calendar.overdue")}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-3 h-3 rounded bg-warning-100 border border-warning-200" />
                          <span>{t("calendar.status.in-progress")}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-3 h-3 rounded bg-success-100 border border-success-200" />
                          <span>{t("calendar.status.completed")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Effects */}
                    <div>
                      <p className="font-medium mb-1">
                        {t("calendar.visualEffects")}:
                      </p>
                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-3 h-3 rounded bg-danger-100 border border-danger-300 shadow-md" />
                          <span>{t("calendar.criticalShadow")}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`w-3 h-3 rounded bg-default-100 ${direction === "rtl" ? "border-r-4" : "border-l-4"} border-primary-500`}
                          />
                          <span>{t("calendar.priorityBorder")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>

            {/* Calendar Grid (Month View) */}
            {viewMode === "month" && (
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-default-600"
                    >
                      {t(`calendar.${day.toLowerCase()}`)}
                    </div>
                  ),
                )}

                {/* Calendar Days */}
                {generateCalendarGrid().map((week, weekIndex) =>
                  week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                      min-h-[80px] p-1 border border-default-200 rounded-lg
                      ${day.isCurrentMonth ? "bg-content1" : "bg-default-50"}
                      ${day.isToday ? "bg-primary-50 border-primary-200" : ""}
                      hover:bg-default-100 cursor-pointer transition-colors
                    `}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          day.isCurrentMonth
                            ? "text-foreground"
                            : "text-default-400"
                        } ${day.isToday ? "text-primary-600" : ""}`}
                      >
                        {day.date.getDate()}
                      </div>

                      {/* Day Events */}
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map((event) => {
                          const styling = getEventStyling(event);

                          return (
                            <div
                              key={event.id}
                              className={styling.className}
                              style={styling.style}
                              onClick={() => setShowEventDetails(event)}
                            >
                              <div
                                className={`flex items-center gap-1 mb-1 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                              >
                                <div className="truncate font-medium flex-1">
                                  {event.title}
                                </div>
                                {getPriorityIcon(event.priority)}
                              </div>
                              <div
                                className={`flex items-center justify-between text-xs opacity-70 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                              >
                                <span className="capitalize">
                                  {t(`calendar.type.${event.type}`)}
                                </span>
                                {event.status === "overdue" && (
                                  <span className="text-danger-600 font-medium">
                                    !
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {day.events.length > 2 && (
                          <div className="text-xs text-default-500 text-center">
                            +{day.events.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )),
                )}
              </div>
            )}

            {/* Week/Day View - Event List */}
            {(viewMode === "week" || viewMode === "day") && (
              <ScrollShadow hideScrollBar className="max-h-96">
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-default-500">
                      {t("calendar.noEvents")}
                    </div>
                  ) : (
                    events.map((event) => {
                      const styling = getEventStyling(event);

                      return (
                        <Card
                          key={event.id}
                          isPressable
                          className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${styling.className}`}
                          style={{
                            ...styling.style,
                            backgroundColor: `var(--heroui-colors-${getEventTypeColor(event.type)}-50)`,
                          }}
                          onPress={() => setShowEventDetails(event)}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getPriorityIcon(event.priority)}
                                <h4 className="font-medium">{event.title}</h4>
                                <Chip
                                  color={getEventTypeColor(event.type)}
                                  size="sm"
                                  variant="flat"
                                >
                                  {t(`calendar.type.${event.type}`)}
                                </Chip>
                                {event.status === "overdue" && (
                                  <Chip color="danger" size="sm" variant="flat">
                                    {t("calendar.overdue")}
                                  </Chip>
                                )}
                              </div>

                              <div className="text-sm text-default-600 mb-2">
                                {formatTime(event.startDate)}
                                {event.endDate &&
                                  ` - ${formatTime(event.endDate)}`}
                              </div>

                              {event.description && (
                                <p className="text-sm text-default-500 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 items-end">
                              <Chip
                                color={getEventStatusColor(event.status)}
                                size="sm"
                                variant="dot"
                              >
                                {t(`calendar.status.${event.status}`)}
                              </Chip>
                              <Chip
                                color={getPriorityColor(event.priority)}
                                size="sm"
                                variant="flat"
                              >
                                {t(`calendar.priority.${event.priority}`)}
                              </Chip>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollShadow>
            )}
          </ScrollShadow>
        </CardBody>
      </Card>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 space-y-4">
          {/* Stats Card */}
          {stats && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  {t("calendar.overview")}
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {stats.upcomingEvents}
                    </div>
                    <div className="text-xs text-default-600">
                      {t("calendar.upcoming")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-danger">
                      {stats.overdueEvents}
                    </div>
                    <div className="text-xs text-default-600">
                      {t("calendar.overdue")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">
                      {stats.completedThisWeek}
                    </div>
                    <div className="text-xs text-default-600">
                      {t("calendar.completedWeek")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-warning">
                      {stats.criticalDeadlines}
                    </div>
                    <div className="text-xs text-default-600">
                      {t("calendar.critical")}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {t("calendar.upcomingEvents")}
              </h3>
            </CardHeader>
            <CardBody>
              <ScrollShadow hideScrollBar className="max-h-60">
                <div className="space-y-2">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-4 text-default-500">
                      {t("calendar.noUpcoming")}
                    </div>
                  ) : (
                    upcomingEvents.map((event) => {
                      const styling = getEventStyling(event);

                      return (
                        <div
                          key={event.id}
                          className={`p-2 rounded-lg hover:bg-default-50 cursor-pointer ${styling.className}`}
                          style={{
                            ...styling.style,
                            backgroundColor: `var(--heroui-colors-${getEventTypeColor(event.type)}-50)`,
                          }}
                          onClick={() => setShowEventDetails(event)}
                        >
                          <div
                            className={`flex items-center gap-2 mb-1 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                          >
                            {getPriorityIcon(event.priority)}
                            <span className="font-medium text-sm flex-1">
                              {event.title}
                            </span>
                            {event.status === "overdue" && (
                              <span className="text-danger-600 text-xs font-bold">
                                OVERDUE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-default-600 mb-1">
                            {formatTime(event.startDate)}
                          </div>
                          <div
                            className={`flex gap-1 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                          >
                            <Chip
                              color={getEventTypeColor(event.type)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`calendar.type.${event.type}`)}
                            </Chip>
                            <Chip
                              color={getPriorityColor(event.priority)}
                              size="sm"
                              variant="dot"
                            >
                              {t(`calendar.priority.${event.priority}`)}
                            </Chip>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollShadow>
            </CardBody>
          </Card>

          {/* Overdue Events */}
          {overdueEvents.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-danger">
                  {t("calendar.overdueEvents")}
                </h3>
              </CardHeader>
              <CardBody>
                <ScrollShadow hideScrollBar className="max-h-40">
                  <div className="space-y-2">
                    {overdueEvents.map((event) => {
                      const styling = getEventStyling(event);

                      return (
                        <div
                          key={event.id}
                          className={`p-2 rounded-lg cursor-pointer animate-pulse ${styling.className}`}
                          style={{
                            ...styling.style,
                            backgroundColor: "var(--heroui-colors-danger-50)",
                            borderColor: "var(--heroui-colors-danger-300)",
                          }}
                          onClick={() => setShowEventDetails(event)}
                        >
                          <div
                            className={`flex items-center gap-2 mb-1 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-danger animate-bounce" />
                            <span className="font-medium text-sm flex-1">
                              {event.title}
                            </span>
                            <span className="text-danger-600 text-xs font-bold">
                              OVERDUE
                            </span>
                          </div>
                          <div className="text-xs text-danger-600 mb-1">
                            {formatTime(event.startDate)}
                          </div>
                          <div
                            className={`flex gap-1 ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                          >
                            <Chip
                              color={getEventTypeColor(event.type)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`calendar.type.${event.type}`)}
                            </Chip>
                            <Chip color="danger" size="sm" variant="solid">
                              {t(`calendar.priority.${event.priority}`)}
                            </Chip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollShadow>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && (
        <Modal
          classNames={{
            body: "p-6",
          }}
          isOpen={!!showEventDetails}
          onClose={() => setShowEventDetails(null)}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2">
                {getPriorityIcon(showEventDetails.priority)}
                <span>{showEventDetails.title}</span>
                <Chip
                  color={getEventTypeColor(showEventDetails.type)}
                  size="sm"
                  variant="flat"
                >
                  {t(`calendar.type.${showEventDetails.type}`)}
                </Chip>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {showEventDetails.description && (
                  <div>
                    <h4 className="font-medium mb-2">
                      {t("calendar.description")}
                    </h4>
                    <p className="text-default-600">
                      {showEventDetails.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">
                      {t("calendar.startDate")}
                    </h4>
                    <p className="text-default-600">
                      {formatDate(new Date(showEventDetails.startDate))}
                    </p>
                    <p className="text-sm text-default-500">
                      {formatTime(showEventDetails.startDate)}
                    </p>
                  </div>

                  {showEventDetails.endDate && (
                    <div>
                      <h4 className="font-medium mb-1">
                        {t("calendar.endDate")}
                      </h4>
                      <p className="text-default-600">
                        {formatDate(new Date(showEventDetails.endDate))}
                      </p>
                      <p className="text-sm text-default-500">
                        {formatTime(showEventDetails.endDate)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div>
                    <h4 className="font-medium mb-1">{t("calendar.status")}</h4>
                    <Chip
                      color={getEventStatusColor(showEventDetails.status)}
                      variant="flat"
                    >
                      {t(`calendar.status.${showEventDetails.status}`)}
                    </Chip>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">
                      {t("calendar.priority")}
                    </h4>
                    <Chip
                      color={
                        showEventDetails.priority === "critical"
                          ? "danger"
                          : showEventDetails.priority === "high"
                            ? "warning"
                            : showEventDetails.priority === "medium"
                              ? "primary"
                              : "success"
                      }
                      variant="flat"
                    >
                      {t(`calendar.priority.${showEventDetails.priority}`)}
                    </Chip>
                  </div>
                </div>

                {showEventDetails.location && (
                  <div>
                    <h4 className="font-medium mb-1">
                      {t("calendar.location")}
                    </h4>
                    <p className="text-default-600">
                      {showEventDetails.location}
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onPress={() => setShowEventDetails(null)}>
                {t("common.close")}
              </Button>
              <Button
                color="danger"
                variant="light"
                onPress={() => handleDeleteEvent(showEventDetails.id)}
              >
                {t("common.delete")}
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  openEditModal(showEventDetails);
                  setShowEventDetails(null);
                }}
              >
                {t("calendar.editEvent")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Create/Edit Event Modal */}
      <Modal
        classNames={{
          body: "p-0",
          header: "border-b border-divider px-6 py-4",
          footer: "border-t border-divider px-6 py-4",
        }}
        isOpen={showCreateModal}
        scrollBehavior="inside"
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {editingEvent ? t("calendar.editEvent") : t("calendar.addEvent")}
            </h3>
          </ModalHeader>
          <ModalBody className="px-6 py-6">
            <div className="space-y-6">
              {/* Title and Description Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  isRequired
                  classNames={{
                    label: "text-foreground-600",
                    input: "text-foreground",
                  }}
                  errorMessage={fieldErrors.title}
                  isInvalid={!!fieldErrors.title}
                  label={t("calendar.eventTitle")}
                  placeholder={t("calendar.titlePlaceholder")}
                  value={eventForm.title}
                  onBlur={() => handleFieldBlur("title")}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                />
                <Input
                  classNames={{
                    label: "text-foreground-600",
                    input: "text-foreground",
                  }}
                  label={t("calendar.description")}
                  placeholder={t("calendar.descriptionPlaceholder")}
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  classNames={{
                    label: "text-foreground-600",
                  }}
                  label={t("calendar.type")}
                  selectedKeys={[eventForm.type]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as CalendarEvent["type"];

                    setEventForm({ ...eventForm, type: key });
                  }}
                >
                  <SelectItem key="project">
                    {t("calendar.type.project")}
                  </SelectItem>
                  <SelectItem key="requirement">
                    {t("calendar.type.requirement")}
                  </SelectItem>
                  <SelectItem key="meeting">
                    {t("calendar.type.meeting")}
                  </SelectItem>
                  <SelectItem key="deadline">
                    {t("calendar.type.deadline")}
                  </SelectItem>
                  <SelectItem key="milestone">
                    {t("calendar.type.milestone")}
                  </SelectItem>
                </Select>

                <Select
                  classNames={{
                    label: "text-foreground-600",
                  }}
                  label={t("calendar.priority")}
                  selectedKeys={[eventForm.priority]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(
                      keys,
                    )[0] as CalendarEvent["priority"];

                    setEventForm({ ...eventForm, priority: key });
                  }}
                >
                  <SelectItem key="low">
                    {t("calendar.priority.low")}
                  </SelectItem>
                  <SelectItem key="medium">
                    {t("calendar.priority.medium")}
                  </SelectItem>
                  <SelectItem key="high">
                    {t("calendar.priority.high")}
                  </SelectItem>
                  <SelectItem key="critical">
                    {t("calendar.priority.critical")}
                  </SelectItem>
                </Select>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-3 p-4 bg-content2 rounded-lg">
                <Switch
                  isSelected={eventForm.isAllDay}
                  size="sm"
                  onValueChange={(checked) => {
                    setEventForm({
                      ...eventForm,
                      isAllDay: checked,
                      // Clear time values when switching to all day
                      startTime: checked
                        ? null
                        : eventForm.startTime || new Time(9, 0),
                      endTime: checked
                        ? null
                        : eventForm.endTime || new Time(17, 0),
                    });
                  }}
                />
                <span className="text-sm font-medium">
                  {t("calendar.allDay")}
                </span>
              </div>

              {/* Dates and Times */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Start Date and Time */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground-600 border-b border-divider pb-2">
                    {t("calendar.startDateTime")}
                  </h4>
                  <DatePicker
                    isRequired
                    showMonthAndYearPickers
                    classNames={{
                      label: "text-foreground-600",
                    }}
                    errorMessage={fieldErrors.startDate}
                    isInvalid={!!fieldErrors.startDate}
                    label={t("calendar.startDate")}
                    value={eventForm.startDate}
                    onBlur={() => handleFieldBlur("startDate")}
                    onChange={(date) => handleFieldChange("startDate", date)}
                  />
                  {!eventForm.isAllDay && (
                    <div className="time-input-ltr">
                      <TimeInput
                        isRequired
                        classNames={{
                          label: "text-foreground-600",
                          input: "text-foreground",
                        }}
                        errorMessage={fieldErrors.startTime}
                        isInvalid={!!fieldErrors.startTime}
                        label={t("calendar.startTime")}
                        value={eventForm.startTime}
                        onBlur={() => handleFieldBlur("startTime")}
                        onChange={(time) =>
                          handleFieldChange("startTime", time)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* End Date and Time */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground-600 border-b border-divider pb-2">
                    {t("calendar.endDateTime")}
                  </h4>
                  <DatePicker
                    showMonthAndYearPickers
                    classNames={{
                      label: "text-foreground-600",
                    }}
                    errorMessage={fieldErrors.endDate}
                    isInvalid={!!fieldErrors.endDate}
                    label={t("calendar.endDate")}
                    value={eventForm.endDate}
                    onBlur={() => handleFieldBlur("endDate")}
                    onChange={(date) => handleFieldChange("endDate", date)}
                  />
                  {!eventForm.isAllDay && (
                    <div className="time-input-ltr">
                      <TimeInput
                        classNames={{
                          label: "text-foreground-600",
                          input: "text-foreground",
                        }}
                        errorMessage={fieldErrors.endTime}
                        isInvalid={!!fieldErrors.endTime}
                        label={t("calendar.endTime")}
                        value={eventForm.endTime}
                        onBlur={() => handleFieldBlur("endTime")}
                        onChange={(time) => handleFieldChange("endTime", time)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <Input
                classNames={{
                  label: "text-foreground-600",
                  input: "text-foreground",
                }}
                label={t("calendar.location")}
                placeholder={t("calendar.locationPlaceholder")}
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm({ ...eventForm, location: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              isLoading={loading}
              onPress={handleSaveEvent}
            >
              {editingEvent ? t("common.update") : t("common.create")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CalendarComponent;
