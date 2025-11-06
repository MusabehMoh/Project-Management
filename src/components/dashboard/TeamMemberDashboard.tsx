import type { MemberTask } from "@/types/membersTasks";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { ChevronDown } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

import Calendar from "./calendar";
import TeamKanbanBoard from "./team-member/TeamKanbanBoard";

import TaskDetailsDrawer from "@/components/TaskDetailsDrawer";
import { useLanguage } from "@/contexts/LanguageContext";
import ModernQuickStats from "@/components/dashboard/ModernQuickStats";
import { useTaskStatusLookups } from "@/hooks/useTaskLookups";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { tasksService } from "@/services/api/tasksService";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { isTransitionAllowed } from "@/utils/kanbanRoleConfig";

export default function TeamMemberDashboard() {
  const { t, language } = useLanguage();
  const { user } = useCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState<MemberTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Status management hooks
  const { statusOptions, getStatusLabel } = useTaskStatusLookups();
  const { getPriorityColor, getPriorityLabel } = usePriorityLookups();

  // Change Status Modal state
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{ id: number; label: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState(false);
  const [changeStatusLoading, setChangeStatusLoading] = useState(false);

  // Get filtered status options based on user role
  const filteredStatusOptions = React.useMemo(() => {
    if (!selectedTask || !user?.roles) return statusOptions;

    const currentStatusId = selectedTask.statusId;
    const roleIds = user.roles.map(r => r.id);

    return statusOptions.filter(option => {
      const targetStatusId = parseInt(option.key);
      // Always allow selecting the current status
      if (targetStatusId === currentStatusId) return true;
      // Check if transition is allowed
      return isTransitionAllowed(roleIds, currentStatusId, targetStatusId);
    });
  }, [selectedTask, user?.roles, statusOptions]);

  // Handle task status update from TeamQuickActions only
  // Kanban board handles its own updates internally, no need to refresh
  const handleQuickActionsUpdate = async (
    taskId: number,
    newStatus: string,
  ) => {
    try {
      console.log("Quick Actions updating task:", {
        taskId,
        newStatus,
      });

      // Refresh TeamQuickActions, MyAssignedTasks, MyNextDeadline, and Kanban
      setRefreshKey((prev) => prev + 1);

      console.log(`Successfully updated task ${taskId} to status ${newStatus}`);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Handle Kanban drag-and-drop updates (no refresh needed for other components)
  const handleKanbanUpdate = async (taskId: number, newStatus: string) => {
    console.log("Kanban updating task:", {
      taskId,
      newStatus,
    });
    // Kanban updates its own state optimistically, no need to refresh anything
  };

  // Handle task click from Kanban board to open drawer
  const handleTaskClick = (task: MemberTask) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  // Handle change status button click
  const handleChangeStatus = (task: MemberTask) => {
    if (isDrawerOpen) setIsDrawerOpen(false);
    setSelectedTask(task);
    setSelectedStatus({
      id: task.statusId,
      label: getStatusText(task.statusId),
    });
    setIsChangeStatusModalOpen(true);
    setModalError(false);
    setNotes("");
  };

  // Handle change status submit
  const handleChangeStatusSubmit = async () => {
    if (!selectedTask || !selectedStatus) return;

    const newStatusId = selectedStatus.id;

    setChangeStatusLoading(true);
    setModalError(false);

    try {
      // Use tasksService to update status with audit trail
      const result = await tasksService.updateTaskStatus(
        parseInt(selectedTask.id),
        newStatusId,
        notes || undefined,
        undefined, // progress will be auto-calculated by backend
      );

      if (result.success) {
        showSuccessToast(t("teamDashboard.kanban.statusUpdated"));
        setIsChangeStatusModalOpen(false);
        setNotes("");
        // Refresh the kanban board
        setRefreshKey(prev => prev + 1);
      } else {
        setModalError(true);
        showErrorToast(t("teamDashboard.kanban.statusUpdateFailed"));
      }
    } catch (error) {
      console.error("Error changing status:", error);
      setModalError(true);
      showErrorToast(t("teamDashboard.kanban.statusUpdateFailed"));
    } finally {
      setChangeStatusLoading(false);
    }
  };

  // Helper function to get status color
  const getTaskStatusColor = (
    status: number,
  ): "success" | "primary" | "warning" | "danger" | "default" | "secondary" => {
    switch (status) {
      case 1: // To Do
        return "default";
      case 2: // In Progress
        return "primary";
      case 3: // In Review
        return "warning";
      case 4: // Rework
        return "danger";
      case 5: // Completed
        return "success";
      case 6: // On Hold
        return "secondary";
      default:
        return "default";
    }
  };

  // Helper function to get status text
  const getStatusText = (status: number) => {
    return getStatusLabel(status.toString());
  };

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("teamDashboard.title")}
        </h1>
        <p className="text-lg text-default-600">
          {t("teamDashboard.subtitle")}
        </p>
      </div>

      {/* Quick Stats */}
      <ModernQuickStats />

      {/* Kanban Board - Full Width */}
      <TeamKanbanBoard
        key={refreshKey}
        onTaskClick={handleTaskClick}
        onTaskUpdate={handleKanbanUpdate}
      />

      {/* Quick Actions (50%) and Calendar (50%) */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamQuickActions
          key={refreshKey}
          onTaskUpdate={handleQuickActionsUpdate}
        />
        <Calendar maxHeight="600px" showSidebar={false} />
      </div> */}

      {/* Calendar - Full Width */}
      <Calendar maxHeight="600px" showSidebar={false} />

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        fullRequirement={null}
        getPriorityColor={getPriorityColor}
        getPriorityLabel={getPriorityLabel}
        getStatusText={getStatusText}
        getTaskStatusColor={getTaskStatusColor}
        isOpen={isDrawerOpen}
        loadingRequirement={false}
        selectedTask={selectedTask}
        onChangeAssignees={() => {}}
        onChangeStatus={handleChangeStatus}
        onFileDelete={async () => {}}
        onFileDownload={async () => {}}
        onFilePreview={async () => {}}
        onFileUpload={async () => {}}
        onOpenChange={setIsDrawerOpen}
        onRequestDesign={() => {}}
      />

      {/* Change Status Modal */}
      <Modal
        isOpen={isChangeStatusModalOpen}
        scrollBehavior="inside"
        size="md"
        onOpenChange={setIsChangeStatusModalOpen}
      >
        <ModalContent>
          {(_onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("changeStatus")}
                {modalError && (
                  <p className="text-sm text-danger font-normal">
                    {t("common.unexpectedError")}
                  </p>
                )}
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  {/* Task Name */}
                  <Input readOnly value={selectedTask?.name ?? ""} />

                  {/* Dropdown with TaskStatus */}
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        className="w-full justify-between"
                        endContent={<ChevronDown className="w-4 h-4" />}
                        variant="flat"
                      >
                        {selectedStatus
                          ? selectedStatus.label
                          : t("selectStatus")}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Select task status"
                      onAction={(key) => {
                        const status = filteredStatusOptions?.find(
                          (s) => s.key === key,
                        );

                        if (status)
                          setSelectedStatus({
                            id: parseInt(status.key),
                            label: status.label,
                          });
                      }}
                    >
                      {filteredStatusOptions?.map((status) => (
                        <DropdownItem key={status.key}>
                          {status.label}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>

                  {/* Notes */}
                  <Textarea
                    label={t("timeline.treeView.notes")}
                    placeholder={t("timeline.treeView.notes")}
                    value={notes}
                    onChange={(e: any) => setNotes(e.target.value)}
                  />
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    setIsChangeStatusModalOpen(false);
                    setModalError(false);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={changeStatusLoading}
                  onPress={handleChangeStatusSubmit}
                >
                  {t("confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
