import type { MemberTask } from "@/types/membersTasks";
import type {
  ProjectRequirement,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/react";
import { Tabs, Tab } from "@heroui/tabs";
import { Textarea } from "@heroui/input";
import {
  Calendar,
  Paperclip,
  Eye,
  Download,
  CheckCircle,
  MessageSquare,
  History,
  Send,
  Upload,
  Trash2,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTaskActivity } from "@/hooks/useTaskActivity";
import { TASK_STATUSES } from "@/constants/taskStatuses";
import { membersTasksService } from "@/services/api/membersTasksService";
import { formatRelativeTime, formatDateTime } from "@/utils/dateFormatter";
import { projectRequirementsService } from "@/services/api";

interface TaskDetailsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTask: MemberTask | null;
  fullRequirement: ProjectRequirement | null;
  loadingRequirement: boolean;
  onFilePreview: (attachment: any) => void;
  onFileDownload: (attachment: any) => void;
  onFileDelete: (attachment: any) => Promise<void>;
  onFileUpload: (taskId: number, files: File[]) => Promise<void>;
  onChangeAssignees: (task: MemberTask) => void;
  onChangeStatus: (task: MemberTask) => void;
  onRequestDesign: (task: MemberTask) => void;
  getTaskStatusColor: (
    status: number,
  ) => "success" | "primary" | "warning" | "danger" | "default" | "secondary";
  getStatusText: (status: number) => string;
  getPriorityColor: (
    priorityId: number,
  ) => "success" | "primary" | "warning" | "danger" | "default" | "secondary";
  getPriorityLabel: (priorityId: number) => string | undefined;
}

export default function TaskDetailsDrawer({
  isOpen,
  onOpenChange,
  selectedTask,
  fullRequirement,
  loadingRequirement,
  onFilePreview,
  onFileDownload,
  onFileDelete,
  onFileUpload,
  onChangeAssignees,
  onChangeStatus,
  onRequestDesign,
  getTaskStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
}: TaskDetailsDrawerProps) {
  const { t, language } = useLanguage();
  const { hasAnyRoleById } = usePermissions();

  const {
    comments,
    history,
    attachments,
    loading: activityLoading,
    refetch: refetchActivity,
  } = useTaskActivity({
    taskId: selectedTask?.id ? parseInt(selectedTask.id) : undefined,
    enabled: isOpen && !!selectedTask,
  });

  // Comment input state
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // File upload state
  const [hasFileUploadError, setHasFileUploadError] = useState<boolean>(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Function to translate field names
  const translateFieldName = (fieldName: string): string => {
    const fieldNameLower = fieldName.toLowerCase();

    // Map common field names to translation keys
    const fieldTranslations: Record<string, string> = {
      progress: "common.progress",
      statusid: "common.status",
      status: "common.status",
      priority: "dashboard.priority",
      priorityid: "dashboard.priority",
      assignee: "common.assignee",
      duedate: "common.dueDate",
      startdate: "tasks.startDate",
      enddate: "tasks.endDate",
      description: "calendar.description",
      name: "common.name",
      title: "calendar.eventTitle",
    };

    // Return translated field name if available, otherwise return original
    const translationKey = fieldTranslations[fieldNameLower];

    return translationKey ? t(translationKey) : fieldName;
  };

  // Function to translate status values
  const translateStatusValue = (value: string): string => {
    if (!value) return value;

    // Normalize the value by removing spaces and converting to lowercase
    const valueLower = value.toLowerCase().replace(/\s+/g, "");

    // Map status values to translation keys (handle various formats)
    const statusTranslations: Record<string, string> = {
      todo: "status.todo",
      "to-do": "status.todo",
      toDo: "status.todo",
      inprogress: "teamDashboard.status.inProgress",
      "in-progress": "teamDashboard.status.inProgress",
      inProgress: "status.inProgress",
      inreview: "teamDashboard.status.inReview",
      "in-review": "teamDashboard.status.inReview",
      inReview: "teamDashboard.status.inReview",
      rework: "teamDashboard.status.rework",
      completed: "status.completed",
      blocked: "status.blocked",
      onhold: "status.blocked", // Map "On Hold" to blocked
      "on-hold": "status.blocked",
      onHold: "status.blocked",
    };

    // Return translated status if available, otherwise return original
    const translationKey = statusTranslations[valueLower];

    return translationKey ? t(translationKey) : value;
  };

  // Handle file preview with attachment data
  const handleFilePreview = async (
    attachment: ProjectRequirementAttachment,
  ) => {
    if (!fullRequirement) return;

    try {
      const blob = await projectRequirementsService.downloadAttachment(
        fullRequirement.id,
        attachment.id,
      );
      const previewUrl = window.URL.createObjectURL(blob);

      // Open in new tab for preview instead of downloading
      window.open(previewUrl, "_blank");

      // Clean up the URL after a delay to allow the tab to load
      setTimeout(() => {
        window.URL.revokeObjectURL(previewUrl);
      }, 1000);
    } catch {
      // Error handled silently for now
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedTask) return;

    setUploadingFiles(true);
    setHasFileUploadError(false);

    try {
      const filesArray = Array.from(files);
      const taskId = parseInt(selectedTask.id);

      await onFileUpload(taskId, filesArray);
      refetchActivity(); // Refresh attachments after upload
    } catch {
      setHasFileUploadError(true);
      setTimeout(() => setHasFileUploadError(false), 4000);
    } finally {
      setUploadingFiles(false);
    }
  };

  const isTeamManager = hasAnyRoleById([
    2, // ANALYST_DEPARTMENT_MANAGER
    4, // DEVELOPMENT_MANAGER
    6, // QUALITY_CONTROL_MANAGER
    8, // DESIGNER_MANAGER
    1, // ADMINISTRATOR
  ]);

  const isQCManager = hasAnyRoleById([6]); // QUALITY_CONTROL_MANAGER

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

    setSubmittingComment(true);
    try {
      const taskId = parseInt(selectedTask.id);
      const response = await membersTasksService.addTaskComment(
        taskId,
        newComment.trim(),
      );

      if (response.success) {
        setNewComment("");
        refetchActivity();
      }
    } catch {
      // Error handled silently for now
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement={language === "en" ? "left" : "right"}
      size="xl"
      onOpenChange={onOpenChange}
    >
      <DrawerContent
        className={`min-h-[400px] transition-all duration-200 hover:shadow-lg bg-content1 ${
          selectedTask?.isOverdue
            ? "border-l-4 border-l-danger-500"
            : `border-l-4 border-l-${getTaskStatusColor(selectedTask?.statusId || 1)}-500`
        }`}
      >
        <DrawerHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{selectedTask?.name}</h2>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedTask?.department?.color }}
            />
            <span className="text-sm text-foreground-600">
              {selectedTask?.department?.name}
            </span>
            {selectedTask?.isOverdue && (
              <Badge color="danger" size="sm" variant="flat">
                {t("overdueTask")}
              </Badge>
            )}
          </div>
        </DrawerHeader>
        <DrawerBody>
          {selectedTask && (
            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="flex justify-between gap-8">
                {/* Column 1: Priority */}
                <div className="flex flex-col items-start gap-1">
                  <h4 className="text-md">{t("priority")}</h4>
                  <Chip
                    color={getPriorityColor(selectedTask.priorityId)}
                    size="sm"
                    variant="solid"
                  >
                    {getPriorityLabel(selectedTask.priorityId) || ""}
                  </Chip>
                </div>

                {/* Column 2: Status */}
                <div className="flex flex-col items-start gap-1">
                  <h4 className="text-md">{t("status")}</h4>
                  <Chip
                    color={getTaskStatusColor(selectedTask.statusId)}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusText(selectedTask.statusId)}
                  </Chip>
                </div>
              </div>

              {/* Completed by Developer Flag */}
              {selectedTask.completedFromDeveloper && (
                <div
                  className={`flex items-center ${language === "ar" ? "justify-start" : "justify-start"}`}
                >
                  <Chip
                    color="primary"
                    size="sm"
                    startContent={<CheckCircle className="w-3 h-3" />}
                    variant="flat"
                  >
                    {t("completedByDeveloper")}
                  </Chip>
                </div>
              )}

              {/* Assigned Members */}
              {selectedTask?.assignedMembers &&
                selectedTask.assignedMembers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-md font-medium">
                      {t("timeline.assignedMembers")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.assignedMembers.map((assignee) => (
                        <Chip key={assignee.id} color="primary" variant="flat">
                          {assignee.gradeName} {assignee.fullName}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

              {/* Assigned Designer */}
              {selectedTask?.assignedDesigner && (
                <div className="space-y-2">
                  <h4 className="text-md font-medium">
                    {t("tasks.assignedDesigner")}
                  </h4>
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="flex-shrink-0"
                      name={selectedTask.assignedDesigner.fullName}
                      size="sm"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">
                        {selectedTask.assignedDesigner.gradeName}{" "}
                        {selectedTask.assignedDesigner.fullName}
                      </span>
                      <span className="text-xs text-default-500">
                        {selectedTask.assignedDesigner.militaryNumber}
                      </span>
                      {/* Designer Task Status */}
                      {selectedTask.designerTaskStatus && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-default-600">
                            {t("tasks.designerTaskStatus")}:
                          </span>
                          <Chip
                            color={getTaskStatusColor(
                              selectedTask.designerTaskStatus,
                            )}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(selectedTask.designerTaskStatus)}
                          </Chip>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start">
                {/* Start Date */}
                <div>
                  <h3 className="text-md mb-2">{t("startDate")}</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-default-400" />
                    <span className="text-sm">
                      {formatDateTime(selectedTask.startDate, {
                        showTime: false,
                        language: "en-US",
                      })}
                    </span>
                  </div>
                </div>

                {/* Expected Completion Date */}
                <div>
                  <h3 className="text-md mb-2">
                    {t("requirements.expectedCompletion")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-default-400" />
                    <span className="text-sm">
                      {formatDateTime(selectedTask.endDate, {
                        showTime: false,
                        language: "en-US",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* project & requirement */}
              <div className="mt-3 pt-3 pb-3 border-t border-b border-divider">
                <div className="flex flex-col gap-4">
                  {/* Project */}
                  <div className="flex flex-col gap-1">
                    <span className="font-md">{t("project")}</span>
                    <span className="font-md">
                      {selectedTask.project?.applicationName ||
                        t("tasks.noAssociatedProject")}
                    </span>
                  </div>

                  {/* Requirement */}
                  <div className="flex flex-col gap-1">
                    <span className="font-md">{t("requirement")}</span>
                    <span className="font-md">
                      {selectedTask.requirement?.name || t("common.none")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement Description and Files */}
              {fullRequirement && (
                <>
                  {/* Requirement Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("requirements.requirementDescription")}
                    </h3>
                    <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                      <p
                        dangerouslySetInnerHTML={{
                          __html:
                            fullRequirement.description ||
                            t("requirements.noDescription"),
                        }}
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Requirement Attachments */}
                  {fullRequirement.attachments &&
                    fullRequirement.attachments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-default-400" />
                          {t("requirements.attachments")} (
                          {fullRequirement.attachments.length})
                        </h3>
                        <div className="space-y-2">
                          {fullRequirement.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/10 rounded-lg hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Paperclip className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {attachment.originalName}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-default-500 mt-1">
                                    <span>
                                      {(
                                        (attachment.fileSize || 0) /
                                        1024 /
                                        1024
                                      ).toFixed(2)}{" "}
                                      MB
                                    </span>
                                    {attachment.uploadedAt && (
                                      <span>
                                        {t("requirements.uploadedOn")}:{" "}
                                        {formatDateTime(attachment.uploadedAt, {
                                          showTime: false,
                                          language: "en-US",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                {/* Preview Button for supported file types */}
                                {(attachment.originalName
                                  .toLowerCase()
                                  .endsWith(".pdf") ||
                                  attachment.originalName
                                    .toLowerCase()
                                    .match(
                                      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/,
                                    )) && (
                                  <Button
                                    color="default"
                                    size="sm"
                                    startContent={<Eye className="w-4 h-4" />}
                                    variant="light"
                                    onPress={() =>
                                      handleFilePreview(attachment)
                                    }
                                  >
                                    {t("common.preview")}
                                  </Button>
                                )}
                                <Button
                                  color="primary"
                                  size="sm"
                                  startContent={
                                    <Download className="w-4 h-4" />
                                  }
                                  variant="light"
                                  onPress={async () => {
                                    try {
                                      const blob =
                                        await projectRequirementsService.downloadAttachment(
                                          parseInt(
                                            selectedTask.requirement?.id,
                                          ),
                                          attachment.id,
                                        );
                                      const url =
                                        window.URL.createObjectURL(blob);
                                      const a = document.createElement("a");

                                      a.href = url;
                                      a.download = attachment.originalName;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                    } catch {
                                      // Handle download error silently
                                    }
                                  }}
                                >
                                  {t("common.download")}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}

              {/* Loading state for requirement details */}
              {loadingRequirement && (
                <div className="text-center py-4">
                  <p className="text-sm text-default-500">
                    {t("requirements.loadingDetails")}
                  </p>
                </div>
              )}

              {/* Activity Section */}
              <div className="mt-6 pt-4 border-t border-divider">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {t("taskDetails.activity")}
                </h3>

                <Tabs
                  aria-label={t("taskDetails.activityTabs")}
                  className="w-full"
                  variant="underlined"
                >
                  <Tab
                    key="comments"
                    title={
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{t("taskDetails.comments")}</span>
                        {comments.length > 0 && (
                          <Badge color="primary" size="sm" variant="solid">
                            {comments.length}
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    {activityLoading ? (
                      <div className="p-4 text-center">
                        <p>{t("common.loading")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-2">
                        {/* Add Comment Form */}
                        <div className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg">
                          <div className="flex gap-2">
                            <Textarea
                              className="flex-1"
                              disabled={submittingComment}
                              maxRows={4}
                              minRows={2}
                              placeholder={t("taskDetails.addComment")}
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                            />
                            <Button
                              isIconOnly
                              className="self-end"
                              color="primary"
                              isDisabled={
                                !newComment.trim() || submittingComment
                              }
                              isLoading={submittingComment}
                              size="sm"
                              onPress={handleSubmitComment}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        {comments.length > 0 ? (
                          <div className="space-y-3">
                            {comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    {comment.createdByName}
                                  </span>
                                  <span className="text-xs text-default-500">
                                    {formatRelativeTime(
                                      comment.createdAt,
                                      language,
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed">
                                  {comment.commentText}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-default-500">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t("taskDetails.noComments")}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Tab>
                  <Tab
                    key="history"
                    title={
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span>{t("taskDetails.history")}</span>
                        {history.length > 0 && (
                          <Badge color="secondary" size="sm" variant="solid">
                            {history.length}
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    {activityLoading ? (
                      <div className="p-4 text-center">
                        <p>{t("common.loading")}</p>
                      </div>
                    ) : history.length > 0 ? (
                      <div className="space-y-3 p-2">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium text-sm">
                                {item.changedByName}
                              </span>
                              <span className="text-xs text-default-500">
                                {formatRelativeTime(item.changedAt, language)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {item.items.map((change, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">
                                    {translateFieldName(change.fieldName)}:
                                  </span>{" "}
                                  <span className="text-danger-600 line-through">
                                    {translateStatusValue(change.oldValue) ||
                                      t("common.none")}
                                  </span>{" "}
                                  <span className="text-success-600">
                                    → {translateStatusValue(change.newValue)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-default-500">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>{t("taskDetails.noHistory")}</p>
                      </div>
                    )}
                  </Tab>

                  {/* Task Attachments Tab */}
                  <Tab
                    key="attachments"
                    title={
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        <span>{t("taskDetails.attachments")}</span>
                        {attachments.length > 0 && (
                          <Badge color="primary" size="sm" variant="flat">
                            {attachments.length}
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    {/* File Upload Area */}
                    <div className="mb-4">
                      <div
                        className={`border-2 border-dashed rounded-lg p-3 hover:border-default-400 transition-colors ${
                          hasFileUploadError
                            ? "border-danger"
                            : "border-default-300"
                        }`}
                      >
                        <input
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.zip,.rar"
                          className="hidden"
                          disabled={uploadingFiles}
                          id="task-file-upload"
                          type="file"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                        <label
                          className={`cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                            uploadingFiles
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          htmlFor="task-file-upload"
                        >
                          <Upload className="w-6 h-6 text-default-400" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-default-700">
                              {uploadingFiles
                                ? t("common.uploading")
                                : t("requirements.uploadFiles")}
                            </p>
                            <p className="text-xs text-default-500">
                              PDF, DOC, XLS, Images, ZIP
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {attachments.length > 0 ? (
                      <div className="space-y-3">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/10 rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Paperclip className="w-5 h-5 text-default-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {attachment.originalName}
                                </p>
                                <div className="flex flex-col gap-1 mt-1">
                                  <span className="text-xs font-medium text-default-500">
                                    {attachment.createdByName}
                                  </span>
                                  <div className="flex items-center gap-3 text-xs text-default-400">
                                    <span className="bg-default-100 dark:bg-default-200/20 px-2 py-1 rounded">
                                      {(
                                        (attachment.fileSize || 0) /
                                        1024 /
                                        1024
                                      ).toFixed(2)}{" "}
                                      MB
                                    </span>
                                    {attachment.uploadedAt && (
                                      <span>
                                        {formatDateTime(attachment.uploadedAt, {
                                          showTime: false,
                                          language: "en-US",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {/* Preview Button for supported file types */}
                              {(attachment.originalName
                                .toLowerCase()
                                .endsWith(".pdf") ||
                                attachment.originalName
                                  .toLowerCase()
                                  .match(
                                    /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/,
                                  )) && (
                                <Button
                                  color="default"
                                  size="sm"
                                  startContent={<Eye className="w-4 h-4" />}
                                  variant="light"
                                  onPress={() => onFilePreview(attachment)}
                                >
                                  {t("common.preview")}
                                </Button>
                              )}
                              <Button
                                color="primary"
                                size="sm"
                                startContent={<Download className="w-4 h-4" />}
                                variant="light"
                                onPress={() => onFileDownload(attachment)}
                              >
                                {t("common.download")}
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                startContent={<Trash2 className="w-4 h-4" />}
                                variant="light"
                                onPress={() => onFileDelete(attachment)}
                              >
                                {t("common.delete")}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-default-500">
                        <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>{t("taskDetails.noAttachments")}</p>
                      </div>
                    )}
                  </Tab>
                </Tabs>
              </div>
            </div>
          )}
        </DrawerBody>
        <DrawerFooter className="flex flex-col gap-4">
          {/* buttons */}
          <div className="mt-3 pt-3 flex flex-col gap-3">
            {selectedTask && isTeamManager ? (
              <div className="flex gap-3 items-center">
                <Button
                  className="flex-1"
                  color="default"
                  isDisabled={
                    selectedTask?.statusId === TASK_STATUSES.BLOCKED ||
                    selectedTask?.statusId === TASK_STATUSES.COMPLETED
                  }
                  size="sm"
                  variant="solid"
                  onPress={() => onChangeAssignees(selectedTask)}
                >
                  {isQCManager ? t("tasks.assignQC") : t("changeAssignees")}
                </Button>
              </div>
            ) : selectedTask ? (
              /* Member */
              <div className="flex gap-3 items-center">
                {selectedTask.hasDesignRequest ? (
                  <Chip
                    color="success"
                    size="md"
                    startContent={<CheckCircle className="w-4 h-4" />}
                    variant="flat"
                  >
                    {t("requestedAlready")}
                  </Chip>
                ) : selectedTask.roleType?.toLowerCase() === "developer" ? (
                  <Button
                    className="flex-1"
                    color="primary"
                    isDisabled={
                      selectedTask?.statusId === TASK_STATUSES.BLOCKED ||
                      selectedTask?.statusId === TASK_STATUSES.COMPLETED
                    }
                    size="sm"
                    variant="flat"
                    onPress={() => onRequestDesign(selectedTask)}
                  >
                    {t("requestDesign")}
                  </Button>
                ) : null}

                <Button
                  className="flex-1"
                  isDisabled={
                    selectedTask?.statusId === TASK_STATUSES.BLOCKED ||
                    selectedTask?.statusId === TASK_STATUSES.COMPLETED
                  }
                  size="sm"
                  variant="bordered"
                  onPress={() => onChangeStatus(selectedTask)}
                >
                  {t("changeStatus")}
                </Button>
              </div>
            ) : null}
          </div>

          <Button
            color="danger"
            variant="light"
            onPress={() => onOpenChange(false)}
          >
            {t("common.close")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
