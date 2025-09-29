import type { FilePreviewState } from "@/hooks/useFilePreview";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import {
  Download,
  FileText,
  Image,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

interface FilePreviewProps {
  previewState: FilePreviewState;
  onClose: () => void;
  onDownload?: () => void;
  className?: string;
}

/**
 * Global FilePreview component that can display PDFs and images
 * For other file types, it triggers direct download
 */
export function FilePreview({
  previewState,
  onClose,
  onDownload,
  className,
}: FilePreviewProps) {
  const { t } = useLanguage();

  // PDF viewer state (must be at top level)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);

  if (!previewState.isOpen || !previewState.file) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderPreviewContent = () => {
    switch (previewState.previewType) {
      case "pdf":
        return (
          <div className="w-full h-[600px] flex flex-col">
            {previewState.file?.url ? (
              <>
                {/* PDF Controls Bar */}
                <div className="flex items-center justify-between bg-gray-800 text-white p-2 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      className="text-white hover:bg-gray-700"
                      size="sm"
                      variant="light"
                      onPress={() => setZoom(Math.max(25, zoom - 25))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-2">{zoom}%</span>
                    <Button
                      isIconOnly
                      className="text-white hover:bg-gray-700"
                      size="sm"
                      variant="light"
                      onPress={() => setZoom(Math.min(200, zoom + 25))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      className="text-white hover:bg-gray-700"
                      isDisabled={currentPage <= 1}
                      size="sm"
                      variant="light"
                      onPress={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      isIconOnly
                      className="text-white hover:bg-gray-700"
                      isDisabled={currentPage >= totalPages}
                      size="sm"
                      variant="light"
                      onPress={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 bg-gray-700 p-4 rounded-b-lg">
                  <iframe
                    className="w-full h-full border-0 rounded bg-white"
                    src={`${previewState.file.url}#page=${currentPage}&zoom=${zoom}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top left",
                    }}
                    title={previewState.file.name}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <FileText className="w-16 h-16 text-default-400" />
                <p className="text-default-500">
                  {t("filePreview.noPreviewAvailable") ||
                    "No preview available"}
                </p>
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="w-full max-h-[600px] flex items-center justify-center">
            {previewState.file?.url ? (
              <img
                alt={previewState.file.name}
                className="max-w-full max-h-full object-contain rounded-lg"
                src={previewState.file.url}
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Image className="w-16 h-16 text-default-400" />
                <p className="text-default-500">
                  {t("filePreview.noPreviewAvailable") ||
                    "No preview available"}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      className={className}
      isOpen={previewState.isOpen}
      scrollBehavior="inside"
      size="4xl"
      onOpenChange={() => onClose()}
    >
      <ModalContent>
        {(_onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {previewState.previewType === "pdf" ? (
                    <FileText className="w-5 h-5 text-danger-500" />
                  ) : (
                    <Image className="w-5 h-5 text-success-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {previewState.file?.name}
                    </h3>
                    {previewState.file?.size && (
                      <p className="text-sm text-default-500">
                        {formatFileSize(previewState.file.size)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="p-0">
              <div className="p-6">{renderPreviewContent()}</div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="primary"
                startContent={<Download className="w-4 h-4" />}
                onPress={onDownload}
              >
                {t("common.download")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
