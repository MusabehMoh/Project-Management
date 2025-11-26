import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Maximize2 } from "lucide-react";

import DeveloperQuickActions from "./developer/DeveloperQuickActions";
import DeveloperWorkloadPerformance from "./developer/DeveloperWorkloadPerformance";
import ApprovedRequirements from "./ApprovedRequirements";
import TaskCompletionTracker from "./developer/TaskCompletionTracker";
import DHtmlGanttChart from "./developer/DHtmlGanttChart";
import DeveloperCalendar from "./calendar";

import { useLanguage } from "@/contexts/LanguageContext";
import { developerQuickActionsService } from "@/services/api/developerQuickActionsService";
import ModernQuickStats from "@/components/dashboard/ModernQuickStats";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function DeveloperManagerDashboard() {
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isTeamPerformanceModalOpen, setIsTeamPerformanceModalOpen] =
    useState(false);
  const [isProjectTimelineModalOpen, setIsProjectTimelineModalOpen] =
    useState(false);

  // Handle task assignment
  const handleAssignDeveloper = async (task: any, developerId: string) => {
    try {
      await developerQuickActionsService.assignDeveloper(task.id, developerId);

      // Show success toast
      showSuccessToast(t("developerDashboard.assignDeveloperSuccess"));

      // Refresh the quick actions to show updated data
      setRefreshKey((prev) => prev + 1);
    } catch {
      // Show error toast
      showErrorToast(t("developerDashboard.assignDeveloperError"));
    }
  };

  // Handle code review assignment
  const handleAssignReviewer = async (pullRequest: any, reviewerId: string) => {
    try {
      await developerQuickActionsService.assignReviewer(
        pullRequest.id,
        reviewerId,
      );

      // Show success toast
      showSuccessToast(t("developerDashboard.assignReviewerSuccess"));

      setRefreshKey((prev) => prev + 1);
    } catch {
      // Show error toast
      showErrorToast(t("developerDashboard.assignReviewerError"));
    }
  };

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("developerDashboard.title")}
        </h1>
        <p className="text-lg text-default-600">
          {t("developerDashboard.subtitle")}
        </p>
      </div>

      {/* Quick Stats */}
      <ModernQuickStats />

      {/* Quick Actions and Pending Code Reviews Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[70%] space-y-4">
          <DeveloperQuickActions
            key={refreshKey}
            autoRefresh={true}
            onAssignDeveloper={handleAssignDeveloper}
            onAssignReviewer={handleAssignReviewer}
          />
        </div>

        <div className="lg:w-[30%] space-y-4">
          <ApprovedRequirements />
        </div>
      </div>

      {/* Developer Workload and Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("developerDashboard.teamWorkload")}
            </h2>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setIsTeamPerformanceModalOpen(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          <DeveloperWorkloadPerformance />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("calendar.title")}
          </h2>
          <DeveloperCalendar showSidebar={false} />
        </div>
      </div>

      {/* Full Width Project Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("developerDashboard.projectTimeline")}
          </h2>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setIsProjectTimelineModalOpen(true)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        {!isProjectTimelineModalOpen && <DHtmlGanttChart height="400px" />}
      </div>

      {/* Task Completion Only */}
      <div className="space-y-6">
        <div className="space-y-4">
          <TaskCompletionTracker />
        </div>
      </div>

      {/* Team Performance Modal */}
      <Modal
        isOpen={isTeamPerformanceModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsTeamPerformanceModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-2xl font-semibold">
              {t("developerDashboard.teamWorkload")}
            </h2>
          </ModalHeader>
          <ModalBody className="py-6">
            <DeveloperWorkloadPerformance />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Project Timeline Modal */}
      {isProjectTimelineModalOpen && (
        <Modal
          classNames={{
            base: "m-0 sm:m-0",
            wrapper: "items-center justify-center",
          }}
          isOpen={isProjectTimelineModalOpen}
          scrollBehavior="outside"
          size="full"
          onClose={() => setIsProjectTimelineModalOpen(false)}
        >
          <ModalContent>
            <ModalHeader>
              <h2 className="text-2xl font-semibold">
                {t("developerDashboard.projectTimeline")}
              </h2>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="h-[calc(100vh-120px)]">
                <DHtmlGanttChart height="100%" />
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
