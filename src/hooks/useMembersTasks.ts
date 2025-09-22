import { useState, useEffect, useCallback } from "react";

import {
  MemberTask,
  TaskSearchParams,
  TaskFiltersData,
  TaskConfigData,
} from "@/types/membersTasks";
import { Department, MemberSearchResult } from "@/types/timeline";
import { membersTasksService } from "@/services/api/membersTasksService";
import useTeamSearch from "@/hooks/useTeamSearch";

export const mockMemberTasks: MemberTask[] = [
  {
    id: "1",
    name: "Database Schema Design",
    description: "Design and implement the database schema for the project.",
    startDate: "2025-08-01",
    endDate: "2025-08-10",
    progress: 40,
    status: { id: 2, label: "In Progress", color: "primary" },
    priority: { id: 3, label: "High", color: "warning" },
    department: { id: "1", name: "Engineering", color: "#3b82f6" },
    assignedMembers: [
      {
        id: 1,
        userName: "ahmed.hassan",
        militaryNumber: "M001",
        fullName: "Ahmed Hassan",
        gradeName: "Captain",
        statusId: 1,
        department: "Engineering",
      },
    ],
    primaryAssignee: {
      id: 1,
      userName: "ahmed.hassan",
      militaryNumber: "M001",
      fullName: "Ahmed Hassan",
      gradeName: "Captain",
      statusId: 1,
      department: "Engineering",
    },
    memberIds: [1],
    project: { id: "1", name: "E-Commerce Platform" },
    requirement: { id: "1", name: "User Authentication" },
    canRequestDesign: true,
    timeSpent: 12,
    estimatedTime: 20,
    tags: ["Backend", "Database"],
    isOverdue: false,
    createdAt: "2025-07-12",
    updatedAt: "2025-08-02",
  },
  {
    id: "2",
    name: "API Endpoint Development",
    description:
      "Develop REST API endpoints for user management and authentication.",
    startDate: "2025-08-05",
    endDate: "2025-08-20",
    progress: 60,
    status: { id: 2, label: "In Progress", color: "primary" },
    priority: { id: 2, label: "Medium", color: "primary" },
    department: { id: "1", name: "Engineering", color: "#3b82f6" },
    assignedMembers: [
      {
        id: 3,
        userName: "mohammed.ali",
        militaryNumber: "M003",
        fullName: "Mohammed Ali",
        gradeName: "Major",
        statusId: 1,
        department: "Engineering",
      },
    ],
    primaryAssignee: {
      id: 3,
      userName: "mohammed.ali",
      militaryNumber: "M003",
      fullName: "Mohammed Ali",
      gradeName: "Major",
      statusId: 1,
      department: "Engineering",
    },
    memberIds: [3],
    project: { id: "2", name: "Mobile Banking App" },
    requirement: { id: "2", name: "Payment Gateway" },
    canRequestDesign: false,
    timeSpent: 25,
    estimatedTime: 40,
    tags: ["Backend", "Security"],
    isOverdue: false,
    createdAt: "2025-07-15",
    updatedAt: "2025-08-06",
  },
  {
    id: "3",
    name: "Frontend Component Creation",
    description: "Implement reusable frontend components with React.",
    startDate: "2025-08-03",
    endDate: "2025-08-14",
    progress: 80,
    status: { id: 3, label: "Review", color: "warning" },
    priority: { id: 2, label: "Medium", color: "primary" },
    department: { id: "2", name: "Design", color: "#8b5cf6" },
    assignedMembers: [
      {
        id: 2,
        userName: "sara.ahmed",
        militaryNumber: "M002",
        fullName: "Sara Ahmed",
        gradeName: "Lieutenant",
        statusId: 1,
        department: "Design",
      },
    ],
    primaryAssignee: {
      id: 2,
      userName: "sara.ahmed",
      militaryNumber: "M002",
      fullName: "Sara Ahmed",
      gradeName: "Lieutenant",
      statusId: 1,
      department: "Design",
    },
    memberIds: [2],
    project: { id: "1", name: "E-Commerce Platform" },
    requirement: { id: "3", name: "Data Analytics" },
    canRequestDesign: true,
    timeSpent: 15,
    estimatedTime: 18,
    tags: ["Frontend", "UI"],
    isOverdue: true,
    createdAt: "2025-07-14",
    updatedAt: "2025-08-03",
  },
  {
    id: "4",
    name: "User Interface Design",
    description: "Design UI mockups for new dashboard module.",
    startDate: "2025-08-01",
    endDate: "2025-08-07",
    progress: 100,
    status: { id: 4, label: "Completed", color: "success" },
    priority: { id: 1, label: "Low", color: "default" },
    department: { id: "2", name: "Design", color: "#8b5cf6" },
    assignedMembers: [
      {
        id: 2,
        userName: "sara.ahmed",
        militaryNumber: "M002",
        fullName: "Sara Ahmed",
        gradeName: "Lieutenant",
        statusId: 1,
        department: "Design",
      },
    ],
    primaryAssignee: {
      id: 2,
      userName: "sara.ahmed",
      militaryNumber: "M002",
      fullName: "Sara Ahmed",
      gradeName: "Lieutenant",
      statusId: 1,
      department: "Design",
    },
    memberIds: [2],
    project: { id: "3", name: "HR Management System" },
    requirement: { id: "1", name: "User Authentication" },
    canRequestDesign: false,
    timeSpent: 10,
    estimatedTime: 10,
    tags: ["Design", "UX"],
    isOverdue: false,
    createdAt: "2025-07-11",
    updatedAt: "2025-08-01",
  },
  {
    id: "5",
    name: "Payment Integration",
    description: "Integrate payment gateway into mobile app.",
    startDate: "2025-08-02",
    endDate: "2025-08-18",
    progress: 30,
    status: { id: 2, label: "In Progress", color: "primary" },
    priority: { id: 4, label: "Critical", color: "danger" },
    department: { id: "1", name: "Engineering", color: "#3b82f6" },
    assignedMembers: [
      {
        id: 1,
        userName: "ahmed.hassan",
        militaryNumber: "M001",
        fullName: "Ahmed Hassan",
        gradeName: "Captain",
        statusId: 1,
        department: "Engineering",
      },
      {
        id: 3,
        userName: "mohammed.ali",
        militaryNumber: "M003",
        fullName: "Mohammed Ali",
        gradeName: "Major",
        statusId: 1,
        department: "Engineering",
      },
    ],
    primaryAssignee: {
      id: 1,
      userName: "ahmed.hassan",
      militaryNumber: "M001",
      fullName: "Ahmed Hassan",
      gradeName: "Captain",
      statusId: 1,
      department: "Engineering",
    },
    memberIds: [1, 3],
    project: { id: "2", name: "Mobile Banking App" },
    requirement: { id: "2", name: "Payment Gateway" },
    canRequestDesign: true,
    timeSpent: 8,
    estimatedTime: 25,
    tags: ["Backend", "Security", "Payments"],
    isOverdue: false,
    createdAt: "2025-07-20",
    updatedAt: "2025-08-03",
  },
  {
    id: "6",
    name: "Security Audit",
    description:
      "Conduct a full security audit of the system before deployment.",
    startDate: "2025-08-06",
    endDate: "2025-08-15",
    progress: 20,
    status: { id: 1, label: "Not Started", color: "default" },
    priority: { id: 4, label: "Critical", color: "danger" },
    department: { id: "6", name: "Operations", color: "#6366f1" },
    assignedMembers: [
      {
        id: 5,
        userName: "khalid.salem",
        militaryNumber: "M005",
        fullName: "Khalid Salem",
        gradeName: "Captain",
        statusId: 1,
        department: "Sales",
      },
    ],
    primaryAssignee: {
      id: 5,
      userName: "khalid.salem",
      militaryNumber: "M005",
      fullName: "Khalid Salem",
      gradeName: "Captain",
      statusId: 1,
      department: "Sales",
    },
    memberIds: [5],
    project: { id: "3", name: "HR Management System" },
    requirement: { id: "3", name: "Data Analytics" },
    canRequestDesign: false,
    timeSpent: 5,
    estimatedTime: 30,
    tags: ["Security", "Compliance"],
    isOverdue: false,
    createdAt: "2025-07-13",
    updatedAt: "2025-08-06",
  },
  {
    id: "7",
    name: "Performance Optimization",
    description: "Improve database queries and API response times.",
    startDate: "2025-08-04",
    endDate: "2025-08-22",
    progress: 50,
    status: { id: 2, label: "In Progress", color: "primary" },
    priority: { id: 3, label: "High", color: "warning" },
    department: { id: "1", name: "Engineering", color: "#3b82f6" },
    assignedMembers: [
      {
        id: 1,
        userName: "ahmed.hassan",
        militaryNumber: "M001",
        fullName: "Ahmed Hassan",
        gradeName: "Captain",
        statusId: 1,
        department: "Engineering",
      },
      {
        id: 3,
        userName: "mohammed.ali",
        militaryNumber: "M003",
        fullName: "Mohammed Ali",
        gradeName: "Major",
        statusId: 1,
        department: "Engineering",
      },
    ],
    primaryAssignee: {
      id: 3,
      userName: "mohammed.ali",
      militaryNumber: "M003",
      fullName: "Mohammed Ali",
      gradeName: "Major",
      statusId: 1,
      department: "Engineering",
    },
    memberIds: [1, 3],
    project: { id: "1", name: "E-Commerce Platform" },
    requirement: { id: "1", name: "User Authentication" },
    canRequestDesign: true,
    timeSpent: 18,
    estimatedTime: 35,
    tags: ["Backend", "Optimization"],
    isOverdue: false,
    createdAt: "2025-07-12",
    updatedAt: "2025-08-07",
  },
  {
    id: "8",
    name: "Bug Fixes and Testing",
    description: "Fix reported bugs and perform regression testing.",
    startDate: "2025-08-09",
    endDate: "2025-08-19",
    progress: 70,
    status: { id: 3, label: "Review", color: "warning" },
    priority: { id: 2, label: "Medium", color: "primary" },
    department: { id: "6", name: "Operations", color: "#6366f1" },
    assignedMembers: [
      {
        id: 4,
        userName: "fatima.omar",
        militaryNumber: "M004",
        fullName: "Fatima Omar",
        gradeName: "Colonel",
        statusId: 1,
        department: "Marketing",
      },
    ],
    primaryAssignee: {
      id: 4,
      userName: "fatima.omar",
      militaryNumber: "M004",
      fullName: "Fatima Omar",
      gradeName: "Colonel",
      statusId: 1,
      department: "Marketing",
    },
    memberIds: [4],
    project: { id: "2", name: "Mobile Banking App" },
    requirement: { id: "3", name: "Data Analytics" },
    canRequestDesign: true,
    timeSpent: 22,
    estimatedTime: 30,
    tags: ["Testing", "QA"],
    isOverdue: false,
    createdAt: "2025-07-18",
    updatedAt: "2025-08-09",
  },
  {
    id: "9",
    name: "Documentation Writing",
    description: "Prepare technical and user documentation for release.",
    startDate: "2025-08-01",
    endDate: "2025-08-12",
    progress: 90,
    status: { id: 3, label: "Review", color: "warning" },
    priority: { id: 1, label: "Low", color: "default" },
    department: { id: "5", name: "HR", color: "#ef4444" },
    assignedMembers: [
      {
        id: 2,
        userName: "sara.ahmed",
        militaryNumber: "M002",
        fullName: "Sara Ahmed",
        gradeName: "Lieutenant",
        statusId: 1,
        department: "Design",
      },
    ],
    primaryAssignee: {
      id: 2,
      userName: "sara.ahmed",
      militaryNumber: "M002",
      fullName: "Sara Ahmed",
      gradeName: "Lieutenant",
      statusId: 1,
      department: "Design",
    },
    memberIds: [2],
    project: { id: "3", name: "HR Management System" },
    requirement: { id: "2", name: "Payment Gateway" },
    canRequestDesign: false,
    timeSpent: 12,
    estimatedTime: 15,
    tags: ["Documentation", "Knowledge Base"],
    isOverdue: false,
    createdAt: "2025-07-10",
    updatedAt: "2025-08-01",
  },
  {
    id: "10",
    name: "Code Review",
    description:
      "Review submitted code for best practices and coding standards.",
    startDate: "2025-08-05",
    endDate: "2025-08-11",
    progress: 100,
    status: { id: 4, label: "Completed", color: "success" },
    priority: { id: 2, label: "Medium", color: "primary" },
    department: { id: "1", name: "Engineering", color: "#3b82f6" },
    assignedMembers: [
      {
        id: 1,
        userName: "ahmed.hassan",
        militaryNumber: "M001",
        fullName: "Ahmed Hassan",
        gradeName: "Captain",
        statusId: 1,
        department: "Engineering",
      },
      {
        id: 2,
        userName: "sara.ahmed",
        militaryNumber: "M002",
        fullName: "Sara Ahmed",
        gradeName: "Lieutenant",
        statusId: 1,
        department: "Design",
      },
    ],
    primaryAssignee: {
      id: 1,
      userName: "ahmed.hassan",
      militaryNumber: "M001",
      fullName: "Ahmed Hassan",
      gradeName: "Captain",
      statusId: 1,
      department: "Engineering",
    },
    memberIds: [1, 2],
    project: { id: "1", name: "E-Commerce Platform" },
    requirement: { id: "1", name: "User Authentication" },
    canRequestDesign: false,
    timeSpent: 10,
    estimatedTime: 10,
    tags: ["Code Quality", "Review"],
    isOverdue: false,
    createdAt: "2025-07-14",
    updatedAt: "2025-08-05",
  },
];

interface UseMembersTasksResult {
  tasks: MemberTask[];
  tasksConfigData: TaskConfigData;
  loading: boolean;
  error: string | null;

  totalPages: number;
  totalCount: number;
  fetchTasks: (params?: TaskSearchParams) => Promise<void>;
  refreshTasks: () => Promise<void>;
  exportTasks: (format: "csv" | "pdf" | "excel") => Promise<void>;
  requestDesign: (id: string, notes: string) => Promise<boolean>;
  changeStatus: (id: string, typeId: string, notes: string) => Promise<boolean>;
  tasksConfig: () => Promise<void>;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (limit: number) => void;
  handleProjectChange: (id: number) => void;
  handleSearchChange: (search: string) => void;
  handlePriorityChange: (priorityId: number) => void;
  handleStatusChange: (statusId: number) => void;
  taskParametersRequest: TaskSearchParams;
}

export const useMembersTasks = (): UseMembersTasksResult => {
  const [tasks, setTasks] = useState<MemberTask[]>([]);
  const [tasksConfigData, setTasksConfigData] = useState<TaskConfigData>({
    totalTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    taskStatus: [],
    taskPriority: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [taskParametersRequest, setTaskParametersRequest] =
    useState<TaskSearchParams>({
      limit: 20,
      page: 1,
    });

  ///TODO ////////////// pls append pagination first

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      page: page,
    }));
  }, []);

  /**
   * Handle page size change
   */
  const handlePageSizeChange = useCallback((limit: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      page: 1,
      limit,
    }));
    console.log("Page size changed to:", limit);
  }, []);

  /**
   * Handle project change
   */
  const handleProjectChange = useCallback((id: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      projectId: id,
    }));
  }, []);

  /**
   * Handle search change
   */
  const handleSearchChange = useCallback((search: string) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      search,
    }));
  }, []);

  /**
   * Handle status change
   */
  const handleStatusChange = useCallback((statusId: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      statusId: statusId,
    }));
  }, []);

  /**
   * Handle priority change
   */
  const handlePriorityChange = useCallback((priorityId: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      priorityId: priorityId,
    }));
  }, []);

  /// get tasks config
  const tasksConfig = async (): Promise<void> => {
    try {
      const response = await membersTasksService.getCurrentTasksConfig();

      if (response.success) {
        setTasksConfigData(response.data);
      }
      console.log("---->> response is : 2");
      console.log(response.data);
    } catch (e) {
      console.log("---->> catch triggered");
    } finally {
    }
  };

  ///request design
  const requestDesign = async (id: string, notes: string): Promise<boolean> => {
    try {
      const response = await membersTasksService.requestDesign(id, notes);

      return response.success;
    } catch (err) {
      return false;
    } finally {
    }
  };

  ///change status
  const changeStatus = async (
    id: string,
    typeId: string,
    notes: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await membersTasksService.changeStatus(
        id,
        typeId,
        notes
      );

      //addToast({
      //   title: "Success",
      //   description: "Requirement created successfully",
      //   color: "success",
      // });

      return response.success;
    } catch (err) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = useCallback(
    async (request?: TaskSearchParams, reloadConfigApi?: boolean) => {
      console.log("fetchTasks called with:", request);
      setLoading(true);
      setError(null);

      try {
        if (reloadConfigApi) {
          await tasksConfig();
        }
        const response = await membersTasksService.getTasks(request);

        if (response.success && response.data) {
          console.log("API response success:", response.data);
          setTasks(response.data.tasks);
          setTotalPages(response.data.totalPages);
          setTotalCount(response.data.totalCount);
          // ✅ only update if it's actually different
          // if (response.data.currentPage !== taskParametersRequest.page) {
          //   setTaskParametersRequest((prev) => ({
          //     ...prev,
          //     page: response.data.currentPage,
          //   }));
          // }
        } else {
          throw new Error(response.message || "Failed to fetch tasks");
        }
      } catch (err) {
        console.warn("API not available, using mock data:", err);

        console.log("Setting tasks inside catch:");

        let tasks = mockMemberTasks; // start with all tasks

        // Apply filters step by step
        if (request?.search) {
          const search = request.search.toLowerCase();
          tasks = tasks.filter((task) =>
            task.name.toLowerCase().includes(search)
          );
        }

        if (request?.statusId) {
          tasks = tasks.filter((task) => task.status.id === request.statusId);
        }

        if (request?.projectId) {
          tasks = tasks.filter(
            (task) => task.project.id === request.projectId?.toString()
          );
        }

        if (request?.priorityId) {
          tasks = tasks.filter(
            (task) => task.priority.id === request.priorityId!
          );
        }

        // Apply pagination (slice after filtering)
        const limit = request?.limit ?? 20;
        tasks = tasks.slice(0, limit);

        setTasks(tasks);

        setTotalPages(Math.ceil(mockMemberTasks.length / request!.limit!));
        setTotalCount(mockMemberTasks.length);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshTasks = useCallback(() => {
    return fetchTasks(taskParametersRequest, true);
  }, [fetchTasks]);

  const exportTasks = useCallback(async (format: "csv" | "pdf" | "xlsx") => {
    try {
      const blob = await membersTasksService.exportTasks(format);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `members-tasks-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting tasks:", err);
      throw err;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    // Initial load without dependencies to avoid loops
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        await tasksConfig();
        const response = await membersTasksService.getTasks();

        if (response.success && response.data) {
          setTasks(response.data.tasks);
          setTotalPages(response.data.totalPages);
          //handlePageChange(response.data.currentPage);
          setTotalCount(response.data.totalCount);
        } else {
          throw new Error(response.message || "Failed to fetch tasks");
        }
      } catch (err) {
        // Fallback to mock data when API is not available

  setTasks(mockMemberTasks);
  setTotalPages(Math.ceil(mockMemberTasks.length / 10));
        //handlePageChange(1);
        setTotalCount(mockMemberTasks.length);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    console.log("taskParametersRequest changed:", taskParametersRequest);
    fetchTasks(taskParametersRequest, false);
  }, [taskParametersRequest]);

  return {
    tasks,
    tasksConfigData,
    loading,
    error,
    totalPages,
    totalCount,
    fetchTasks,
    handlePageChange,
    handlePageSizeChange,
    handlePriorityChange,
    handleSearchChange,
    handleProjectChange,
    handleStatusChange,
    taskParametersRequest,
    refreshTasks,
    exportTasks,
    changeStatus,
    requestDesign,
    tasksConfig,
  };
};
