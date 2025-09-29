import { useState, useCallback } from "react";
import { addToast } from "@heroui/toast";

interface FilePreviewOptions {
  requirementId?: number;
  attachmentId?: number;
  downloadFunction?: (
    requirementId: number,
    attachmentId: number,
    filename: string,
  ) => Promise<void>;
}

export interface FilePreviewState {
  isOpen: boolean;
  file: {
    name: string;
    url?: string;
    type: string;
    size?: number;
  } | null;
  previewType: "pdf" | "image" | "download" | null;
}

/**
 * Global hook for handling file previews and downloads
 * Supports PDF and image previews, direct download for other file types
 */
export function useFilePreview(options: FilePreviewOptions = {}) {
  const [previewState, setPreviewState] = useState<FilePreviewState>({
    isOpen: false,
    file: null,
    previewType: null,
  });

  const getFileType = useCallback(
    (filename: string): "pdf" | "image" | "download" => {
      const extension = filename.toLowerCase().split(".").pop() || "";

      if (extension === "pdf") {
        return "pdf";
      }

      if (
        ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)
      ) {
        return "image";
      }

      return "download";
    },
    [],
  );

  const previewFile = useCallback(
    async (filename: string, fileUrl?: string, fileSize?: number) => {
      const fileType = getFileType(filename);

      if (fileType === "download") {
        // For non-previewable files, trigger direct download
        if (
          options.requirementId &&
          options.attachmentId &&
          options.downloadFunction
        ) {
          try {
            await options.downloadFunction(
              options.requirementId,
              options.attachmentId,
              filename,
            );
          } catch {
            addToast({
              title: "Error",
              description: "Failed to download file",
              color: "danger",
            });
          }
        } else {
          // If no download function provided, try direct URL download
          if (fileUrl) {
            const link = document.createElement("a");

            link.href = fileUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }

        return;
      }

      // For previewable files (PDF, images), open preview modal
      setPreviewState({
        isOpen: true,
        file: {
          name: filename,
          url: fileUrl,
          type: fileType,
          size: fileSize,
        },
        previewType: fileType,
      });
    },
    [
      getFileType,
      options.requirementId,
      options.attachmentId,
      options.downloadFunction,
    ],
  );

  const closePreview = useCallback(() => {
    setPreviewState({
      isOpen: false,
      file: null,
      previewType: null,
    });
  }, []);

  const downloadCurrentFile = useCallback(async () => {
    if (!previewState.file) return;

    if (
      options.requirementId &&
      options.attachmentId &&
      options.downloadFunction
    ) {
      try {
        await options.downloadFunction(
          options.requirementId,
          options.attachmentId,
          previewState.file.name,
        );
      } catch {
        addToast({
          title: "Error",
          description: "Failed to download file",
          color: "danger",
        });
      }
    } else if (previewState.file.url) {
      const link = document.createElement("a");

      link.href = previewState.file.url;
      link.download = previewState.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        title: "Success",
        description: "File downloaded successfully",
        color: "success",
      });
    }
  }, [
    previewState.file,
    options.requirementId,
    options.attachmentId,
    options.downloadFunction,
  ]);

  return {
    previewState,
    previewFile,
    closePreview,
    downloadCurrentFile,
    getFileType,
  };
}
