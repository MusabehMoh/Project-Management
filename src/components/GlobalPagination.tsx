import { Pagination } from "@heroui/react";

import { useLanguage } from "@/contexts/LanguageContext";

interface GlobalPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showInfo?: boolean;
  className?: string;
}

export const GlobalPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  isLoading = false,
  showInfo = true,
  className = "",
}: GlobalPaginationProps) => {
  const { t } = useLanguage();

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Pagination Info */}
      {showInfo && (
        <div className="text-sm text-default-600 text-center">
          {t("pagination.showing")} {startItem} {t("pagination.to")} {endItem}{" "}
          {t("pagination.of")} {totalItems} {t("pagination.items")}
        </div>
      )}

      {/* Simple Default Pagination */}
      <Pagination
        initialPage={1}
        isDisabled={isLoading}
        page={currentPage}
        total={totalPages}
        onChange={onPageChange}
      />

      {/* Simple Page Info */}
      <div className="text-xs text-default-500 text-center">
        {isLoading
          ? t("pagination.loading")
          : `${t("pagination.page")} ${currentPage} ${t("pagination.of")} ${totalPages}`}
      </div>
    </div>
  );
};

export default GlobalPagination;
