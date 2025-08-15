import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Avatar } from "@heroui/avatar";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Spinner } from "@heroui/spinner";
import { Pagination } from "@heroui/react";
import { Tooltip } from "@heroui/tooltip";
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
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { parseDate } from "@internationalized/date";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { PlusIcon, EditIcon, DeleteIcon, MoreVerticalIcon, CalendarIcon } from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useProjects } from "@/hooks/useProjects";
import { Project, ProjectFormData, User } from "@/types/project";

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // Use the projects hook for data management
  const {
    projects,
    users,
    owningUnits,
    stats,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    filterUsers,
    refreshData,
    clearError,
    // Pagination
    currentPage,
    totalPages,
    totalProjects,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useProjects();

  // Initialize search results when users are loaded
  useEffect(() => {
    if (users.length > 0) {
      // Initialize with empty search to show all users initially
      handleOwnerSearch("");
      handleAlternativeOwnerSearch("");
    }
  }, [users]);

  // Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (event.key === 'ArrowLeft' && event.ctrlKey && currentPage > 1) {
        event.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (event.key === 'ArrowRight' && event.ctrlKey && currentPage < totalPages) {
        event.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (event.key === 'Home' && event.ctrlKey && currentPage > 1) {
        event.preventDefault();
        handlePageChange(1);
      } else if (event.key === 'End' && event.ctrlKey && currentPage < totalPages) {
        event.preventDefault();
        handlePageChange(totalPages);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, handlePageChange]);

  // Search functionality for users - matching users tab pattern
  const [ownerSearchValue, setOwnerSearchValue] = useState("");
  const [alternativeOwnerSearchValue, setAlternativeOwnerSearchValue] = useState("");
  const [ownerSearchResults, setOwnerSearchResults] = useState<User[]>([]);
  const [alternativeOwnerSearchResults, setAlternativeOwnerSearchResults] = useState<User[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [selectedAlternativeOwner, setSelectedAlternativeOwner] = useState<User | null>(null);

  // Handle owner search - matching users tab pattern
  const handleOwnerSearch = async (value: string) => {
    setOwnerSearchValue(value);
    
    // Filter users based on search value
    try {
      const results = filterUsers(value);
      setOwnerSearchResults(results);
    } catch (error) {
      console.error("Error searching owner:", error);
      setOwnerSearchResults([]);
    }
  };

  // Handle alternative owner search - matching users tab pattern  
  const handleAlternativeOwnerSearch = async (value: string) => {
    setAlternativeOwnerSearchValue(value);
    
    // Filter users based on search value
    try {
      const results = filterUsers(value);
      setAlternativeOwnerSearchResults(results);
    } catch (error) {
      console.error("Error searching alternative owner:", error);
      setAlternativeOwnerSearchResults([]);
    }
  };

  // Handle owner selection
  const handleOwnerSelect = (user: User) => {
    setSelectedOwner(user);
    setOwnerSearchValue(user.name);
    setFormData({ ...formData, projectOwner: user.name });
  };

  // Handle alternative owner selection
  const handleAlternativeOwnerSelect = (user: User) => {
    setSelectedAlternativeOwner(user);
    setAlternativeOwnerSearchValue(user.name);
    setFormData({ ...formData, alternativeOwner: user.name });
  };

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    applicationName: "",
    projectOwner: "",
    alternativeOwner: "",
    owningUnit: "",
    startDate: null,
    expectedCompletionDate: null,
    description: "",
    remarks: "",
    status: "planning",
  });

  const statusOptions = [
    { key: "planning", label: "Planning" },
    { key: "active", label: "Active" },
    { key: "on-hold", label: "On Hold" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "primary";
      case "on-hold":
        return "warning";
      case "planning":
        return "secondary";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "planning":
        return "Planning";
      case "active":
        return "Active";
      case "on-hold":
        return "On Hold";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const handleAddProject = () => {
    setIsEditing(false);
    setSelectedProject(null);
    setOwnerSearchValue("");
    setAlternativeOwnerSearchValue("");
    setOwnerSearchResults([]);
    setAlternativeOwnerSearchResults([]);
    setSelectedOwner(null);
    setSelectedAlternativeOwner(null);
    setFormData({
      applicationName: "",
      projectOwner: "",
      alternativeOwner: "",
      owningUnit: "",
      startDate: null,
      expectedCompletionDate: null,
      description: "",
      remarks: "",
      status: "planning",
    });
    onOpen();
  };

  const handleEditProject = (project: Project) => {
    setIsEditing(true);
    setSelectedProject(project);
    setOwnerSearchValue(project.projectOwner);
    setAlternativeOwnerSearchValue(project.alternativeOwner);
    
    // Initialize search results for editing
    const ownerResults = filterUsers(project.projectOwner);
    const altOwnerResults = filterUsers(project.alternativeOwner);
    setOwnerSearchResults(ownerResults);
    setAlternativeOwnerSearchResults(altOwnerResults);
    
    // Set selected users for editing
    setSelectedOwner(ownerResults.find(u => u.name === project.projectOwner) || null);
    setSelectedAlternativeOwner(altOwnerResults.find(u => u.name === project.alternativeOwner) || null);
    
    setFormData({
      applicationName: project.applicationName,
      projectOwner: project.projectOwner,
      alternativeOwner: project.alternativeOwner,
      owningUnit: project.owningUnit,
      startDate: parseDate(project.startDate),
      expectedCompletionDate: parseDate(project.expectedCompletionDate),
      description: project.description,
      remarks: project.remarks,
      status: project.status,
    });
    onOpen();
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        const success = await deleteProject(projectToDelete.id);
        if (success) {
          console.log("Project deleted successfully");
          // If we're on the last page and it becomes empty, go to previous page
          const remainingOnPage = projects.length - 1;
          if (remainingOnPage === 0 && currentPage > 1) {
            handlePageChange(currentPage - 1);
          } else {
            // Refresh current page
            handlePageChange(currentPage);
          }
        }
        setProjectToDelete(null);
        onDeleteOpenChange();
      } catch (err) {
        console.error("Error deleting project:", err);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (isEditing && selectedProject) {
        // Edit existing project
        const updateData = {
          id: selectedProject.id,
          ...formData,
          startDate: formData.startDate?.toString() || "",
          expectedCompletionDate: formData.expectedCompletionDate?.toString() || "",
          status: formData.status as Project["status"],
        };
        
        const updatedProject = await updateProject(updateData);
        if (updatedProject) {
          console.log("Project updated successfully");
          // Stay on current page after update
          handlePageChange(currentPage);
        }
      } else {
        // Add new project
        const createData = {
          ...formData,
          startDate: formData.startDate?.toString() || "",
          expectedCompletionDate: formData.expectedCompletionDate?.toString() || "",
          status: formData.status as Project["status"],
        };
        
        const newProject = await createProject(createData);
        if (newProject) {
          console.log("Project created successfully");
          // Go to first page to see the new project (assuming newest first)
          handlePageChange(1);
        }
      }
      onOpenChange();
    } catch (err) {
      console.error("Error saving project:", err);
    }
  };



  return (
    <DefaultLayout>
      <div className={`space-y-8 ${language === "ar" ? "rtl" : "ltr"}`}>
        {/* Error Display */}
        {error && (
          <Card className="border-danger">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="text-danger">⚠️</div>
                <div>
                  <p className="text-danger font-medium">Error Loading Projects</p>
                  <p className="text-sm text-default-600">{error}</p>
                  <Button 
                    size="sm" 
                    color="danger" 
                    variant="light" 
                    className="mt-2"
                    onPress={() => {
                      clearError();
                      refreshData();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {t("projects.title")}
          </h1>
          <p className="text-lg text-default-600">
            {t("projects.subtitle")}
          </p>

          <div className="flex gap-4 justify-center">
            <Button 
              color="primary" 
              size="lg" 
              startContent={<PlusIcon />} 
              onPress={handleAddProject}
              isDisabled={loading}
            >
              {t("projects.newProject")}
            </Button>
            <Button variant="bordered" size="lg" isDisabled={loading}>
              {t("projects.importProjects")}
            </Button>
            <Button variant="bordered" size="lg">
              {t("projects.exportData")}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-default-600">{t("projects.totalProjects")}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-success">{stats.active}</p>
              <p className="text-sm text-default-600">{t("projects.active")}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-secondary">{stats.planning}</p>
              <p className="text-sm text-default-600">{t("projects.planning")}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-warning">{stats.onHold}</p>
              <p className="text-sm text-default-600">{t("projects.onHold")}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-primary">{stats.completed}</p>
              <p className="text-sm text-default-600">{t("projects.completed")}</p>
            </div>
          </Card>
        </div>

        {/* Projects Table */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("projects.allProjects")}
            </h2>
            
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-default-600">{t("common.show")}:</span>
              <Select
                size="sm"
                className="w-20"
                selectedKeys={[pageSize.toString()]}
                onSelectionChange={(keys) => {
                  const newSize = parseInt(Array.from(keys)[0] as string);
                  handlePageSizeChange(newSize);
                }}
              >
                <SelectItem key="5">5</SelectItem>
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="20">20</SelectItem>
                <SelectItem key="50">50</SelectItem>
                <SelectItem key="100">100</SelectItem>
              </Select>
              <span className="text-sm text-default-600">{t("pagination.perPage")}</span>
            </div>
          </div>

          {/* Results info */}
          {!loading && (
            <div className="text-sm text-default-600">
              {t("pagination.showing")} {((currentPage - 1) * pageSize) + 1} {t("pagination.to")} {Math.min(currentPage * pageSize, totalProjects)} {t("pagination.of")} {totalProjects} {t("projects.totalProjects").toLowerCase()}
            </div>
          )}

          <Card>
            <CardBody className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    <Spinner size="lg" color="primary" />
                    <div>
                      <p className="text-default-600">{t("common.loading")}</p>
                      <p className="text-sm text-default-500">
                        {currentPage > 1 ? t("pagination.loadingPage").replace("{page}", currentPage.toString()) : t("common.pleaseWait")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">📋</div>
                    <div>
                      <p className="text-lg text-default-600">{t("projects.noProjectsFound") || "No projects found"}</p>
                      <p className="text-sm text-default-500">
                        {totalProjects > 0 
                          ? t("projects.noProjectsOnPage") || `No projects on page ${currentPage}. Try a different page.`
                          : t("projects.startFirstProject") || 'Start by creating your first project.'
                        }
                      </p>
                    </div>
                    <Button 
                      color="primary" 
                      onPress={handleAddProject}
                      startContent={<PlusIcon />}
                    >
                      {t("projects.newProject")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Table aria-label="Projects table">
                  <TableHeader>
                    <TableColumn className="min-w-[200px]">{t("projects.applicationName")}</TableColumn>
                    <TableColumn className="min-w-[150px]">{t("projects.projectOwner")}</TableColumn>
                    <TableColumn className="min-w-[150px]">{t("projects.alternativeOwner")}</TableColumn>
                    <TableColumn className="min-w-[120px]">{t("projects.owningUnit")}</TableColumn>
                    <TableColumn className="min-w-[110px]">{t("projects.startDate")}</TableColumn>
                    <TableColumn className="min-w-[120px]">{t("projects.expectedCompletion")}</TableColumn>
                    <TableColumn className="min-w-[100px]">{t("projects.status")}</TableColumn>
                    <TableColumn className="min-w-[80px]">{t("projects.actions")}</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="font-semibold">{project.applicationName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={project.projectOwner} size="sm" />
                          <span>{project.projectOwner}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={project.alternativeOwner} size="sm" />
                          <span>{project.alternativeOwner}</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.owningUnit}</TableCell>
                      <TableCell>{project.startDate}</TableCell>
                      <TableCell>{project.expectedCompletionDate}</TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(project.status)}
                          variant="flat"
                          size="sm"
                        >
                          {getStatusText(project.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly variant="light" size="sm">
                              <MoreVerticalIcon />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Project actions">
                            <DropdownItem
                              key="timeline"
                              startContent={<CalendarIcon />}
                              onPress={() => {
                                // Navigate to timeline with project ID
                                window.location.href = `/timeline?projectId=${project.id}`;
                              }}
                            >
                              View Timeline
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={<EditIcon />}
                              onPress={() => handleEditProject(project)}
                            >
                              {t("projects.editProject")}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<DeleteIcon />}
                              onPress={() => handleDeleteProject(project)}
                            >
                              {t("projects.deleteProject")}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardBody>
          </Card>

          {/* Pagination */}
          <div className="flex justify-center py-6">
            <GlobalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalProjects}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              isLoading={loading}
              showInfo={true}
              className="w-full max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Project Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {isEditing ? t("projects.editProject") : t("projects.addProject")}
                <p className="text-sm text-default-500 font-normal">
                  {isEditing
                    ? t("projects.updateProjectInfo")
                    : t("projects.fillProjectDetails")}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t("projects.applicationName")}
                    placeholder={t("projects.applicationName")}
                    value={formData.applicationName}
                    onChange={(e) =>
                      setFormData({ ...formData, applicationName: e.target.value })
                    }
                    isRequired
                  />
                  <Autocomplete
                    label={t("projects.projectOwner")}
                    placeholder={t("projects.searchByName")}
                    inputValue={ownerSearchValue}
                    onInputChange={handleOwnerSearch}
                    selectedKey={selectedOwner?.id.toString()}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedUser = ownerSearchResults.find(u => u.id.toString() === key);
                        if (selectedUser) {
                          handleOwnerSelect(selectedUser);
                        }
                      }
                    }}
                    isRequired
                    isClearable
                    menuTrigger="input"
                  >
                    {ownerSearchResults.map((user) => (
                      <AutocompleteItem 
                        key={user.id.toString()}
                        value={user.id.toString()}
                        textValue={`${user.name} (${user.militaryNumber})`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name || 'Unknown'} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name || 'Unknown User'}</span>
                            <span className="text-sm text-default-500">
                              {user.militaryNumber || 'N/A'} | @{user.username || 'unknown'}
                            </span>
                            <span className="text-xs text-default-400">
                              {user.rank || 'N/A'} - {user.department || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                  <Autocomplete
                    label={t("projects.alternativeOwner")}
                    placeholder={t("projects.searchByName")}
                    inputValue={alternativeOwnerSearchValue}
                    onInputChange={handleAlternativeOwnerSearch}
                    selectedKey={selectedAlternativeOwner?.id.toString()}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedUser = alternativeOwnerSearchResults.find(u => u.id.toString() === key);
                        if (selectedUser) {
                          handleAlternativeOwnerSelect(selectedUser);
                        }
                      }
                    }}
                    isClearable
                    menuTrigger="input"
                  >
                    {alternativeOwnerSearchResults.map((user) => (
                      <AutocompleteItem 
                        key={user.id.toString()}
                        value={user.id.toString()}
                        textValue={`${user.name} (${user.militaryNumber})`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name || 'Unknown'} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name || 'Unknown User'}</span>
                            <span className="text-sm text-default-500">
                              {user.militaryNumber || 'N/A'} | @{user.username || 'unknown'}
                            </span>
                            <span className="text-xs text-default-400">
                              {user.rank || 'N/A'} - {user.department || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                  <Select
                    label={t("projects.owningUnit")}
                    placeholder={t("projects.owningUnit")}
                    selectedKeys={formData.owningUnit ? [formData.owningUnit] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData({ ...formData, owningUnit: selected || "" });
                    }}
                    isRequired
                  >
                    {owningUnits.map((unit) => (
                      <SelectItem 
                        key={unit.name} 
                        value={unit.name}
                        textValue={unit.name}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{unit.name}</span>
                          <span className="text-sm text-default-500">
                            {unit.code} {unit.commander ? `• ${unit.commander}` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  <DatePicker
                    label={t("projects.startDate")}
                    value={formData.startDate}
                    onChange={(date) =>
                      setFormData({ ...formData, startDate: date })
                    }
                    isRequired
                  />
                  <DatePicker
                    label={t("projects.expectedCompletion")}
                    value={formData.expectedCompletionDate}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        expectedCompletionDate: date,
                      })
                    }
                    isRequired
                  />
                  <div className="md:col-span-2">
                    <Input
                      label={t("projects.description")}
                      placeholder={t("projects.description")}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      isRequired
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label={t("projects.remarks")}
                      placeholder={t("projects.remarks")}
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                    />
                  </div>
                  <Select
                    label={t("projects.status")}
                    placeholder={t("projects.status")}
                    selectedKeys={formData.status ? [formData.status] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData({ ...formData, status: selected || "planning" });
                    }}
                    isRequired
                  >
                    {statusOptions.map((status) => (
                      <SelectItem key={status.key}>
                        {t(`projectStatus.${status.key}`)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={loading}
                  isDisabled={
                    loading ||
                    !formData.applicationName ||
                    !formData.projectOwner ||
                    !formData.owningUnit ||
                    !formData.startDate ||
                    !formData.expectedCompletionDate ||
                    !formData.description
                  }
                >
                  {isEditing ? t("projects.updateProject") : t("projects.addProject")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("projects.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p>
                  {t("projects.deleteConfirmMessage")} "
                  <strong>{projectToDelete?.applicationName}</strong>"? {t("projects.actionCannotBeUndone")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose} isDisabled={loading}>
                  {t("common.cancel")}
                </Button>
                <Button 
                  color="danger" 
                  onPress={confirmDelete}
                  isLoading={loading}
                  isDisabled={loading}
                >
                  {t("projects.deleteProject")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}
