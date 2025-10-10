import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { Alert } from "@heroui/alert";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Textarea } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { addToast } from "@heroui/toast";
import { RefreshCw, Palette, CheckCircle, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDesignRequests } from "@/hooks/useDesignRequests";
import { useTeamSearchByDepartment } from "@/hooks/useTeamSearchByDepartment";
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
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
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

      // Easing function for smooth animation
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
const CustomAlert = React.forwardRef<
  HTMLDivElement,
  {
    title?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    variant?: "faded" | "flat" | "bordered" | "solid";
    color?: "success" | "warning" | "danger" | "default" | "primary" | "secondary";
    className?: string;
    classNames?: Record<string, string>;
    direction?: "ltr" | "rtl";
  }
>(
  (
    {
      title,
      description,
      children,
      variant = "faded",
      color = "danger",
      className,
      classNames = {},
      direction,
      ...props
    },
    ref,
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
        description={description}
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
  const { t, language } = useLanguage();
  const direction = language === "ar" ? "rtl" : "ltr";
  
  // Fetch unassigned design requests (status = 1)
  const {
    designRequests,
    loading,
    error,
    refetch,
    assignDesignRequest,
  } = useDesignRequests({
    status: 1, // Unassigned
    limit: 50,
  });

  // Modal state for assignment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DesignRequestDto | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [selectedDesigner, setSelectedDesigner] = useState<MemberSearchResult | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Search designers from Design Department (ID: 3)
  const {
    employees: designers,
    loading: searchingDesigners,
    searchEmployees: searchDesigners,
  } = useTeamSearchByDepartment({
    departmentId: 3, // Design Department
    minLength: 1,
    maxResults: 100,
    loadInitialResults: true, // Load all designers initially
    initialResultsLimit: 100,
  });

  // Handle refresh
  const refresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle assign button click
  const handleAssign = (request: DesignRequestDto) => {
    setSelectedRequest(request);
    setSelectedDesigner(null);
    setAssignmentNotes("");
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle assignment submission
  const handleAssignSubmit = async () => {
    if (!selectedRequest || !selectedDesigner) {
      setModalError(t("designRequests.designerRequired") || "Designer selection is required");

      return;
    }

    setAssigning(true);
    setModalError(null);

    try {
      // Call the assign API
      const success = await assignDesignRequest(
        selectedRequest.id,
        selectedDesigner.id,
        assignmentNotes || undefined,
      );

      if (success) {
        addToast({
          title: t("designRequests.assignSuccess"),
          color: "success",
        });

        setIsModalOpen(false);
        setSelectedRequest(null);
        setSelectedDesigner(null);
        setAssignmentNotes("");
        
        // Refresh the list
        await refetch();
      } else {
        setModalError(t("designRequests.assignError") || "Failed to assign design request");
      }
    } catch (err) {
      console.error("Error assigning design request:", err);
      setModalError(t("designRequests.assignError") || "Failed to assign design request");
    } finally {
      setAssigning(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full border-default-200" shadow="sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">
              {t("dashboard.myActions") || "My Actions"}
            </h2>
          </div>
        </CardHeader>
        <Divider className="bg-default-200" />
        <CardBody className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </CardBody>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full border-default-200" shadow="sm">
        <CardBody className="p-6">
          <div className="text-center text-danger">
            <p>{t("common.error") || "Error"}: {error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const itemClasses = {
    base: "py-0 w-full",
    title: "font-normal text-medium",
    trigger: "px-2 py-0 rounded-lg h-14 flex items-center cursor-pointer",
    indicator: "text-medium",
    content: "text-small px-2",
  };

  return (
    <>
      <Card className="w-full border-default-200" shadow="sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {t("dashboard.myActions") || "My Actions"}
              </h2>
              {designRequests.length > 0 && (
                <Chip
                  className="bg-danger-50 text-danger-600"
                  size="sm"
                  style={{
                    animation: "fadeInOut 2s ease-in-out infinite",
                  }}
                  variant="flat"
                >
                  <AnimatedCounter value={designRequests.length} />
                </Chip>
              )}
            </div>
            <p className="text-sm text-default-500 mt-1">
              {t("designerDashboard.quickActionsSubtitle") ||
                "Assign design requests that need your attention"}
            </p>
          </div>
          <Button
            isIconOnly
            className="text-default-400 hover:text-default-600"
            disabled={refreshing}
            size="sm"
            variant="light"
            onPress={refresh}
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
              <div className="space-y-4">
                <Accordion 
                  selectionMode="single" 
                  variant="splitted" 
                  fullWidth
                  itemClasses={itemClasses}
                >
                  <AccordionItem
                    key="unassigned-requests"
                    className="border border-default-200 rounded-lg"
            title={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold text-foreground">
                  {language === "ar" ? "مصمم غير معين" : "Unassigned Designer"}
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
            <ScrollShadow
              className="max-h-64"
              hideScrollBar={true}
              size={20}
            >
              <div className="space-y-3 pr-2">
                {designRequests.map((request) => (
                  <CustomAlert
                    key={request.id}
                    description={
                      <div className="space-y-2">
                        {/* Project Name */}
                        {request.requirementDetails?.projectName && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-default-700">
                              {t("common.project") || "Project"}:
                            </span>
                            <span className="text-default-600">
                              {request.requirementDetails.projectName}
                            </span>
                          </div>
                        )}

                        {/* Requirement Name */}
                        {request.requirementDetails?.name && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-default-700">
                              {t("requirements.requirement") || "Requirement"}:
                            </span>
                            <span className="text-default-600">
                              {request.requirementDetails.name}
                            </span>
                          </div>
                        )}

                        {/* Requirement Description */}
                        {request.requirementDetails?.description && (
                          <div className="text-sm text-default-600">
                            <p className="line-clamp-2">
                              {request.requirementDetails.description}
                            </p>
                          </div>
                        )}

                        {/* Task Description */}
                        {request.task?.description && (
                          <div className="text-sm text-default-600 pt-1 border-t border-default-200">
                            <span className="font-medium text-default-700">
                              {t("common.taskDetails") || "Task Details"}:
                            </span>
                            <p className="mt-1 line-clamp-2">
                              {request.task.description}
                            </p>
                          </div>
                        )}
                      </div>
                    }
                    direction={direction}
                    title={request.task?.name || `Task #${request.taskId}`}
                  >
                    <Divider className="bg-default-200 my-3" />
                    <div
                      className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}
                    >
                      <Button
                        className="bg-background text-default-700 font-medium border-1 shadow-small"
                        size="sm"
                        variant="bordered"
                        onPress={() => handleAssign(request)}
                      >
                        <CheckCircle size={16} />
                        {t("designRequests.assignTo") || "Assign Designer"}
                      </Button>
                    </div>
                  </CustomAlert>
                ))}
              </div>
            </ScrollShadow>
          </AccordionItem>
        </Accordion>
              </div>
            )}

            {/* Empty State */}
            {designRequests.length === 0 && (
              <div className="text-center py-8 text-default-400">
                <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {t("designRequests.noUnassigned") || "No unassigned design requests"}
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Assign Modal */}
      <Modal isOpen={isModalOpen} size="2xl" onOpenChange={setIsModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("designRequests.assignTo") || "Assign to Designer"}
              </ModalHeader>
              <ModalBody>
                {selectedRequest && (
                  <div className="space-y-4">

                    {/* Designer Selection */}
                    <div>
                      <Autocomplete
                        label={t("designRequests.selectDesignerForAssignment") || "Select Designer for Assignment"}
                        placeholder={t("tasks.selectDesigner") || "Search for designer..."}
                        defaultSelectedKey={selectedDesigner?.id.toString()}
                        isLoading={searchingDesigners}
                        defaultItems={designers}
                        onSelectionChange={(key) => {
                          if (key) {
                            const designer = designers.find((d) => d.id.toString() === key);
                            if (designer) {
                              setSelectedDesigner(designer);
                              setModalError(null);
                            }
                          } else {
                            setSelectedDesigner(null);
                          }
                        }}
                      >
                        {(designer: MemberSearchResult) => (
                          <AutocompleteItem
                            key={designer.id.toString()}
                            textValue={`${designer.gradeName} ${designer.fullName} ${designer.userName} ${designer.militaryNumber}`}
                            startContent={
                              <Avatar
                                alt={designer.fullName}
                                className="flex-shrink-0"
                                name={designer.fullName}
                                size="sm"
                              />
                            }
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {designer.gradeName} {designer.fullName}
                              </span>
                              <span className="text-xs text-default-500">
                                {designer.militaryNumber}
                              </span>
                            </div>
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                      {modalError && (
                        <p className="text-danger text-sm mt-1">{modalError}</p>
                      )}
                    </div>

                    {/* Assignment Notes */}
                    <div>
                      <Textarea
                        label={t("designRequests.assignmentNotes") || "Assignment Notes"}
                        minRows={3}
                        placeholder={t("designRequests.assignmentNotesPlaceholder") || "Add notes for this assignment (optional)"}
                        value={assignmentNotes}
                        onChange={(e) => setAssignmentNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  {t("cancel") || "Cancel"}
                </Button>
                <Button
                  color="primary"
                  isLoading={assigning}
                  onPress={handleAssignSubmit}
                >
                  {t("designRequests.assign") || "Assign Request"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      <style>
        {`
          @keyframes fadeInOut {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
}