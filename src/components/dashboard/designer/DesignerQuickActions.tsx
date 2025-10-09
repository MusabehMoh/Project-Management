import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Alert } from "@heroui/alert";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Textarea } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { addToast } from "@heroui/toast";
import { RefreshCw, Palette, CheckCircle, Clock, AlertCircle } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDesignRequests } from "@/hooks/useDesignRequests";
import { useTeamSearch } from "@/hooks/useTeamSearch";
import { formatDateTime } from "@/utils/dateFormatter";
import { DesignRequestDto } from "@/services/api/designRequestsService";
import { MemberSearchResult } from "@/types";



// Animated Counter Component
const AnimatedCounter = ({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(
        startValue + (endValue - startValue) * easeOutCubic,
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration, displayValue]);

  return <span className="tabular-nums">{displayValue}</span>;
};

// Custom Alert Component with dynamic color styling
const CustomAlert = React.forwardRef(
  (
    {
      title,
      children,
      variant = "faded",
      color = "danger",
      className,
      classNames = {},
      direction,
      ...props
    }: any,
    ref: any,
  ) => {
    const isRTL = direction === "rtl";

    // Dynamic border color based on the color prop
    const getBorderColor = (color: string) => {
      switch (color) {
        case "success":
          return "before:bg-success";
        case "warning":
          return "before:bg-warning";
        case "danger":
        default:
          return "before:bg-danger";
        case "primary":
          return "before:bg-primary";
      }
    };

    return (
      <Alert
        ref={ref}
        classNames={{
          ...classNames,
          base: [
            "bg-default-50 dark:bg-background shadow-sm",
            "border-1 border-default-200 dark:border-default-100",
            "relative before:content-[''] before:absolute before:z-10",
            isRTL
              ? "before:right-0 before:top-[-1px] before:bottom-[-1px] before:w-1"
              : "before:left-0 before:top-[-1px] before:bottom-[-1px] before:w-1",
            isRTL ? "rounded-r-none border-r-0" : "rounded-l-none border-l-0",
            getBorderColor(color),
            classNames.base,
            className,
          ]
            .filter(Boolean)
            .join(" "),
          mainWrapper: [
            "pt-1 flex items-start justify-between",
            classNames.mainWrapper,
          ]
            .filter(Boolean)
            .join(" "),
          iconWrapper: ["dark:bg-transparent", classNames.iconWrapper]
            .filter(Boolean)
            .join(" "),
          title: [
            isRTL ? "text-right" : "text-left",
            "text-sm font-medium",
            classNames.title,
          ]
            .filter(Boolean)
            .join(" "),
          description: [
            isRTL ? "text-right" : "text-left",
            "text-xs text-default-500 mt-1",
            classNames.description,
          ]
            .filter(Boolean)
            .join(" "),
        }}
        color={color}
        dir={direction}
        title={title}
        variant={variant}
        {...props}
      >
        {children}
      </Alert>
    );
  },
);

CustomAlert.displayName = "CustomAlert";

export default function DesignerQuickActions() {
  const { t, language, direction } = useLanguage();

  // Fetch unassigned design requests (status = 1)
  const {
    designRequests,
    loading,
    error,
    refetch,
    assignDesignRequest,
  } = useDesignRequests({
    status: 1, // Only unassigned requests
    limit: 10,
    includeTaskDetails: true,
    includeRequirementDetails: false,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DesignRequestDto | null>(null);
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Designer selection state
  const [selectedDesigner, setSelectedDesigner] = useState<MemberSearchResult | null>(null);
  const [designerInputValue, setDesignerInputValue] = useState<string>("");

  // Team search for designer selection
  const {
    employees: designers,
    loading: designersLoading,
    searchEmployees: searchDesigners,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAssign = (request: DesignRequestDto) => {
    setSelectedRequest(request);
    setNotes("");
    setModalError(null);
    setSelectedDesigner(null);
    setDesignerInputValue("");
    setIsModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedRequest || !selectedDesigner?.id) {
      setModalError(t("designRequests.designerRequired"));

      return;
    }

    setAssignLoading(true);
    setModalError(null);

    try {
      const success = await assignDesignRequest(
        selectedRequest.id,
        selectedDesigner.id,
        notes,
      );

      if (success) {
        addToast({
          title: t("designRequests.assignSuccess"),
          color: "success",
          timeout: 4000,
        });

        setIsModalOpen(false);
        setSelectedRequest(null);
        setSelectedDesigner(null);
        setDesignerInputValue("");
        setNotes("");
      } else {
        setModalError(t("designRequests.assignError"));
      }
    } catch {
      setModalError(t("designRequests.assignError"));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setSelectedDesigner(null);
    setDesignerInputValue("");
    setNotes("");
    setModalError(null);
  };

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 4:
        return "danger";
      case 3:
        return "warning";
      case 2:
        return "primary";
      case 1:
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityText = (priority?: number) => {
    switch (priority) {
      case 4:
        return t("priority.critical");
      case 3:
        return t("priority.high");
      case 2:
        return t("priority.medium");
      case 1:
        return t("priority.low");
      default:
        return t("priority.unknown");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";

    return formatDateTime(dateString, { language });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48 rounded-lg" />
        </CardHeader>
        <CardBody className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-default-200" dir={direction} shadow="sm">
        <CardBody className="space-y-6 py-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-1/3 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-default-200" dir={direction} shadow="sm">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}
      </style>
      <Card className="border-default-200" dir={direction} shadow="sm">
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-foreground">
                {t("dashboard.myActions")}
              </h3>
              {designRequests.length > 0 && (
                <Chip
                  className="bg-danger-50 text-danger-600 border border-danger-200 animate-pulse"
                  size="sm"
                  style={{
                    animation: "fadeInOut 2s ease-in-out infinite",
                  }}
                  variant="flat"
                >
                  <AnimatedCounter duration={600} value={designRequests.length} />
                </Chip>
              )}
            </div>
            <p className="text-sm text-default-500 mt-1">
              {t("designerDashboard.quickActionsSubtitle")}
            </p>
          </div>
          <Button
            isIconOnly
            className="text-default-400 hover:text-default-600"
            disabled={refreshing}
            size="sm"
            variant="light"
            onPress={handleRefresh}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>

        <Divider className="bg-default-200" />

        <CardBody className="p-6 overflow-hidden">
          <div className="space-y-4 overflow-hidden">
            {/* Unassigned Design Requests Accordion */}
            {designRequests.length > 0 && (
              <Accordion selectionMode="single" variant="splitted">
                <AccordionItem
                  key="unassigned-requests"
                  className="border border-default-200 rounded-lg"
                  title={
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("designRequests.unassigned")}
                      </h3>
                      <Chip
                        className="bg-danger-50 text-danger-600"
                        size="sm"
                        variant="flat"
                      >
                        {designRequests.length}
                      </Chip>
                    </div>
                  }
                >
                  <ScrollShadow className="max-h-[400px]" hideScrollBar>
                    <div className="space-y-3 pt-2">
                      {designRequests.map((request) => (
                        <CustomAlert key={request.id} color="warning" direction={direction}>
                          <div className="space-y-3">
                            {/* Task Name and Priority */}
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-medium text-sm truncate">
                                  {request.task?.name || `Task #${request.taskId}`}
                                </span>
                                {request.task?.priorityId && (
                                  <Chip
                                    color={getPriorityColor(request.task.priorityId)}
                                    size="sm"
                                    variant="flat"
                                  >
                                    {getPriorityText(request.task.priorityId)}
                                  </Chip>
                                )}
                              </div>
                            </div>

                            {/* Task Description */}
                            {request.task?.description && (
                              <div className="text-sm text-default-600">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: request.task.description.substring(0, 150) + (request.task.description.length > 150 ? "..." : ""),
                                  }}
                                />
                              </div>
                            )}

                            {/* Request Date */}
                            <div className="flex items-center gap-2 text-sm text-default-600">
                              <Clock size={16} />
                              <span>
                                {t("designRequests.requestDate")}: {formatDate(request.createdAt)}
                              </span>
                            </div>

                            {/* Due Date */}
                            {request.task?.dueDate && (
                              <div className="flex items-center gap-2 text-sm text-default-600">
                                <Clock size={16} />
                                <span>
                                  {t("common.dueDate")}: {formatDate(request.task.dueDate)}
                                </span>
                              </div>
                            )}

                            {/* Notes */}
                            {request.notes && (
                              <div className="text-sm text-default-600 pt-2 border-t border-default-200">
                                <strong>{t("designRequests.notes")}:</strong>
                                <p className="mt-1">{request.notes}</p>
                              </div>
                            )}

                            {/* Assign Button */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                className="shadow-small"
                                color="primary"
                                size="sm"
                                variant="bordered"
                                onPress={() => handleAssign(request)}
                              >
                                <CheckCircle size={16} />
                                {t("designRequests.assign")}
                              </Button>
                            </div>
                          </div>
                        </CustomAlert>
                      ))}
                    </div>
                  </ScrollShadow>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Assign Modal */}
      <Modal isOpen={isModalOpen} size="2xl" onOpenChange={handleModalClose}>
        <ModalContent>
          <ModalHeader className="text-center">
            {t("designRequests.assignTo")}
          </ModalHeader>

          <ModalBody>
            <div className="space-y-4">
              {/* Task Info */}
              <div className="border border-default-200 rounded-lg p-4 bg-default-50/50 dark:bg-default-100/50">
                <h3 className="text-sm font-semibold text-default-700 mb-2">
                  {t("designRequests.taskName")}
                </h3>
                <p className="text-sm text-default-900">
                  {selectedRequest?.task?.name || `Task #${selectedRequest?.taskId}`}
                </p>
                {selectedRequest?.task?.priorityId && (
                  <div className="mt-2">
                    <Chip
                      color={getPriorityColor(selectedRequest.task.priorityId)}
                      size="sm"
                      variant="flat"
                    >
                      {getPriorityText(selectedRequest.task.priorityId)}
                    </Chip>
                  </div>
                )}
              </div>

              {/* Designer Selection */}
              <div>
                <label className="text-sm font-medium text-default-700 mb-2 block">
                  {t("designRequests.selectDesigner")} *
                </label>
                <Autocomplete
                  defaultFilter={() => true}
                  inputValue={designerInputValue}
                  isLoading={designersLoading}
                  menuTrigger="input"
                  placeholder={t("designRequests.selectDesigner")}
                  selectedKey={selectedDesigner?.id?.toString() || ""}
                  value={
                    selectedDesigner
                      ? `${selectedDesigner.gradeName} ${selectedDesigner.fullName}`
                      : designerInputValue
                  }
                  onInputChange={(value) => {
                    setDesignerInputValue(value);
                    if (selectedDesigner) {
                      const expectedValue = `${selectedDesigner.gradeName} ${selectedDesigner.fullName}`;

                      if (value !== expectedValue) {
                        setSelectedDesigner(null);
                      }
                    }
                    searchDesigners(value);
                  }}
                  onSelectionChange={(key) => {
                    const designer = designers.find(
                      (member) => member.id.toString() === String(key),
                    );

                    setSelectedDesigner(designer || null);
                    if (designer) {
                      setDesignerInputValue(
                        `${designer.gradeName} ${designer.fullName}`,
                      );
                    }
                  }}
                >
                  {designers.map((designer) => (
                    <AutocompleteItem
                      key={designer.id.toString()}
                      textValue={`${designer.gradeName} ${designer.fullName} ${designer.userName} ${designer.militaryNumber}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          alt={designer.fullName}
                          className="flex-shrink-0"
                          name={designer.fullName}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {designer.fullName}
                          </span>
                          <span className="text-xs text-default-500">
                            {designer.militaryNumber} - {designer.gradeName}
                          </span>
                        </div>
                      </div>
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
                {modalError && (
                  <p className="text-danger text-sm mt-1">{modalError}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <Textarea
                  label={t("designRequests.notes")}
                  minRows={3}
                  placeholder={t("designRequests.notes")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button color="default" variant="flat" onPress={handleModalClose}>
              {t("cancel")}
            </Button>
            <Button
              color="primary"
              isDisabled={!selectedDesigner}
              isLoading={assignLoading}
              onPress={handleAssignSubmit}
            >
              {t("designRequests.assign")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
