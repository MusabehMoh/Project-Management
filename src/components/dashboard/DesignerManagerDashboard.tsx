import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Palette } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

export default function DesignerManagerDashboard() {
  const { t, language } = useLanguage();

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("designerDashboard.title")}
        </h1>
        <p className="text-xl text-default-600">
          {t("designerDashboard.subtitle")}
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="p-4 rounded-full bg-primary-50 dark:bg-primary-900/20 mb-4">
            <Palette className="text-primary" size={48} />
          </div>
          <h2 className="text-2xl font-semibold">
            {t("designerDashboard.comingSoon")}
          </h2>
        </CardHeader>
        <CardBody className="text-center">
          <p className="text-default-600">
            {t("designerDashboard.comingSoonDescription")}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
