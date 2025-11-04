import type { Project } from "@/types/project";
import type {
  ProjectDetails,
  SystemAttachment,
  SystemDeveloper,
  SystemTechnology,
  Technology,
  TechnologyCategory,
  CreateAttachmentRequest,
} from "@/types/projectDetails";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Avatar,
  Spinner,
  Badge,
} from "@heroui/react";

import { useLanguage } from "@/contexts/LanguageContext";
import { projectDetailsService } from "@/services/api";
import {
  DeleteIcon,
  DownloadIcon,
  UploadIcon,
  FileIcon,
  UserIcon,
  CodeIcon,
  AlertCircleIcon,
} from "@/components/icons";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  project: Project | null;
}

export function ProjectDetailsModal({
  isOpen,
  onOpenChange,
  project,
}: ProjectDetailsModalProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null,
  );
  const [attachments, setAttachments] = useState<SystemAttachment[]>([]);
  const [developers, setDevelopers] = useState<SystemDeveloper[]>([]);
  const [technologies, setTechnologies] = useState<SystemTechnology[]>([]);
  const [technologyItems, setTechnologyItems] = useState<Technology[]>([]);
  const [technologyCategories, setTechnologyCategories] = useState<
    TechnologyCategory[]
  >([]);

  // Form states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [addingDeveloper, setAddingDeveloper] = useState(false);
  const [addingTechnology, setAddingTechnology] = useState(false);

  // Technology selection states
  const [selectedTechnologyCategory, setSelectedTechnologyCategory] =
    useState<string>("");

  // Load project details when modal opens and reset state when modal closes
  useEffect(() => {
    if (isOpen && project) {
      setError(null);
      loadProjectDetails();
      loadTechnologyData();
    } else if (!isOpen) {
      // Reset all states when modal closes
      setActiveTab("overview");
      setProjectDetails(null);
      setAttachments([]);
      setDevelopers([]);
      setTechnologies([]);
      setSelectedFile(null);
      setFileName("");
      setFileNote("");
      setUploadingFile(false);
      setAddingDeveloper(false);
      setAddingTechnology(false);
      setSelectedTechnologyCategory("");
      setLoading(false);
      setError(null);
    }
  }, [isOpen, project]);

  const loadProjectDetails = async () => {
    if (!project) return;

    setLoading(true);
    setError(null);
    try {
      const [detailsRes, attachmentsRes, developersRes, technologiesRes] =
        await Promise.all([
          projectDetailsService.getProjectDetails(project.id),
          projectDetailsService.getAttachments(project.id),
          projectDetailsService.getDevelopers(project.id),
          projectDetailsService.getTechnologies(project.id),
        ]);

      if (detailsRes.success) setProjectDetails(detailsRes.data);
      if (attachmentsRes.success) setAttachments(attachmentsRes.data);
      if (developersRes.success) setDevelopers(developersRes.data);
      if (technologiesRes.success) setTechnologies(technologiesRes.data);
    } catch (error) {
      console.error("Error loading project details:", error);
      setError("Failed to load project details. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  const loadTechnologyData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        projectDetailsService.getTechnologyItems(),
        projectDetailsService.getTechnologyCategories(),
      ]);

      if (itemsRes.success) setTechnologyItems(itemsRes.data);
      if (categoriesRes.success) setTechnologyCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error loading technology data:", error);
      // Don't set error for technology data as it's not critical for modal opening
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !fileName || !project) return;

    setUploadingFile(true);
    setError(null);
    try {
      const uploadData: CreateAttachmentRequest = {
        systemId: project.id,
        name: fileName,
        fileName: selectedFile.name,
        note: fileNote,
        type: selectedFile.type,
        content: selectedFile,
      };

      const response = await projectDetailsService.createAttachment(uploadData);

      if (response.success) {
        setAttachments([...attachments, response.data]);
        setSelectedFile(null);
        setFileName("");
        setFileNote("");
        // Reset the file input
        const fileInput = document.querySelector(
          'input[type="file"]',
        ) as HTMLInputElement;

        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!project) return;

    try {
      await projectDetailsService.deleteAttachment(project.id, attachmentId);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setError("Failed to delete file. Please try again.");
    }
  };

  const handleAddDeveloper = async (developerId: number) => {
    if (!project) return;

    setAddingDeveloper(true);
    try {
      const response = await projectDetailsService.addDeveloper({
        systemId: project.id,
        developerId,
      });

      if (response.success) {
        setDevelopers([...developers, response.data]);
      }
    } catch (error) {
      console.error("Error adding developer:", error);
      setError("Failed to add developer. Please try again.");
    } finally {
      setAddingDeveloper(false);
    }
  };

  const handleRemoveDeveloper = async (developerId: number) => {
    if (!project) return;

    try {
      await projectDetailsService.removeDeveloper(project.id, developerId);
      setDevelopers(developers.filter((d) => d.developerId !== developerId));
    } catch (error) {
      console.error("Error removing developer:", error);
      setError("Failed to remove developer. Please try again.");
    }
  };

  const handleAddTechnology = async (
    technologyId: number,
    categoryId: number,
  ) => {
    if (!project) return;

    setAddingTechnology(true);
    try {
      const response = await projectDetailsService.addTechnology({
        systemId: project.id,
        technologyId,
        technologyCategoryId: categoryId,
      });

      if (response.success) {
        setTechnologies([...technologies, response.data]);
        // Reset selections after successful add
        setSelectedTechnologyCategory("");
      }
    } catch (error) {
      console.error("Error adding technology:", error);
      setError("Failed to add technology. Please try again.");
    } finally {
      setAddingTechnology(false);
    }
  };

  const handleRemoveTechnology = async (technologyId: number) => {
    if (!project) return;

    try {
      await projectDetailsService.removeTechnology(project.id, technologyId);
      setTechnologies(technologies.filter((t) => t.id !== technologyId));
    } catch (error) {
      console.error("Error removing technology:", error);
      setError("Failed to remove technology. Please try again.");
    }
  };

  if (!project) return null;

  // Helper function to get status color
  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "secondary"; // Under Study
      case 2:
        return "primary"; // Under Development
      case 3:
        return "warning"; // Testing
      case 4:
        return "success"; // Operating
      case 5:
        return "success"; // Production
      default:
        return "default";
    }
  };

  // Helper function to get status text
  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      1: t("projects.underStudy"),
      2: t("projects.underDevelopment"),
      3: t("projects.testing"),
      4: t("projects.operating"),
      5: t("projects.production"),
    };

    return statusMap[status] || t("common.none");
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        wrapper: "z-[1000]",
        backdrop: "z-[999]",
        base: `${language === "ar" ? "rtl" : "ltr"}`,
      }}
      closeButton={true}
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent dir={language === "ar" ? "rtl" : "ltr"}>
        <ModalHeader
          className={`flex flex-col gap-2 pb-4 ${language === "ar" ? "text-right" : "text-left"}`}
        >
          <div
            className={`flex items-start justify-between ${language === "ar" ? "flex-row-reverse" : ""}`}
          >
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {t("projects.projectDetails")}
              </h2>
              <p className="text-lg text-primary font-semibold">
                {project.applicationName}
              </p>
              <div
                className={`flex items-center gap-3 mt-2 ${language === "ar" ? "flex-row-reverse" : ""}`}
              >
                <Chip
                  color={getStatusColor(project.status)}
                  size="sm"
                  variant="flat"
                >
                  {getStatusText(project.status)}
                </Chip>
                <p className="text-sm text-default-500">ID: {project.id}</p>
              </div>
            </div>
          </div>

          {/* Project Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card className="p-3">
              <div className="text-center space-y-1">
                <FileIcon className="mx-auto h-6 w-6 text-primary" />
                <p className="text-xl font-bold text-primary">
                  {attachments.length}
                </p>
                <p className="text-xs text-default-600">
                  {t("projects.attachments")}
                </p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center space-y-1">
                <UserIcon className="mx-auto h-6 w-6 text-success" />
                <p className="text-xl font-bold text-success">
                  {developers.length}
                </p>
                <p className="text-xs text-default-600">
                  {t("projects.teamMembers")}
                </p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center space-y-1">
                <CodeIcon className="mx-auto h-6 w-6 text-warning" />
                <p className="text-xl font-bold text-warning">
                  {technologies.length}
                </p>
                <p className="text-xs text-default-600">
                  {t("projects.technologies")}
                </p>
              </div>
            </Card>
          </div>
        </ModalHeader>

        <ModalBody
          className={`px-6 ${language === "ar" ? "text-right" : "text-left"}`}
        >
          {/* Error Display */}
          {error && (
            <Card className="border-danger mb-4">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircleIcon className="h-5 w-5 text-danger flex-shrink-0" />
                  <div>
                    <p className="text-danger font-medium">
                      {t("common.error")}
                    </p>
                    <p className="text-sm text-default-600">{error}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-4">
                <Spinner color="primary" size="lg" />
                <div>
                  <p className="text-default-600">{t("common.loading")}</p>
                  <p className="text-sm text-default-500">
                    {t("common.pleaseWait")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Tabs
              classNames={{
                base: "w-full",
                tabList: "w-full relative rounded-lg bg-default-100 p-1",
                cursor: "w-full bg-white shadow-small rounded-md",
                tab: "max-w-fit px-4 h-10",
                tabContent:
                  "group-data-[selected=true]:text-primary font-medium",
              }}
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              {/* Project Overview Tab */}
              <Tab
                key="overview"
                title={
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    <span>{t("projects.overview")}</span>
                  </div>
                }
              >
                <div className="space-y-6 py-4">
                  <Card>
                    <CardBody className="p-6 space-y-4">
                      <h3
                        className={`text-lg font-semibold text-foreground ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {t("projects.basicInformation")}
                      </h3>

                      <div
                        className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        <div className="space-y-3">
                          <div>
                            <p
                              className={`text-sm font-medium text-default-700 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {t("projects.applicationName")}
                            </p>
                            <p
                              className={`text-default-600 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {project.applicationName}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium text-default-700 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {t("projects.startDate")}
                            </p>
                            <p
                              className={`text-default-600 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {project.startDate}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium text-default-700 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {t("projects.status")}
                            </p>
                            <div
                              className={`${language === "ar" ? "flex justify-end" : "flex justify-start"}`}
                            >
                              <Chip
                                color={getStatusColor(project.status)}
                                size="sm"
                                variant="flat"
                              >
                                {getStatusText(project.status)}
                              </Chip>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p
                              className={`text-sm font-medium text-default-700 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {t("projects.expectedCompletion")}
                            </p>
                            <p
                              className={`text-default-600 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {project.expectedCompletionDate}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium text-default-700 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              {t("projects.owningUnit")}
                            </p>
                            <p
                              className={`text-default-600 ${language === "ar" ? "text-right" : "text-left"}`}
                            >
                              Unit #{project.owningUnit}
                            </p>
                          </div>
                        </div>
                      </div>

                      {project.description && (
                        <div>
                          <p
                            className={`text-sm font-medium text-default-700 mb-2 ${language === "ar" ? "text-right" : "text-left"}`}
                          >
                            {t("projects.description")}
                          </p>
                          <p
                            className={`text-default-600 bg-default-50 rounded-lg p-3 ${language === "ar" ? "text-right" : "text-left"}`}
                          >
                            {project.description}
                          </p>
                        </div>
                      )}

                      {project.remarks && (
                        <div>
                          <p
                            className={`text-sm font-medium text-default-700 mb-2 ${language === "ar" ? "text-right" : "text-left"}`}
                          >
                            {t("projects.remarks")}
                          </p>
                          <p
                            className={`text-default-600 bg-default-50 rounded-lg p-3 ${language === "ar" ? "text-right" : "text-left"}`}
                          >
                            {project.remarks}
                          </p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              {/* Attachments Tab */}
              <Tab
                key="attachments"
                title={
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    <span>{t("projects.attachments")}</span>
                    {attachments.length > 0 && (
                      <Badge color="primary" size="sm">
                        {attachments.length}
                      </Badge>
                    )}
                  </div>
                }
              >
                <div className="space-y-6 py-4">
                  {/* Upload Form */}
                  <Card>
                    <CardBody className="p-6">
                      <h3
                        className={`text-lg font-semibold text-foreground mb-4 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {t("projects.uploadFile")}
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label={t("projects.fileName")}
                            placeholder={t("projects.fileNamePlaceholder")}
                            value={fileName}
                            variant="bordered"
                            onValueChange={setFileName}
                          />
                          <Input
                            label={t("projects.selectFile")}
                            type="file"
                            variant="bordered"
                            onChange={(e) => {
                              const file = e.target.files?.[0];

                              setSelectedFile(file || null);
                              if (file && !fileName) {
                                setFileName(file.name.split(".")[0]);
                              }
                            }}
                          />
                        </div>

                        <Textarea
                          label={t("projects.fileNote")}
                          minRows={2}
                          placeholder={t("projects.fileNotePlaceholder")}
                          value={fileNote}
                          variant="bordered"
                          onValueChange={setFileNote}
                        />

                        <Button
                          className="w-full md:w-auto"
                          color="primary"
                          isDisabled={!selectedFile || !fileName}
                          isLoading={uploadingFile}
                          startContent={<UploadIcon />}
                          onPress={handleFileUpload}
                        >
                          {t("projects.upload")}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Files List */}
                  <Card>
                    <CardBody className="p-6">
                      <h3
                        className={`text-lg font-semibold text-foreground mb-4 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {t("projects.attachedFiles")} ({attachments.length})
                      </h3>

                      <div className="space-y-3">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className={`flex items-center justify-between p-4 bg-default-50 rounded-lg ${language === "ar" ? "flex-row-reverse" : ""}`}
                            dir={language === "ar" ? "rtl" : "ltr"}
                          >
                            <div
                              className={`flex items-center gap-3 ${language === "ar" ? "flex-row-reverse" : ""}`}
                            >
                              <FileIcon className="h-6 w-6 text-primary flex-shrink-0" />
                              <div
                                className={`${language === "ar" ? "text-right" : "text-left"}`}
                              >
                                <p className="font-medium text-foreground">
                                  {attachment.name}
                                </p>
                                <p className="text-sm text-default-500">
                                  {attachment.fileName}
                                </p>
                                {attachment.note && (
                                  <p className="text-sm text-default-400">
                                    {attachment.note}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div
                              className={`flex items-center gap-2 ${language === "ar" ? "flex-row-reverse" : ""}`}
                            >
                              <Button
                                isIconOnly
                                aria-label={t("projects.downloadFile")}
                                color="primary"
                                size="sm"
                                startContent={<DownloadIcon />}
                                variant="light"
                              />
                              <Button
                                isIconOnly
                                aria-label={t("projects.deleteFile")}
                                color="danger"
                                size="sm"
                                startContent={<DeleteIcon />}
                                variant="light"
                                onPress={() =>
                                  handleDeleteAttachment(attachment.id)
                                }
                              />
                            </div>
                          </div>
                        ))}

                        {attachments.length === 0 && (
                          <div className="text-center py-8">
                            <FileIcon className="mx-auto h-12 w-12 text-default-300 mb-4" />
                            <p className="text-default-400">
                              {t("projects.noFilesUploaded")}
                            </p>
                            <p className="text-sm text-default-300">
                              {t("projects.uploadFirstFile")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              {/* Team Members Tab */}
              <Tab
                key="developers"
                title={
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>{t("projects.teamMembers")}</span>
                    {developers.length > 0 && (
                      <Badge color="success" size="sm">
                        {developers.length}
                      </Badge>
                    )}
                  </div>
                }
              >
                <div className="space-y-6 py-4">
                  {/* Add Developer */}
                  <Card>
                    <CardBody className="p-6">
                      <h3
                        className={`text-lg font-semibold text-foreground mb-4 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {t("projects.addDeveloper")}
                      </h3>

                      <div className="flex gap-3">
                        <Select
                          className="flex-1"
                          isLoading={addingDeveloper}
                          placeholder={t("projects.selectDeveloperPlaceholder")}
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const developerId = Array.from(keys)[0] as string;

                            if (developerId) {
                              handleAddDeveloper(parseInt(developerId));
                            }
                          }}
                        >
                          <SelectItem key="1">أحمد محمد السالم</SelectItem>
                          <SelectItem key="2">سارة علي الحسن</SelectItem>
                          <SelectItem key="3">محمد أحمد الخالد</SelectItem>
                        </Select>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Developers List */}
                  <Card>
                    <CardBody className="p-6">
                      <h3
                        className={`text-lg font-semibold text-foreground mb-4 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {t("projects.currentTeamMembers")} ({developers.length})
                      </h3>

                      <div className="space-y-3">
                        {developers.map((developer) => (
                          <div
                            key={developer.id}
                            className={`flex items-center justify-between p-4 bg-default-50 rounded-lg ${language === "ar" ? "flex-row-reverse" : ""}`}
                            dir={language === "ar" ? "rtl" : "ltr"}
                          >
                            <div
                              className={`flex items-center gap-3 ${language === "ar" ? "flex-row-reverse" : ""}`}
                            >
                              <Avatar
                                name={developer.developerName}
                                size="md"
                              />
                              <div
                                className={`${language === "ar" ? "text-right" : "text-left"}`}
                              >
                                <p className="font-medium text-foreground">
                                  {developer.gradeName}{" "}
                                  {developer.developerName}
                                </p>
                                <p className="text-sm text-default-500">
                                  {developer.rank} • {developer.militaryNumber}
                                </p>
                              </div>
                            </div>
                            <Button
                              isIconOnly
                              aria-label={t("projects.removeDeveloper")}
                              color="danger"
                              size="sm"
                              startContent={<DeleteIcon />}
                              variant="light"
                              onPress={() =>
                                handleRemoveDeveloper(developer.developerId)
                              }
                            />
                          </div>
                        ))}

                        {developers.length === 0 && (
                          <div className="text-center py-8">
                            <UserIcon className="mx-auto h-12 w-12 text-default-300 mb-4" />
                            <p className="text-default-400">
                              {t("projects.noTeamMembersAssigned")}
                            </p>
                            <p className="text-sm text-default-300">
                              {t("projects.addFirstTeamMember")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              {/* Technologies Tab */}
              <Tab
                key="technologies"
                title={
                  <div className="flex items-center gap-2">
                    <CodeIcon className="h-4 w-4" />
                    <span>{t("projects.technologies")}</span>
                    {technologies.length > 0 && (
                      <Badge color="warning" size="sm">
                        {technologies.length}
                      </Badge>
                    )}
                  </div>
                }
              >
                <div className="space-y-6 py-4">
                  {/* Add Technology */}
                  <Card>
                    <CardBody className="p-6">
                      <h3
                        className={`text-lg font-semibold text-foreground mb-4 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {t("projects.addTechnology")}
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            label={t("projects.technologyCategory")}
                            placeholder={t(
                              "projects.technologyCategoryPlaceholder",
                            )}
                            selectedKeys={
                              selectedTechnologyCategory
                                ? [selectedTechnologyCategory]
                                : []
                            }
                            variant="bordered"
                            onSelectionChange={(keys) => {
                              const categoryId = Array.from(keys)[0] as string;

                              setSelectedTechnologyCategory(categoryId);
                            }}
                          >
                            {technologyCategories.map((category) => (
                              <SelectItem key={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </Select>

                          <Select
                            isDisabled={!selectedTechnologyCategory}
                            isLoading={addingTechnology}
                            label={t("projects.selectTechnology")}
                            placeholder={t(
                              "projects.selectTechnologyPlaceholder",
                            )}
                            variant="bordered"
                            onSelectionChange={(keys) => {
                              const techId = Array.from(keys)[0] as string;

                              if (techId) {
                                const tech = technologyItems.find(
                                  (t) => t.id.toString() === techId,
                                );

                                if (tech) {
                                  handleAddTechnology(
                                    tech.id,
                                    tech.technologyCategoryId,
                                  );
                                }
                              }
                            }}
                          >
                            {technologyItems
                              .filter(
                                (tech) =>
                                  !selectedTechnologyCategory ||
                                  tech.technologyCategoryId.toString() ===
                                    selectedTechnologyCategory,
                              )
                              .map((tech) => (
                                <SelectItem key={tech.id.toString()}>
                                  {tech.name}
                                </SelectItem>
                              ))}
                          </Select>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Technologies List */}
                  <Card>
                    <CardBody className="p-6">
                      <h3
                        className={`text-lg font-semibold text-foreground mb-4 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {t("projects.currentTechnologies")} (
                        {technologies.length})
                      </h3>

                      <div className="space-y-3">
                        {technologies.map((technology) => (
                          <div
                            key={technology.id}
                            className={`flex items-center justify-between p-4 bg-default-50 rounded-lg ${language === "ar" ? "flex-row-reverse" : ""}`}
                            dir={language === "ar" ? "rtl" : "ltr"}
                          >
                            <div
                              className={`flex items-center gap-3 ${language === "ar" ? "flex-row-reverse" : ""}`}
                            >
                              <div className="p-2 bg-warning-100 rounded-lg">
                                <CodeIcon className="h-5 w-5 text-warning-600" />
                              </div>
                              <div
                                className={`${language === "ar" ? "text-right" : "text-left"}`}
                              >
                                <p className="font-medium text-foreground">
                                  {technology.technologyName}
                                </p>
                                <div
                                  className={`mt-1 ${language === "ar" ? "flex justify-end" : "flex justify-start"}`}
                                >
                                  <Chip
                                    color="primary"
                                    size="sm"
                                    variant="flat"
                                  >
                                    {technology.categoryName}
                                  </Chip>
                                </div>
                              </div>
                            </div>
                            <Button
                              isIconOnly
                              aria-label={t("projects.removeTechnology")}
                              color="danger"
                              size="sm"
                              startContent={<DeleteIcon />}
                              variant="light"
                              onPress={() =>
                                handleRemoveTechnology(technology.id)
                              }
                            />
                          </div>
                        ))}

                        {technologies.length === 0 && (
                          <div className="text-center py-8">
                            <CodeIcon className="mx-auto h-12 w-12 text-default-300 mb-4" />
                            <p className="text-default-400">
                              {t("projects.noTechnologiesSelected")}
                            </p>
                            <p className="text-sm text-default-300">
                              {t("projects.addFirstTechnology")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>
            </Tabs>
          )}
        </ModalBody>

        <ModalFooter className="px-6 py-4">
          <Button variant="flat" onPress={() => onOpenChange()}>
            {t("common.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
