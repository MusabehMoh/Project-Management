import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import UrgentNotifications from "@/components/UrgentNotifications";
import RequirementOverview from "@/components/RequirementOverview";
import TeamWorkloadPerformance from "@/components/TeamWorkloadPerformanceNew";

export default function IndexPage() {
  const { t, language } = useLanguage();

  return (
    <DefaultLayout>
      <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {t("dashboard.title")}
          </h1>
          <p className="text-lg text-default-600">{t("dashboard.subtitle")}</p>

          <div className="flex gap-4 justify-center">
            <Button color="primary" size="lg">
              {t("dashboard.newProject")}
            </Button>
            <Button size="lg" variant="bordered">
              {t("dashboard.importData")}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-success">3</p>
              <p className="text-sm text-default-600">
                {t("dashboard.activeProjects")}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-primary">8</p>
              <p className="text-sm text-default-600">
                {t("dashboard.totalTasks")}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-warning">5</p>
              <p className="text-sm text-default-600">
                {t("dashboard.inProgress")}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-danger">2</p>
              <p className="text-sm text-default-600">
                {t("dashboard.overdue")}
              </p>
            </div>
          </Card>
        </div>

        {/* Team Workload Performance */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("dashboard.teamWorkload")}
          </h2>
          <TeamWorkloadPerformance />
        </div>

        {/* Project Pipeline Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Project Pipeline */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("dashboard.projectPipeline")}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {/* Pipeline Stages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Planning Stage */}
                <Card className="border-t-4 border-t-primary">
                  <CardHeader className="pb-1">
                    <h3 className="text-lg font-medium text-foreground">{t("pipeline.planning")}</h3>
                    <Chip size="sm" color="primary" variant="flat" className={language === "ar" ? "mr-2" : "ml-2"}>
                      5
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody className="gap-3 p-2 overflow-hidden">
                    <ScrollShadow hideScrollBar className="max-h-64 p-2">
                      <div className="space-y-2">
                        <Card className="mb-3 shadow-sm">
                          <CardBody className="p-3">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm">{t("pipeline.initiatePlanning")}</p>
                            </div>
                            <p className="text-xs text-default-500 mt-1">{t("pipeline.reviewRequirements")}</p>
                          </CardBody>
                        </Card>
                        <Card className="mb-3 shadow-sm">
                          <CardBody className="p-3">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm">{t("pipeline.resourceAllocation")}</p>
                            </div>
                            <p className="text-xs text-default-500 mt-1">{t("pipeline.assignTeamMembers")}</p>
                          </CardBody>
                        </Card>
                      </div>
                    </ScrollShadow>
                  </CardBody>
                </Card>

                {/* In Progress Stage */}
                <Card className="border-t-4 border-t-warning">
                  <CardHeader className="pb-1">
                    <h3 className="text-lg font-medium text-foreground">{t("pipeline.inProgress")}</h3>
                    <Chip size="sm" color="warning" variant="flat" className={language === "ar" ? "mr-2" : "ml-2"}>
                      8
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody className="gap-3 p-2 overflow-hidden">
                    <ScrollShadow hideScrollBar className="max-h-64 p-2">
                      <div className="space-y-2">
                        <Card className="mb-3 shadow-sm">
                          <CardBody className="p-3">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm">{t("pipeline.activeDevelopment")}</p>
                            </div>
                            <p className="text-xs text-default-500 mt-1">{t("pipeline.codingPhase")}</p>
                          </CardBody>
                        </Card>
                        <Card className="mb-3 shadow-sm">
                          <CardBody className="p-3">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm">{t("pipeline.testing")}</p>
                            </div>
                            <p className="text-xs text-default-500 mt-1">{t("pipeline.qualityAssurance")}</p>
                          </CardBody>
                        </Card>
                      </div>
                    </ScrollShadow>
                  </CardBody>
                </Card>

                {/* Completed Stage */}
                <Card className="border-t-4 border-t-success">
                  <CardHeader className="pb-1">
                    <h3 className="text-lg font-medium text-foreground">{t("pipeline.completed")}</h3>
                    <Chip size="sm" color="success" variant="flat" className={language === "ar" ? "mr-2" : "ml-2"}>
                      12
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody className="gap-3 p-2 overflow-hidden">
                    <ScrollShadow hideScrollBar className="max-h-64 p-2">
                      <div className="space-y-2">
                        <Card className="mb-3 shadow-sm">
                          <CardBody className="p-3">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm">{t("pipeline.deployment")}</p>
                            </div>
                            <p className="text-xs text-default-500 mt-1">{t("pipeline.liveProduction")}</p>
                          </CardBody>
                        </Card>
                        <Card className="mb-3 shadow-sm">
                          <CardBody className="p-3">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm">{t("pipeline.maintenance")}</p>
                            </div>
                            <p className="text-xs text-default-500 mt-1">{t("pipeline.ongoingSupport")}</p>
                          </CardBody>
                        </Card>
                      </div>
                    </ScrollShadow>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Side Column - Urgent Notifications and Requirement Overview */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Updates Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("dashboard.updates")}
                </h2>
                <UrgentNotifications 
                  maxNotifications={5} 
                  useMockData={true}
                />
              </div>
              
              {/* Requirement Overview Section */}
              <div className="space-y-4">
                <RequirementOverview useMockData={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
