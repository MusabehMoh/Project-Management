import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker, TimeInput } from "@heroui/react";
import { Switch } from "@heroui/switch";
import { 
  parseDate, 
  Time,
  CalendarDate
} from "@internationalized/date";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  RefreshCw
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCalendar } from "@/hooks/useCalendar";
import type { CalendarEvent } from "@/services/api/calendarService";

interface CalendarComponentProps {
  showSidebar?: boolean;
  maxHeight?: string;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ 
  showSidebar = true, 
  maxHeight = "600px" 
}) => {
  const { t } = useLanguage();
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
  const [showEventDetails, setShowEventDetails] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateField = (field: string, value: any) => {
    const errors: Record<string, string> = {};

    switch (field) {
      case 'title':
        if (!value.trim()) {
          errors.title = t("calendar.validation.titleRequired");
        } else if (value.trim().length < 3) {
          errors.title = t("calendar.validation.titleTooShort");
        }
        break;
      case 'startDate':
        if (!value) {
          errors.startDate = t("calendar.validation.startDateRequired");
        }
        break;
      case 'startTime':
        if (!eventForm.isAllDay && !value) {
          errors.startTime = t("calendar.validation.startTimeRequired");
        }
        break;
      case 'endDate':
        if (value && eventForm.startDate && value.compare(eventForm.startDate) < 0) {
          errors.endDate = t("calendar.validation.endDateBeforeStart");
        }
        break;
      case 'endTime':
        if (!eventForm.isAllDay && value && eventForm.startTime && 
            eventForm.endDate && eventForm.startDate &&
            eventForm.endDate.compare(eventForm.startDate) === 0 && 
            value.compare(eventForm.startTime) <= 0) {
          errors.endTime = t("calendar.validation.endTimeBeforeStart");
        }
        break;
    }

    setFieldErrors(prev => ({ ...prev, [field]: errors[field] || '' }));
    return !errors[field];
  };

  const handleFieldChange = (field: string, value: any) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if field has been touched
    if (touchedFields[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateField(field, eventForm[field as keyof typeof eventForm]);
  };
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: null as CalendarDate | null,
    startTime: null as Time | null,
    endDate: null as CalendarDate | null,
    endTime: null as Time | null,
    type: "meeting" as CalendarEvent['type'],
    priority: "medium" as CalendarEvent['priority'],
    location: "",
    isAllDay: false,
  });

  // Get color for event type
  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'project': return 'primary';
      case 'requirement': return 'secondary';
      case 'meeting': return 'success';
      case 'deadline': return 'danger';
      case 'milestone': return 'warning';
      default: return 'default';
    }
  };

  // Get color for event status
  const getEventStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      case 'overdue': return 'danger';
      default: return 'default';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-3 h-3 text-danger" />;
      case 'high': return <AlertTriangle className="w-3 h-3 text-warning" />;
      case 'medium': return <Clock className="w-3 h-3 text-primary" />;
      case 'low': return <CheckCircle className="w-3 h-3 text-success" />;
      default: return null;
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
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
        const dayEvents = getEventsForDate(current);
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
    }    // Create ISO date strings
    const createISOString = (date: CalendarDate, time?: Time | null, isAllDay?: boolean) => {
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
      eventForm.isAllDay
    );
    const endDateTime = eventForm.endDate
      ? createISOString(
          eventForm.endDate, 
          eventForm.endTime, 
          eventForm.isAllDay
        )
      : (eventForm.isAllDay
          ? `${eventForm.startDate!.toString()}T23:59:59.999Z`
          : eventForm.startTime 
            ? `${eventForm.startDate!.toString()}T${eventForm.startTime.add({hours: 1}).toString()}:00.000Z`
            : `${eventForm.startDate!.toString()}T01:00:00.000Z`);    const eventData = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim(),
      startDate: startDateTime,
      endDate: endDateTime,
      type: eventForm.type,
      status: "upcoming" as CalendarEvent['status'],
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
          <Button color="primary" onPress={() => { clearError(); refreshCalendar(); }}>
            {t("common.retry")}
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex gap-4" style={{ maxHeight }}>
      {/* Main Calendar */}
      <Card className={`${showSidebar ? 'flex-1' : 'w-full'}`}>
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              <h3 className="text-lg font-semibold">{t("calendar.title")}</h3>
            </div>
            
            {/* View Mode Selector */}
            <div className="flex gap-1">
              {(['month', 'week', 'day'] as const).map((mode) => (
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
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={refreshCalendar}
              isLoading={loading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* Filter Button */}
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>

            {/* Add Event Button */}
            <Button
              size="sm"
              color="primary"
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
            {/* Calendar Header with Navigation */}
            <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              isIconOnly
              onPress={goToPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {formatDate(selectedDate)}
              </h2>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={goToToday}
              >
                {t("calendar.today")}
              </Button>
              <Button
                variant="ghost"
                isIconOnly
                onPress={goToNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid (Month View) */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-default-600">
                  {t(`calendar.${day.toLowerCase()}`)}
                </div>
              ))}

              {/* Calendar Days */}
              {generateCalendarGrid().map((week, weekIndex) => (
                week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      min-h-[80px] p-1 border border-default-200 rounded-lg
                      ${day.isCurrentMonth ? 'bg-content1' : 'bg-default-50'}
                      ${day.isToday ? 'bg-primary-50 border-primary-200' : ''}
                      hover:bg-default-100 cursor-pointer transition-colors
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      day.isCurrentMonth ? 'text-foreground' : 'text-default-400'
                    } ${day.isToday ? 'text-primary-600' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Day Events */}
                    <div className="space-y-1">
                      {day.events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: `var(--heroui-colors-${getEventTypeColor(event.type)}-100)` }}
                          onClick={() => setShowEventDetails(event)}
                        >
                          <div className="truncate font-medium">
                            {event.title}
                          </div>
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-default-500 text-center">
                          +{day.events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ))}
            </div>
          )}

          {/* Week/Day View - Event List */}
          {(viewMode === 'week' || viewMode === 'day') && (
            <ScrollShadow className="max-h-96" hideScrollBar>
              <div className="space-y-2">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-default-500">
                    {t("calendar.noEvents")}
                  </div>
                ) : (
                  events.map(event => (
                    <Card
                      key={event.id}
                      className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                      isPressable
                      onPress={() => setShowEventDetails(event)}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getPriorityIcon(event.priority)}
                            <h4 className="font-medium">{event.title}</h4>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={getEventTypeColor(event.type)}
                            >
                              {t(`calendar.type.${event.type}`)}
                            </Chip>
                          </div>
                          
                          <div className="text-sm text-default-600 mb-2">
                            {formatTime(event.startDate)}
                            {event.endDate && ` - ${formatTime(event.endDate)}`}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-default-500 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        
                        <Chip
                          size="sm"
                          variant="dot"
                          color={getEventStatusColor(event.status)}
                        >
                          {t(`calendar.status.${event.status}`)}
                        </Chip>
                      </div>
                    </Card>
                  ))
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
                <h3 className="text-lg font-semibold">{t("calendar.overview")}</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{stats.upcomingEvents}</div>
                    <div className="text-xs text-default-600">{t("calendar.upcoming")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-danger">{stats.overdueEvents}</div>
                    <div className="text-xs text-default-600">{t("calendar.overdue")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">{stats.completedThisWeek}</div>
                    <div className="text-xs text-default-600">{t("calendar.completedWeek")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-warning">{stats.criticalDeadlines}</div>
                    <div className="text-xs text-default-600">{t("calendar.critical")}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">{t("calendar.upcomingEvents")}</h3>
            </CardHeader>
            <CardBody>
              <ScrollShadow className="max-h-60" hideScrollBar>
                <div className="space-y-2">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-4 text-default-500">
                      {t("calendar.noUpcoming")}
                    </div>
                  ) : (
                    upcomingEvents.map(event => (
                      <div
                        key={event.id}
                        className="p-2 border border-default-200 rounded-lg hover:bg-default-50 cursor-pointer"
                        onClick={() => setShowEventDetails(event)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityIcon(event.priority)}
                          <span className="font-medium text-sm">{event.title}</span>
                        </div>
                        <div className="text-xs text-default-600">
                          {formatTime(event.startDate)}
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getEventTypeColor(event.type)}
                          className="mt-1"
                        >
                          {t(`calendar.type.${event.type}`)}
                        </Chip>
                      </div>
                    ))
                  )}
                </div>
              </ScrollShadow>
            </CardBody>
          </Card>

          {/* Overdue Events */}
          {overdueEvents.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-danger">{t("calendar.overdueEvents")}</h3>
              </CardHeader>
              <CardBody>
                <ScrollShadow className="max-h-40" hideScrollBar>
                  <div className="space-y-2">
                    {overdueEvents.map(event => (
                      <div
                        key={event.id}
                        className="p-2 border border-danger-200 bg-danger-50 rounded-lg hover:bg-danger-100 cursor-pointer"
                        onClick={() => setShowEventDetails(event)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3 h-3 text-danger" />
                          <span className="font-medium text-sm">{event.title}</span>
                        </div>
                        <div className="text-xs text-danger-600">
                          {formatTime(event.startDate)}
                        </div>
                      </div>
                    ))}
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
          isOpen={!!showEventDetails}
          onClose={() => setShowEventDetails(null)}
          classNames={{
            body: "p-6"
          }}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2">
                {getPriorityIcon(showEventDetails.priority)}
                <span>{showEventDetails.title}</span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={getEventTypeColor(showEventDetails.type)}
                >
                  {t(`calendar.type.${showEventDetails.type}`)}
                </Chip>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {showEventDetails.description && (
                  <div>
                    <h4 className="font-medium mb-2">{t("calendar.description")}</h4>
                    <p className="text-default-600">{showEventDetails.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">{t("calendar.startDate")}</h4>
                    <p className="text-default-600">{formatDate(new Date(showEventDetails.startDate))}</p>
                    <p className="text-sm text-default-500">{formatTime(showEventDetails.startDate)}</p>
                  </div>
                  
                  {showEventDetails.endDate && (
                    <div>
                      <h4 className="font-medium mb-1">{t("calendar.endDate")}</h4>
                      <p className="text-default-600">{formatDate(new Date(showEventDetails.endDate))}</p>
                      <p className="text-sm text-default-500">{formatTime(showEventDetails.endDate)}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <div>
                    <h4 className="font-medium mb-1">{t("calendar.status")}</h4>
                    <Chip
                      variant="flat"
                      color={getEventStatusColor(showEventDetails.status)}
                    >
                      {t(`calendar.status.${showEventDetails.status}`)}
                    </Chip>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">{t("calendar.priority")}</h4>
                    <Chip variant="flat" color={
                      showEventDetails.priority === 'critical' ? 'danger' :
                      showEventDetails.priority === 'high' ? 'warning' :
                      showEventDetails.priority === 'medium' ? 'primary' : 'success'
                    }>
                      {t(`calendar.priority.${showEventDetails.priority}`)}
                    </Chip>
                  </div>
                </div>
                
                {showEventDetails.location && (
                  <div>
                    <h4 className="font-medium mb-1">{t("calendar.location")}</h4>
                    <p className="text-default-600">{showEventDetails.location}</p>
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
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        scrollBehavior="inside"
        classNames={{
          body: "p-0",
          header: "border-b border-divider px-6 py-4",
          footer: "border-t border-divider px-6 py-4"
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
                  label={t("calendar.eventTitle")}
                  placeholder={t("calendar.titlePlaceholder")}
                  value={eventForm.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => handleFieldBlur('title')}
                  isRequired
                  isInvalid={!!fieldErrors.title}
                  errorMessage={fieldErrors.title}
                  classNames={{
                    label: "text-foreground-600",
                    input: "text-foreground"
                  }}
                />
                <Input
                  label={t("calendar.description")}
                  placeholder={t("calendar.descriptionPlaceholder")}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  classNames={{
                    label: "text-foreground-600",
                    input: "text-foreground"
                  }}
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("calendar.type")}
                  selectedKeys={[eventForm.type]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as CalendarEvent['type'];
                    setEventForm({...eventForm, type: key});
                  }}
                  classNames={{
                    label: "text-foreground-600"
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
                  label={t("calendar.priority")}
                  selectedKeys={[eventForm.priority]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as CalendarEvent['priority'];
                    setEventForm({...eventForm, priority: key});
                  }}
                  classNames={{
                    label: "text-foreground-600"
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
                  onValueChange={(checked) => {
                    setEventForm({
                      ...eventForm, 
                      isAllDay: checked,
                      // Clear time values when switching to all day
                      startTime: checked ? null : eventForm.startTime || new Time(9, 0),
                      endTime: checked ? null : eventForm.endTime || new Time(17, 0)
                    });
                  }}
                  size="sm"
                />
                <span className="text-sm font-medium">{t("calendar.allDay")}</span>
              </div>

              {/* Dates and Times */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Start Date and Time */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground-600 border-b border-divider pb-2">
                    {t("calendar.startDateTime")}
                  </h4>
                  <DatePicker
                    label={t("calendar.startDate")}
                    value={eventForm.startDate}
                    onChange={(date) => handleFieldChange('startDate', date)}
                    onBlur={() => handleFieldBlur('startDate')}
                    isRequired
                    isInvalid={!!fieldErrors.startDate}
                    errorMessage={fieldErrors.startDate}
                    showMonthAndYearPickers
                    classNames={{
                      label: "text-foreground-600"
                    }}
                  />
                  {!eventForm.isAllDay && (
                    <div className="time-input-ltr">
                      <TimeInput
                        label={t("calendar.startTime")}
                        value={eventForm.startTime}
                        onChange={(time) => handleFieldChange('startTime', time)}
                        onBlur={() => handleFieldBlur('startTime')}
                        isRequired
                        isInvalid={!!fieldErrors.startTime}
                        errorMessage={fieldErrors.startTime}
                        classNames={{
                          label: "text-foreground-600",
                          input: "text-foreground"
                        }}
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
                    label={t("calendar.endDate")}
                    value={eventForm.endDate}
                    onChange={(date) => handleFieldChange('endDate', date)}
                    onBlur={() => handleFieldBlur('endDate')}
                    isInvalid={!!fieldErrors.endDate}
                    errorMessage={fieldErrors.endDate}
                    showMonthAndYearPickers
                    classNames={{
                      label: "text-foreground-600"
                    }}
                  />
                  {!eventForm.isAllDay && (
                    <div className="time-input-ltr">
                      <TimeInput
                        label={t("calendar.endTime")}
                        value={eventForm.endTime}
                        onChange={(time) => handleFieldChange('endTime', time)}
                        onBlur={() => handleFieldBlur('endTime')}
                        isInvalid={!!fieldErrors.endTime}
                        errorMessage={fieldErrors.endTime}
                        classNames={{
                          label: "text-foreground-600",
                          input: "text-foreground"
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <Input
                label={t("calendar.location")}
                placeholder={t("calendar.locationPlaceholder")}
                value={eventForm.location}
                onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                classNames={{
                  label: "text-foreground-600",
                  input: "text-foreground"
                }}
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
              onPress={handleSaveEvent}
              isLoading={loading}
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
