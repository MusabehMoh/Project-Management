import type {
  ProjectRequirement,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

import React, { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Chip,
  Tabs,
  Tab,
  Badge,
} from "@heroui/react";
import {
  Calendar,
  Users,
  Paperclip,
  Eye,
  Download,
  Check,
  CornerUpLeft,
  History,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useFilePreview } from "@/hooks/useFilePreview";
import { useRequirementHistory } from "@/hooks";
import { FilePreview } from "@/components/FilePreview";
import { projectRequirementsService } from "@/services/api";
import {
  convertTypeToString,
  REQUIREMENT_STATUS,
} from "@/constants/projectRequirements";
import { formatDateTime } from "@/utils/dateFormatter";

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface RequirementDetailsDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  requirement: ProjectRequirement | null;
  getStatusColor: (
    status: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getStatusText: (status: number) => string;
  getPriorityColor: (
    priority: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getPriorityLabel: (priority: number) => string | undefined;
  // Optional props for different drawer modes
  showApprovalButton?: boolean;
  onApprove?: (requirement: ProjectRequirement) => void;
  showTaskTimelineButtons?: boolean;
  onCreateTask?: (requirement: ProjectRequirement) => void;
  onCreateTimeline?: (requirement: ProjectRequirement) => void;
  onReturn?: (requirement: ProjectRequirement) => void;
}

export default function RequirementDetailsDrawer({
  isOpen,
  onOpenChange,
  requirement,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
  showApprovalButton = false,
  onApprove,
  showTaskTimelineButtons = false,
  onCreateTask,
  onCreateTimeline,
  onReturn,
}: RequirementDetailsDrawerProps) {
  const { t } = useLanguage();
  const { hasPermission } = usePermissions();

  // Loading state for attachment operations
  const [loadingAttachmentId, setLoadingAttachmentId] = useState<number | null>(
    null,
  );

  // Fetch requirement history
  const { history, loading: historyLoading } = useRequirementHistory({
    requirementId: requirement?.id,
    enabled: isOpen && !!requirement,
  });

  // File preview hook
  const { previewState, previewFile, closePreview, downloadCurrentFile } =
    useFilePreview({
      downloadFunction: (requirementId, attachmentId, filename) =>
        projectRequirementsService
          .downloadAttachment(requirementId, attachmentId)
          .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }),
    });

  // Handle file preview with attachment data
  const handleFilePreview = async (
    attachment: ProjectRequirementAttachment,
  ) => {
    if (!requirement) return;

    setLoadingAttachmentId(attachment.id);
    try {
      const blob = await projectRequirementsService.downloadAttachment(
        requirement.id,
        attachment.id,
      );
      const url = window.URL.createObjectURL(blob);

      await previewFile(attachment.originalName, url, attachment.fileSize);
    } catch {
      // If preview fails, just download the file
      await projectRequirementsService
        .downloadAttachment(requirement.id, attachment.id)
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");

          a.href = url;
          a.download = attachment.originalName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        });
    } finally {
      setLoadingAttachmentId(null);
    }
  };

  if (!requirement) return null;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        placement="right"
        size="lg"
        onOpenChange={onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">{requirement.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-default-500 font-medium">
                      {t("requirements.status")}
                    </span>
                    <Chip
                      className="w-fit"
                      color={getStatusColor(requirement.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(requirement.status)}
                    </Chip>
                  </div>

                  {/* Priority */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-default-500 font-medium">
                      {t("requirements.priority")}
                    </span>
                    <Chip
                      className="w-fit"
                      color={getPriorityColor(requirement.priority)}
                      size="sm"
                      variant="flat"
                    >
                      {getPriorityLabel(requirement.priority) ||
                        t(`requirements.priority.${requirement.priority}`)}
                    </Chip>
                  </div>

                  {/* Type */}
                  {requirement.type && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-default-500 font-medium">
                        {t("requirements.type")}
                      </span>
                      <Chip
                        className="w-fit"
                        color={
                          convertTypeToString(requirement.type) === "new"
                            ? "success"
                            : "warning"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {convertTypeToString(requirement.type) === "new"
                          ? t("requirements.new")
                          : t("requirements.changeRequest")}
                      </Chip>
                    </div>
                  )}
                </div>
              </DrawerHeader>
              <DrawerBody>
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("requirements.requirementDescription")}
                    </h3>
                    <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                      <p
                        dangerouslySetInnerHTML={{
                          __html:
                            requirement.description ||
                            t("requirements.noDescription"),
                        }}
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Expected Completion Date */}
                  {requirement.expectedCompletionDate && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t("requirements.expectedCompletion")}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-default-400" />
                        <span className="text-sm">
                          {formatDate(requirement.expectedCompletionDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-default-600 mb-1">
                        {t("requirements.type")}
                      </h4>
                      <p className="text-sm">
                        {requirement.type === 1
                          ? t("requirements.new")
                          : requirement.type === 2
                            ? t("requirements.changeRequest")
                            : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-default-600 mb-1">
                        {t("requirements.created")}
                      </h4>
                      <p className="text-sm">
                        {requirement.createdAt
                          ? formatDate(requirement.createdAt)
                          : "N/A"}
                      </p>
                    </div>
                    {requirement.sender && (
                      <div>
                        <h4 className="text-sm font-medium text-default-600 mb-1">
                          {t("requirements.sentBy")}
                        </h4>
                        <p className="text-sm">
                          {requirement.sender.gradeName}{" "}
                          {requirement.sender.fullName}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  {requirement.attachments &&
                    requirement.attachments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-default-400" />
                          {t("requirements.attachments")} (
                          {requirement.attachments.length})
                        </h3>
                        <div className="space-y-2">
                          {requirement.attachments.map((attachment) => (
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
                                        {formatDate(attachment.uploadedAt)}
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
                                    isDisabled={loadingAttachmentId !== null}
                                    isLoading={
                                      loadingAttachmentId === attachment.id
                                    }
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
                                {
                                  <Button
                                    color="primary"
                                    isDisabled={loadingAttachmentId !== null}
                                    isLoading={
                                      loadingAttachmentId === attachment.id
                                    }
                                    size="sm"
                                    startContent={
                                      <Download className="w-4 h-4" />
                                    }
                                    variant="light"
                                    onPress={async () => {
                                      setLoadingAttachmentId(attachment.id);
                                      try {
                                        const blob =
                                          await projectRequirementsService.downloadAttachment(
                                            requirement.id,
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
                                      } finally {
                                        setLoadingAttachmentId(null);
                                      }
                                    }}
                                  >
                                    {t("common.download")}
                                  </Button>
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Task Information */}
                  {requirement.requirementTask && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-default-400" />
                        {t("requirements.taskInfo")}
                      </h3>
                      <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          {requirement.requirementTask.developer && (
                            <div>
                              <h4 className="text-sm font-medium text-default-600 mb-1">
                                {t("tasks.developer")}
                              </h4>
                              <p className="text-sm">
                                {requirement.requirementTask.developer.gradeName}{" "}
                                {requirement.requirementTask.developer.fullName}
                              </p>
                            </div>
                          )}
                          {requirement.requirementTask.qc && (
                            <div>
                              <h4 className="text-sm font-medium text-default-600 mb-1">
                                {t("tasks.qcMember")}
                              </h4>
                              <p className="text-sm">
                                {requirement.requirementTask.qc.gradeName}{" "}
                                {requirement.requirementTask.qc.fullName}
                              </p>
                            </div>
                          )}
                          {requirement.requirementTask.designer && (
                            <div>
                              <h4 className="text-sm font-medium text-default-600 mb-1">
                                {t("tasks.designer")}
                              </h4>
                              <p className="text-sm">
                                {requirement.requirementTask.designer.gradeName}{" "}
                                {requirement.requirementTask.designer.fullName}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline Information */}
                  {requirement.timeline && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-default-400" />
                        {t("requirements.timelineInfo")}
                      </h3>
                      <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-default-600 mb-1">
                            {t("timeline.name")}
                          </h4>
                          <p className="text-sm">{requirement.timeline.name}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-default-600 mb-1">
                            {t("timeline.id")}
                          </h4>
                          <p className="text-sm">{requirement.timeline.id}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status History Section */}
                  <div className="mt-6 pt-4 border-t border-divider">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      {t("taskDetails.activity")}
                    </h3>

                    <Tabs
                      aria-label={t("requirements.historyTab")}
                      className="w-full"
                      variant="underlined"
                    >
                      <Tab
                        key="history"
                        title={
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4" />
                            <span>{t("taskDetails.history")}</span>
                            {history.length > 0 && (
                              <Badge
                                color="secondary"
                                size="sm"
                                variant="solid"
                              >
                                {history.length}
                              </Badge>
                            )}
                          </div>
                        }
                      >
                        {historyLoading ? (
                          <div className="p-4 text-center">
                            <p>{t("taskDetails.loadingHistory")}</p>
                          </div>
                        ) : history.length > 0 ? (
                          <div className="space-y-3 p-2">
                            {history.map((item) => (
                              <div
                                key={item.id}
                                className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium">
                                    {item.createdByName ||
                                      `User ${item.createdBy}`}
                                  </span>
                                  <span className="text-xs text-default-500">
                                    {formatDateTime(item.createdAt, {
                                      showTime: true,
                                      language: "en-US",
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-default-600">
                                  {t("requirements.statusChanged")}
                                  {": "}
                                  {getStatusText(item.fromStatus)} →{" "}
                                  {getStatusText(item.toStatus)}
                                </p>
                                {item.reason && (
                                  <p className="text-sm text-default-500 mt-1 italic">
                                    {item.reason}
                                  </p>
                                )}
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
                    </Tabs>
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="flex gap-2 flex-wrap justify-end">
                {/* Approval Button for approval requests */}
                {showApprovalButton &&
                  hasPermission({ actions: ["requirements.approve"] }) &&
                  onApprove && (
                    <Button
                      color="success"
                      onPress={() => {
                        onClose();
                        onApprove(requirement);
                      }}
                    >
                      <Check size={16} />
                      {t("requirements.approve")}
                    </Button>
                  )}

                {/* Task/Timeline Buttons for development requirements */}
                {showTaskTimelineButtons && (
                  <>
                    {/* Business Rule: Show Task button only if requirement doesn't have timeline */}
                    {!requirement.timeline &&
                      hasPermission({
                        actions: ["requirements.tasks.create"],
                      }) &&
                      onCreateTask && (
                        <Button
                          color="default"
                          startContent={
                            requirement.requirementTask ? (
                              <Eye size={16} />
                            ) : (
                              <Users size={16} />
                            )
                          }
                          variant="flat"
                          onPress={() => onCreateTask(requirement)}
                        >
                          {requirement.requirementTask
                            ? t("tasks.viewTask")
                            : t("tasks.createTask")}
                        </Button>
                      )}

                    {/* Business Rule: Show Timeline button only if requirement doesn't have task */}
                    {!requirement.requirementTask &&
                      hasPermission({
                        actions: ["requirements.timelines.create"],
                      }) &&
                      onCreateTimeline && (
                        <Button
                          color="default"
                          startContent={
                            requirement.timeline ? (
                              <Eye size={16} />
                            ) : (
                              <Calendar size={16} />
                            )
                          }
                          variant="flat"
                          onPress={() => onCreateTimeline(requirement)}
                        >
                          {requirement.timeline
                            ? t("timeline.viewTimeline")
                            : t("timeline.createTimeline")}
                        </Button>
                      )}

                    {/* Business Rule: Show Return button only for approved requirements */}
                    {requirement.status === REQUIREMENT_STATUS.APPROVED &&
                      onReturn && (
                        <Button
                          color="danger"
                          startContent={<CornerUpLeft size={16} />}
                          variant="flat"
                          onPress={() => {
                            onClose();
                            onReturn(requirement);
                          }}
                        >
                          {t("requirements.return")}
                        </Button>
                      )}
                  </>
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* File Preview Modal */}
      <FilePreview
        previewState={previewState}
        onClose={closePreview}
        onDownload={downloadCurrentFile}
      />
    </>
  );
}
