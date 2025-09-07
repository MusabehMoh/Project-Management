import React from "react";

import { useLanguage } from "@/contexts/LanguageContext";

export const AccessDenied: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          {t("access.denied.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("access.denied.message")}
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
