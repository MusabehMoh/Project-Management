import React from "react";
import { Button } from "@heroui/button";
import { AlertCircle } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

interface ErrorWithRetryProps {
  error?: string;
  onRetry: () => void;
  className?: string;
  icon?: React.ReactNode;
  testId?: string;
}

const ErrorWithRetry: React.FC<ErrorWithRetryProps> = ({
  error,
  onRetry,
  className = "",
  icon,
  testId = "error-with-retry",
}) => {
  const { t } = useLanguage();

  // If no specific error message is provided, use the generic one
  const errorMessage = error || t("error.dataLoading");

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center ${className}`}
      data-testid={testId}
    >
      {icon || <AlertCircle className="w-8 h-8 text-danger mb-2" />}
      <p className="font-medium text-foreground mb-2">
        {t("error.failedToFetch")}
      </p>
      <p className="text-sm text-default-500 mb-4">{errorMessage}</p>
      <Button size="sm" variant="flat" onPress={onRetry}>
        {t("error.retry")}
      </Button>
    </div>
  );
};

export default ErrorWithRetry;
