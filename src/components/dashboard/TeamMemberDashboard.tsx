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
import { membersTasksService } from "@/services/api/membersTasksService";
import { showSuccessToast, showErrorToast, showWarningToast } from "@/utils/toast";
import { isTransitionAllowed } from "@/utils/kanbanRoleConfig";
import { getFileUploadConfig } from "@/config/environment";

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

  // Request Design Modal state
  const [isRequestDesignModalOpen, setIsRequestDesignModalOpen] = useState(false);
  const [isRequestDesignConfirmModalOpen, setIsRequestDesignConfirmModalOpen] = useState(false);
  const [requestDesignLoading, setRequestDesignLoading] = useState(false);

  // Delete Attachment Modal state
  const [isDeleteAttachmentModalOpen, setIsDeleteAttachmentModalOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<any>(null);
  const [deleteAttachmentLoading, setDeleteAttachmentLoading] = useState(false);

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

  // Handle request design button click
  const handleRequestDesign = (task: MemberTask) => {
    if (isDrawerOpen) setIsDrawerOpen(false);
    setSelectedTask(task);
    setIsRequestDesignModalOpen(true);
    setModalError(false);
    setNotes("");
  };

  // Handle request design submit
  const handleRequestDesignSubmit = () => {
    // Close the first modal and open the confirmation modal
    setIsRequestDesignModalOpen(false);
    setIsRequestDesignConfirmModalOpen(true);
  };

  // Handle request design confirm
  const handleRequestDesignConfirm = async () => {
    if (!selectedTask) return;

    setRequestDesignLoading(true);
    setModalError(false);

    try {
      const result = await membersTasksService.requestDesign(
        selectedTask.id,
        notes || "",
      );

      if (result.success) {
        showSuccessToast(t("toast.designRequestedSuccess"));
        setIsRequestDesignConfirmModalOpen(false);
        setNotes("");
        // Refresh the kanban board
        setRefreshKey(prev => prev + 1);
      } else {
        setModalError(true);
        showErrorToast(t("common.error"), result.message || t("common.unexpectedError"));
      }
    } catch (error) {
      console.error("Error requesting design:", error);
      setModalError(true);
      showErrorToast(t("common.error"), t("common.unexpectedError"));
    } finally {
      setRequestDesignLoading(false);
    }
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

  // Handle file upload to task
  const handleTaskFileUpload = async (taskId: number, files: File[]) => {
    const { maxFileSizeMB, allowedFileTypes } = getFileUploadConfig();
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    // Arrays to collect rejected files
    const emptyFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const invalidTypeFiles: string[] = [];

    const validFiles = files.filter((file) => {
      // Check for empty files
      if (file.size === 0) {
        emptyFiles.push(file.name);
        return false;
      }

      // Check file size
      if (file.size > maxFileSizeBytes) {
        oversizedFiles.push(file.name);
        return false;
      }

      // Check file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
        invalidTypeFiles.push(file.name);
        return false;
      }

      return true;
    });

    // Show warnings for rejected files
    if (emptyFiles.length > 0) {
      showWarningToast(
        t("requirements.validation.fileEmptyError"),
        emptyFiles.join(", ")
      );
    }
    if (oversizedFiles.length > 0) {
      showWarningToast(
        t("requirements.validation.filesSizeTooLarge"),
        oversizedFiles.join(", ")
      );
    }
    if (invalidTypeFiles.length > 0) {
      showWarningToast(
        t("requirements.validation.fileTypeNotAllowed")
          .replace("{0}", invalidTypeFiles[0])
          .replace("{1}", allowedFileTypes.join(", ")),
        invalidTypeFiles.join(", ")
      );
    }

    if (validFiles.length === 0) return;

    // Upload valid files
    let uploadedCount = 0;
    for (const file of validFiles) {
      try {
        const result = await membersTasksService.uploadTaskAttachment(taskId, file);
        if (result.success) {
          uploadedCount++;
          showSuccessToast(t("requirements.uploadSuccess"));
        } else {
          showErrorToast(t("requirements.uploadError"));
        }
      } catch (error) {
        console.error("Upload failed:", error);
        showErrorToast(t("requirements.uploadError"));
      }
    }

    // Refresh drawer if any files were uploaded successfully
    if (uploadedCount > 0) {
      const currentTask = selectedTask;
      setIsDrawerOpen(false);
      setTimeout(() => {
        setSelectedTask(currentTask);
        setIsDrawerOpen(true);
      }, 100);
    }
  };

  // Handle file delete
  const handleTaskFileDelete = async (attachment: any) => {
    setAttachmentToDelete(attachment);
    setIsDeleteAttachmentModalOpen(true);
  };

  // Confirm delete attachment
  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    setDeleteAttachmentLoading(true);
    try {
      const result = await membersTasksService.deleteTaskAttachment(attachmentToDelete.id);
      if (result.success) {
        showSuccessToast(t("taskDetails.attachmentDeleted"));
        setIsDeleteAttachmentModalOpen(false);
        setAttachmentToDelete(null);
        // Close and reopen drawer to trigger refetch of attachments
        const currentTask = selectedTask;
        setIsDrawerOpen(false);
        setTimeout(() => {
          setSelectedTask(currentTask);
          setIsDrawerOpen(true);
        }, 100);
      } else {
        showErrorToast(t("taskDetails.deleteAttachmentError"));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      showErrorToast(t("taskDetails.deleteAttachmentError"));
    } finally {
      setDeleteAttachmentLoading(false);
    }
  };

  // Handle file download
  const handleTaskFileDownload = async (attachment: any) => {
    try {
      const blob = await membersTasksService.downloadTaskAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      showErrorToast(t("taskDetails.downloadAttachmentError"));
    }
  };

  // Handle file preview - For now, download the file instead
  // TODO: Implement proper preview modal like in members-tasks page
  const handleTaskFilePreview = async (attachment: any) => {
    try {
      await handleTaskFileDownload(attachment);
    } catch (error) {
      console.error("Preview failed:", error);
      showErrorToast(t("taskDetails.previewAttachmentError"));
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
        onFileDelete={handleTaskFileDelete}
        onFileDownload={handleTaskFileDownload}
        onFilePreview={handleTaskFilePreview}
        onFileUpload={handleTaskFileUpload}
        onOpenChange={setIsDrawerOpen}
        onRequestDesign={handleRequestDesign}
      />

      {/* Request Design Modal */}
      <Modal
        isOpen={isRequestDesignModalOpen}
        scrollBehavior="inside"
        size="md"
        onOpenChange={setIsRequestDesignModalOpen}
      >
        <ModalContent>
          {(_onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("requestDesign")}
                {modalError && (
                  <p className="text-sm text-danger font-normal">
                    {t("common.unexpectedError")}
                  </p>
                )}
              </ModalHeader>

              <ModalBody>
                <Input
                  readOnly
                  label={t("tasks.taskName")}
                  value={selectedTask?.name ?? ""}
                />

                <Textarea
                  label={t("timeline.treeView.notes")}
                  placeholder={t("timeline.treeView.notes")}
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                />
              </ModalBody>

              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => setIsRequestDesignModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button color="primary" onPress={handleRequestDesignSubmit}>
                  {t("confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Request Design Confirmation Modal */}
      <Modal
        isOpen={isRequestDesignConfirmModalOpen}
        scrollBehavior="inside"
        size="md"
        onOpenChange={setIsRequestDesignConfirmModalOpen}
      >
        <ModalContent>
          {(_onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("requestDesign")} - {t("confirm")}
                {modalError && (
                  <p className="text-sm text-danger font-normal">
                    {t("common.unexpectedError")}
                  </p>
                )}
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  <div className="p-3 bg-warning-50 dark:bg-warning-100/10 border border-warning-200 rounded-lg">
                    <p className="text-sm text-warning-700 dark:text-warning-600">
                      {t("requestDesignConfirmation")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {t("tasks.taskName")}:
                    </p>
                    <p className="text-sm text-default-600">
                      {selectedTask?.name || ""}
                    </p>
                  </div>

                  {notes && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t("timeline.treeView.notes")}:
                      </p>
                      <p className="text-sm text-default-600">{notes}</p>
                    </div>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => setIsRequestDesignConfirmModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={requestDesignLoading}
                  onPress={handleRequestDesignConfirm}
                >
                  {t("confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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

      {/* Delete Attachment Confirmation Modal */}
      <Modal
        isOpen={isDeleteAttachmentModalOpen}
        size="md"
        onOpenChange={setIsDeleteAttachmentModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("taskDetails.confirmDeleteAttachment").replace(
                  "{fileName}",
                  attachmentToDelete?.originalName || ""
                )}
              </ModalHeader>

              <ModalBody>
                <p className="text-default-600">
                  {t("taskDetails.deleteAttachmentMessage")}
                </p>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={onClose}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={deleteAttachmentLoading}
                  onPress={confirmDeleteAttachment}
                >
                  {t("taskDetails.deleteAttachment")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
