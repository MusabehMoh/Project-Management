import React, { useState } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress, CircularProgress } from "@heroui/progress";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Badge } from "@heroui/badge";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import UrgentNotifications from "@/components/UrgentNotifications";
import RequirementOverview from "@/components/RequirementOverview";

interface Project {
  id: number;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  progress: number;
  dueDate: string;
  team: string[];
  tasks: Task[];
}

interface Task {
  id: number;
  title: string;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  assignee: string;
  dueDate: string;
}

export default function IndexPage() {
  const { t, language } = useLanguage();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Function to get progress color based on value
  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "success"; // Green for high progress
    if (progress >= 40) return "warning"; // Orange for medium progress

    return "danger"; // Red for low progress
  };

  // Reusable project card component with improved progress indicators
  const renderProjectCard = (project: Project) => {
    return (
      <Card className="mb-3 shadow-sm">
        <CardBody className="p-3">
          <div className="flex justify-between items-start">
            <p className="font-medium">{project.name}</p>
            <CircularProgress
              aria-label={`${project.name} progress: ${project.progress}%`}
              classNames={{
                svg: "w-10 h-10",
                value: "text-xs font-semibold",
              }}
              color={getProgressColor(project.progress)}
              showValueLabel={true}
              size="sm"
              value={project.progress}
            />
          </div>
          <Progress
            aria-label={`${project.name} progress bar`}
            className="w-full mt-2"
            color={getProgressColor(project.progress)}
            isStriped={true}
            radius="md"
            showValueLabel={false}
            size="sm"
            value={project.progress}
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-default-500">{project.dueDate}</p>
            <Button
              className="min-w-0 px-2 text-xs"
              color="primary"
              size="sm"
              variant="flat"
              onPress={() => openProjectDetails(project)}
            >
              {t("dashboard.viewDetails")}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  };

  // Helper function to translate status
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t("status.active");
      case "completed":
        return t("status.completed");
      case "on-hold":
        return t("status.onHold");
      case "in-progress":
        return t("status.inProgress");
      default:
        return status;
    }
  };

  // Helper function to translate priority
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return t("priority.high");
      case "medium":
        return t("priority.medium");
      case "low":
        return t("priority.low");
      default:
        return priority;
    }
  };

  // Sample data
  const projects: Project[] = [
    {
      id: 1,
      name: "Website Redesign",
      description:
        "Complete overhaul of the company website with modern design and improved UX",
      status: "active",
      progress: 75,
      dueDate: "2025-08-25",
      team: ["Alice", "Bob", "Carol"],
      tasks: [
        {
          id: 1,
          title: "Design homepage mockup",
          status: "completed",
          priority: "high",
          assignee: "Alice",
          dueDate: "2025-08-10",
        },
        {
          id: 2,
          title: "Implement responsive navigation",
          status: "in-progress",
          priority: "high",
          assignee: "Bob",
          dueDate: "2025-08-15",
        },
        {
          id: 3,
          title: "Optimize page loading speed",
          status: "todo",
          priority: "medium",
          assignee: "Carol",
          dueDate: "2025-08-20",
        },
      ],
    },
    {
      id: 2,
      name: "Mobile App Development",
      description: "Native mobile application for iOS and Android platforms",
      status: "active",
      progress: 45,
      dueDate: "2025-09-15",
      team: ["David", "Emma", "Frank"],
      tasks: [
        {
          id: 4,
          title: "User authentication flow",
          status: "completed",
          priority: "high",
          assignee: "David",
          dueDate: "2025-08-05",
        },
        {
          id: 5,
          title: "Dashboard implementation",
          status: "in-progress",
          priority: "high",
          assignee: "Emma",
          dueDate: "2025-08-18",
        },
      ],
    },
    {
      id: 3,
      name: "Database Migration",
      description: "Migrate legacy database to new cloud infrastructure",
      status: "on-hold",
      progress: 20,
      dueDate: "2025-10-01",
      team: ["Grace", "Henry"],
      tasks: [
        {
          id: 6,
          title: "Data backup and validation",
          status: "completed",
          priority: "high",
          assignee: "Grace",
          dueDate: "2025-07-30",
        },
        {
          id: 7,
          title: "Schema migration script",
          status: "todo",
          priority: "high",
          assignee: "Henry",
          dueDate: "2025-08-30",
        },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "primary";
      case "on-hold":
        return "warning";
      case "todo":
        return "default";
      case "in-progress":
        return "secondary";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    onOpen();
  };

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

        {/* Projects Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("dashboard.activeProjects")}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="w-full">
                <CardHeader className="flex gap-3">
                  <div className="flex flex-col flex-1">
                    <p className="text-md font-semibold">{project.name}</p>
                    <p className="text-small text-default-500">
                      {project.description}
                    </p>
                  </div>
                  <Chip
                    color={getStatusColor(project.status)}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusText(project.status)}
                  </Chip>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("dashboard.progress")}</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress
                      aria-label={`${t("common.progress")}: ${project.progress}%`}
                      className="w-full"
                      color={getProgressColor(project.progress)}
                      value={project.progress}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-600">
                      {t("dashboard.due")}: {project.dueDate}
                    </span>
                    <AvatarGroup isBordered max={3} size="sm">
                      {project.team.map((member, index) => (
                        <Avatar key={index} name={member} size="sm" />
                      ))}
                    </AvatarGroup>
                  </div>

                  <Badge color="primary" content={project.tasks.length}>
                    <Button fullWidth size="sm" variant="flat">
                      {t("dashboard.tasks")}
                    </Button>
                  </Badge>
                </CardBody>
                <CardFooter>
                  <Button
                    fullWidth
                    color="primary"
                    variant="light"
                    onPress={() => openProjectDetails(project)}
                  >
                    {t("dashboard.viewDetails")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Project Pipeline and Notifications Layout */}
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
                      {projects.filter(p => p.status === "on-hold" || p.status === "todo").length}
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody className="gap-3 p-2 overflow-hidden">
                    <ScrollShadow hideScrollBar className="max-h-64 p-2">
                      {projects
                        .filter(
                          (project) =>
                            project.status === "on-hold" ||
                            project.status === "todo",
                        )
                        .map((project) => (
                          <React.Fragment key={project.id}>
                            {renderProjectCard(project)}
                          </React.Fragment>
                        ))}
                    </ScrollShadow>
                  </CardBody>
                </Card>

                {/* In Progress Stage */}
                <Card className="border-t-4 border-t-warning">
                  <CardHeader className="pb-1">
                    <h3 className="text-lg font-medium text-foreground">{t("pipeline.inProgress")}</h3>
                    <Chip size="sm" color="warning" variant="flat" className={language === "ar" ? "mr-2" : "ml-2"}>
                      {projects.filter(p => p.status === "in-progress" || p.status === "active").length}
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody className="gap-3 p-2 overflow-hidden">
                    <ScrollShadow hideScrollBar className="max-h-64 p-2">
                      {projects
                        .filter(
                          (project) =>
                            project.status === "in-progress" ||
                            project.status === "active",
                        )
                        .map((project) => (
                          <React.Fragment key={project.id}>
                            {renderProjectCard(project)}
                          </React.Fragment>
                        ))}
                    </ScrollShadow>
                  </CardBody>
                </Card>

                {/* Completed Stage */}
                <Card className="border-t-4 border-t-success">
                  <CardHeader className="pb-1">
                    <h3 className="text-lg font-medium text-foreground">{t("pipeline.completed")}</h3>
                    <Chip size="sm" color="success" variant="flat" className={language === "ar" ? "mr-2" : "ml-2"}>
                      {projects.filter(p => p.status === "completed" || p.status === "cancelled").length}
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody className="gap-3 p-2 overflow-hidden">
                    <ScrollShadow hideScrollBar className="max-h-64 p-2">
                      {projects
                        .filter(
                          (project) =>
                            project.status === "completed" ||
                            project.status === "cancelled",
                        )
                        .map((project) => (
                          <React.Fragment key={project.id}>
                            {renderProjectCard(project)}
                          </React.Fragment>
                        ))}
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

      {/* Project Details Modal */}
      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedProject?.name}
                <p className="text-sm text-default-500 font-normal">
                  {selectedProject?.description}
                </p>
              </ModalHeader>
              <ModalBody>
                {selectedProject && (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <Chip
                        color={getStatusColor(selectedProject.status)}
                        variant="flat"
                      >
                        {getStatusText(selectedProject.status)}
                      </Chip>
                      <span className="text-sm text-default-600">
                        {t("dashboard.due")}: {selectedProject.dueDate}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{t("dashboard.progress")}</span>
                        <span>{selectedProject.progress}%</span>
                      </div>
                      <Progress
                        aria-label={`${t("common.progress")}: ${selectedProject.progress}%`}
                        color={getProgressColor(selectedProject.progress)}
                        value={selectedProject.progress}
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">
                        {t("dashboard.teamMembers")}
                      </h4>
                      <AvatarGroup isBordered>
                        {selectedProject.team.map((member, index) => (
                          <Avatar key={index} name={member} />
                        ))}
                      </AvatarGroup>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">
                        {t("dashboard.tasks")}
                      </h4>
                      <Table aria-label="Project tasks">
                        <TableHeader>
                          <TableColumn>{t("dashboard.task")}</TableColumn>
                          <TableColumn>{t("dashboard.assignee")}</TableColumn>
                          <TableColumn>{t("dashboard.status")}</TableColumn>
                          <TableColumn>{t("dashboard.priority")}</TableColumn>
                          <TableColumn>{t("dashboard.dueDate")}</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {selectedProject.tasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>{task.title}</TableCell>
                              <TableCell>{task.assignee}</TableCell>
                              <TableCell>
                                <Chip
                                  color={getStatusColor(task.status)}
                                  size="sm"
                                  variant="flat"
                                >
                                  {getStatusText(task.status)}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  color={getPriorityColor(task.priority)}
                                  size="sm"
                                  variant="dot"
                                >
                                  {getPriorityText(task.priority)}
                                </Chip>
                              </TableCell>
                              <TableCell>{task.dueDate}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t("common.close")}
                </Button>
                <Button color="primary" onPress={onClose}>
                  {t("common.editProject")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}
