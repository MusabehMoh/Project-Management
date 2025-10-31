import type {
  ProjectRequirement,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Chip,
} from "@heroui/react";
import { Calendar, Users, Paperclip, Eye, Download, Check } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useFilePreview } from "@/hooks/useFilePreview";
import { FilePreview } from "@/components/FilePreview";
import { projectRequirementsService } from "@/services/api";
import { convertTypeToString } from "@/constants/projectRequirements";

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
}: RequirementDetailsDrawerProps) {
  const { t } = useLanguage();
  const { hasPermission } = usePermissions();

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
                <div className="flex items-center gap-2">
                  <Chip
                    color={getStatusColor(requirement.status)}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusText(requirement.status)}
                  </Chip>
                  <Chip
                    color={getPriorityColor(requirement.priority)}
                    size="sm"
                    variant="flat"
                  >
                    {getPriorityLabel(requirement.priority) ||
                      t(`requirements.priority.${requirement.priority}`)}
                  </Chip>
                  {requirement.type && (
                    <Chip
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
                        {t("requirements.id")}
                      </h4>
                      <p className="text-sm">{requirement.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-default-600 mb-1">
                        {t("requirements.type")}
                      </h4>
                      <p className="text-sm">
                        {t(`requirements.type.${requirement.type}`) || "N/A"}
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
                    <div>
                      <h4 className="text-sm font-medium text-default-600 mb-1">
                        {t("requirements.updated")}
                      </h4>
                      <p className="text-sm">
                        {requirement.updatedAt
                          ? formatDate(requirement.updatedAt)
                          : "N/A"}
                      </p>
                    </div>
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
                                { (
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
                                      }
                                    }}
                                  >
                                    {t("common.download")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Task Information */}
                  {requirement.task && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-default-400" />
                        {t("requirements.taskInfo")}
                      </h3>
                      <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          {requirement.task.developerId && (
                            <div>
                              <h4 className="text-sm font-medium text-default-600 mb-1">
                                {t("tasks.developer")}
                              </h4>
                              <p className="text-sm">
                                {requirement.task.developerName ||
                                  `Developer ID: ${requirement.task.developerId}`}
                              </p>
                            </div>
                          )}
                          {requirement.task.qcId && (
                            <div>
                              <h4 className="text-sm font-medium text-default-600 mb-1">
                                {t("tasks.qcMember")}
                              </h4>
                              <p className="text-sm">
                                {requirement.task.qcName ||
                                  `QC ID: ${requirement.task.qcId}`}
                              </p>
                            </div>
                          )}
                        </div>
                        {requirement.task.createdAt && (
                          <div>
                            <h4 className="text-sm font-medium text-default-600 mb-1">
                              {t("tasks.assignedOn")}
                            </h4>
                            <p className="text-sm">
                              {formatDate(requirement.task.createdAt)}
                            </p>
                          </div>
                        )}
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
                </div>
              </DrawerBody>
              <DrawerFooter className="flex justify-between">
                <Button color="default" variant="flat" onPress={onClose}>
                  {t("common.close")}
                </Button>

                <div className="flex gap-2">
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
                              requirement.task ? (
                                <Eye size={16} />
                              ) : (
                                <Users size={16} />
                              )
                            }
                            variant="flat"
                            onPress={() => onCreateTask(requirement)}
                          >
                            {requirement.task
                              ? t("common.view") + " Task"
                              : t("common.create") + " Task"}
                          </Button>
                        )}

                      {/* Business Rule: Show Timeline button only if requirement doesn't have task */}
                      {!requirement.task &&
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
                              ? t("common.view") + " Timeline"
                              : t("common.create") + " Timeline"}
                          </Button>
                        )}
                    </>
                  )}
                </div>
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
