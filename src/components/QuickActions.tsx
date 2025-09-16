import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Alert } from "@heroui/alert";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import {
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useQuickActions } from "@/hooks/useQuickActions";
import { useTeamSearch } from "@/hooks/useTeamSearch";
import { MemberSearchResult } from "@/types/timeline";

// Custom Alert Component with red styling
const CustomAlert = React.forwardRef(
  (
    {title, children, variant = "faded", color = "danger", className, classNames = {}, direction, ...props},
    ref,
  ) => {
    const isRTL = direction === "rtl";
    
    return (
      <Alert
        ref={ref}
        classNames={{
          ...classNames,
          base: [
            "bg-default-50 dark:bg-background shadow-sm",
            "border-1 border-default-200 dark:border-default-100",
            "relative before:content-[''] before:absolute before:z-10",
            isRTL ? "before:right-0 before:top-[-1px] before:bottom-[-1px] before:w-1" : "before:left-0 before:top-[-1px] before:bottom-[-1px] before:w-1",
            isRTL ? "rounded-r-none border-r-0" : "rounded-l-none border-l-0",
            "before:bg-danger",
            classNames.base,
            className,
          ].filter(Boolean).join(" "),
          mainWrapper: ["pt-1 flex items-start justify-between", classNames.mainWrapper].filter(Boolean).join(" "),
          iconWrapper: ["dark:bg-transparent", classNames.iconWrapper].filter(Boolean).join(" "),
          title: [isRTL ? "text-right" : "text-left", "text-sm font-medium", classNames.title].filter(Boolean).join(" "),
          description: [isRTL ? "text-right" : "text-left", "text-xs text-default-500 mt-1", classNames.description].filter(Boolean).join(" "),
        }}
        color={color}
        title={title}
        variant={variant}
        dir={direction}
        {...props}
      >
        {children}
      </Alert>
    );
  },
);

CustomAlert.displayName = "CustomAlert";

interface QuickActionsProps {
  autoRefresh?: boolean;
  className?: string;
  onAssignAnalyst?: (project: any, analystId: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  autoRefresh: _autoRefresh = true,
  className = "",
  onAssignAnalyst,
}) => {
  const { t, direction } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<MemberSearchResult | null>(null);
  const [analystInputValue, setAnalystInputValue] = useState<string>("");

  // Use the same team search hook as projects page
  const {
    employees: analystEmployees,
    loading: analystSearchLoading,
    searchEmployees: searchAnalystEmployees,
    clearResults: clearAnalystResults,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });
  const {
    unassignedProjects,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    refresh,
  } = useQuickActions({
    autoRefresh: false, // Disable auto-refresh to prevent constant loading
    refreshInterval: 30000,
  });

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner color="default" size="md" />
          <p className="mt-3 text-default-500">{t("common.loading") || "Loading..."}</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-default-400 mx-auto mb-3" />
          <p className="font-medium text-foreground mb-2">{t("common.error") || "Error"}</p>
          <p className="text-sm text-default-500 mb-4">{error}</p>
          <Button
            size="sm"
            variant="flat"
            onPress={refresh}
          >
            {t("common.retry") || "Retry"}
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!hasActionsAvailable) {
    return (
      <>
        {null}
        <Modal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          dir={direction}
        >
          <ModalContent>
            <ModalHeader>
              {t("quickActions.assignAnalyst") || "Assign Analyst"}
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-default-600 mb-4">
                {t("quickActions.assignAnalystTo") || "Assign an analyst to"}: {selectedProject?.applicationName}
              </p>
              <Autocomplete
                isClearable
                items={analystEmployees}
                label={t("quickActions.selectAnalyst") || "Select Analyst"}
                placeholder={t("quickActions.chooseAnalyst") || "Choose an analyst"}
                selectedKey={selectedAnalyst?.id?.toString() || ""}
                inputValue={analystInputValue}
                isLoading={analystSearchLoading}
                menuTrigger="input"
                onInputChange={(value) => {
                  setAnalystInputValue(value);
                  // Clear selection if input doesn't match selected analyst
                  if (
                    selectedAnalyst &&
                    value !== selectedAnalyst.fullName
                  ) {
                    setSelectedAnalyst(null);
                  }
                  // Search for analysts
                  searchAnalystEmployees(value);
                }}
                onSelectionChange={(key) => {
                  if (key) {
                    const analyst = analystEmployees.find(
                      (a) => a.id.toString() === key
                    );
                    if (analyst) {
                      setSelectedAnalyst(analyst);
                      setAnalystInputValue(analyst.fullName);
                    }
                  } else {
                    // Clear selection
                    setSelectedAnalyst(null);
                    setAnalystInputValue("");
                  }
                }}
              >
                {(analyst) => (
                  <AutocompleteItem
                    key={analyst.id}
                    textValue={`${analyst.fullName} - ${analyst.militaryNumber}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{analyst.fullName}</span>
                      <span className="text-sm text-default-500">
                        {analyst.militaryNumber} - {analyst.gradeName}
                      </span>
                    </div>
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={handleCancel}
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button
                color="primary"
                onPress={handleAssign}
                disabled={!selectedAnalyst}
              >
                {t("quickActions.assign") || "Assign"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

  const handleAssign = () => {
    if (selectedProject && selectedAnalyst && onAssignAnalyst) {
      onAssignAnalyst(selectedProject, selectedAnalyst.id.toString());
      setIsModalOpen(false);
      setSelectedProject(null);
      setSelectedAnalyst(null);
      clearAnalystResults();
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setSelectedAnalyst(null);
    setAnalystInputValue("");
    clearAnalystResults();
  };

  return (
    <>
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {t("dashboard.myActions") || "My Actions"}
            </h3>
            <p className="text-sm text-default-500 mt-1">
              {t("dashboard.myActionsSubtitle") ||
                "Assign projects that need your attention"}
            </p>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-default-400 hover:text-default-600"
            disabled={refreshing}
            onPress={refresh}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>

        <Divider className="bg-default-200" />

        <CardBody className="p-6">
          {/* Action Buttons and Unassigned Projects */}
          <div className="space-y-4">
            {/* Unassigned Projects Alerts */}
            {unassignedProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("quickActions.unassignedProjects") || "Unassigned Projects"}
                  </h3>
                  <Chip size="sm" variant="flat" className="bg-default-100 text-default-600">
                    {unassignedProjects.length}
                  </Chip>
                </div>
                <Divider className="bg-default-200 mb-4" />
                {unassignedProjects.map((project) => (
                  <CustomAlert
                    key={project.id}
                    title={project.applicationName}
                    description={project.owningUnit}
                    direction={direction}
                  >
                    <Divider className="bg-default-200 my-3" />
                    <div className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}>
                      <Button
                        className="bg-background text-default-700 font-medium border-1 shadow-small"
                        size="sm"
                        variant="bordered"
                        onPress={() => {
                          setSelectedProject(project);
                          setIsModalOpen(true);
                        }}
                      >
                        {t("quickActions.assign") || "Assign"}
                      </Button>
                    </div>
                  </CustomAlert>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        dir={direction}
      >
        <ModalContent>
          <ModalHeader>
            {t("quickActions.assignAnalyst") || "Assign Analyst"}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600 mb-4">
              {t("quickActions.assignAnalystTo") || "Assign an analyst to"}: {selectedProject?.applicationName}
            </p>
            <Autocomplete
              isClearable
              items={analystEmployees}
              label={t("quickActions.selectAnalyst") || "Select Analyst"}
              placeholder={t("quickActions.chooseAnalyst") || "Choose an analyst"}
              selectedKey={selectedAnalyst?.id?.toString() || ""}
              inputValue={analystInputValue}
              isLoading={analystSearchLoading}
              menuTrigger="input"
              onInputChange={(value) => {
                setAnalystInputValue(value);
                // Clear selection if input doesn't match selected analyst
                if (
                  selectedAnalyst &&
                  value !== selectedAnalyst.fullName
                ) {
                  setSelectedAnalyst(null);
                }
                // Search for analysts
                searchAnalystEmployees(value);
              }}
              onSelectionChange={(key) => {
                if (key) {
                  const analyst = analystEmployees.find(
                    (a) => a.id.toString() === key
                  );
                  if (analyst) {
                    setSelectedAnalyst(analyst);
                    setAnalystInputValue(analyst.fullName);
                  }
                } else {
                  // Clear selection
                  setSelectedAnalyst(null);
                  setAnalystInputValue("");
                }
              }}
            >
              {(analyst) => (
                <AutocompleteItem
                  key={analyst.id}
                  textValue={`${analyst.fullName} - ${analyst.militaryNumber}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{analyst.fullName}</span>
                    <span className="text-sm text-default-500">
                      {analyst.militaryNumber} - {analyst.gradeName}
                    </span>
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={handleCancel}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              color="primary"
              onPress={handleAssign}
              disabled={!selectedAnalyst}
            >
              {t("quickActions.assign") || "Assign"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default QuickActions;