import { useState, useEffect, useCallback } from "react";
import {
  MemberTask,
  TaskSearchParams,
  TasksResponse,
  TaskFiltersData,
} from "@/types/membersTasks";
import { Department, MemberSearchResult } from "@/types/timeline";
import { membersTasksService } from "@/services/api/membersTasksService";
import useTeamSearch from "@/hooks/useTeamSearch";

// Mock data generator for fallback
const generateMockTasks = (): MemberTask[] => {
  const statuses = [
    { id: 1, label: "Not Started", color: "default" },
    { id: 2, label: "In Progress", color: "primary" },
    { id: 3, label: "Review", color: "warning" },
    { id: 4, label: "Completed", color: "success" },
    { id: 5, label: "Blocked", color: "danger" },
  ];

  const priorities = [
    { id: 1, label: "Low", color: "default" },
    { id: 2, label: "Medium", color: "primary" },
    { id: 3, label: "High", color: "warning" },
    { id: 4, label: "Critical", color: "danger" },
  ];

  const departments = [
    { id: "1", name: "Engineering", color: "#3b82f6" },
    { id: "2", name: "Design", color: "#8b5cf6" },
    { id: "3", name: "Marketing", color: "#10b981" },
    { id: "4", name: "Sales", color: "#f59e0b" },
    { id: "5", name: "HR", color: "#ef4444" },
    { id: "6", name: "Operations", color: "#6366f1" },
  ];

  const employees = [
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
    {
      id: 3,
      userName: "mohammed.ali",
      militaryNumber: "M003",
      fullName: "Mohammed Ali",
      gradeName: "Major",
      statusId: 1,
      department: "Engineering",
    },
    {
      id: 4,
      userName: "fatima.omar",
      militaryNumber: "M004",
      fullName: "Fatima Omar",
      gradeName: "Colonel",
      statusId: 1,
      department: "Marketing",
    },
    {
      id: 5,
      userName: "khalid.salem",
      militaryNumber: "M005",
      fullName: "Khalid Salem",
      gradeName: "Captain",
      statusId: 1,
      department: "Sales",
    },
  ];

  const projects = [
    { id: "1", name: "E-Commerce Platform" },
    { id: "2", name: "Mobile Banking App" },
    { id: "3", name: "HR Management System" },
  ];

  const requirements = [
    { id: "1", name: "User Authentication" },
    { id: "2", name: "Payment Gateway" },
    { id: "3", name: "Data Analytics" },
  ];

  const taskNames = [
    "Database Schema Design",
    "API Endpoint Development",
    "Frontend Component Creation",
    "User Interface Design",
    "Payment Integration",
    "Security Audit",
    "Performance Optimization",
    "Bug Fixes and Testing",
    "Documentation Writing",
    "Code Review",
  ];

  const tags = [
    "Backend",
    "Frontend",
    "Database",
    "Security",
    "Testing",
    "Performance",
  ];

  const tasks: MemberTask[] = [];

  for (let i = 1; i <= 20; i++) {
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    const endDate = new Date(startDate);

    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 14) + 3);

    const isOverdue = Math.random() < 0.2 && endDate < new Date();
    const progress = Math.floor(Math.random() * 101);

    const department =
      departments[Math.floor(Math.random() * departments.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const project = projects[Math.floor(Math.random() * projects.length)];
    const requirement =
      requirements[Math.floor(Math.random() * requirements.length)];

    // Assign 1-3 members to each task
    const numAssignees = Math.random() < 0.6 ? 1 : Math.random() < 0.9 ? 2 : 3;
    const shuffledEmployees = [...employees].sort(() => Math.random() - 0.5);
    const assignedMembers = shuffledEmployees.slice(0, numAssignees);
    const primaryAssignee = assignedMembers[0];

    const taskTagCount = Math.floor(Math.random() * 3) + 1;
    const taskTags = [...tags]
      .sort(() => Math.random() - 0.5)
      .slice(0, taskTagCount);

    const timeSpent = Math.floor(Math.random() * 20) + 1;
    const estimatedTime = timeSpent + Math.floor(Math.random() * 10) + 5;

    tasks.push({
      id: i.toString(),
      name: taskNames[Math.floor(Math.random() * taskNames.length)],
      description: `Detailed description for task ${i}. This task involves implementing specific functionality.`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      progress,
      status,
      priority,
      department,
      assignedMembers,
      primaryAssignee,
      memberIds: assignedMembers.map((m) => m.id),
      project,
      requirement,
      timeSpent,
      estimatedTime,
      tags: taskTags,
      isOverdue,
      createdAt: new Date(
        startDate.getTime() - Math.random() * 86400000,
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return tasks;
};

interface UseMembersTasksResult {
  tasks: MemberTask[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalCount: number;
  departments: Department[];
  allEmployees: MemberSearchResult[];
  filters: TaskSearchParams;
  setFilters: (filters: TaskSearchParams) => void;
  fetchTasks: (params?: TaskSearchParams) => Promise<void>;
  refreshTasks: () => Promise<void>;
  exportTasks: (format: "csv" | "pdf" | "excel") => Promise<void>;
  searchEmployees: (query: string) => void;
  filtersData: TaskFiltersData;
}

export const useMembersTasks = (
  initialDepartments: Department[] = [],
): UseMembersTasksResult => {
  const [tasks, setTasks] = useState<MemberTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<TaskSearchParams>({
    page: 1,
    limit: 20,
    memberFilterMode: "any",
    sortBy: "startDate",
    sortOrder: "asc",
  });
  const [filtersData, setFiltersData] = useState<TaskFiltersData>({
    statuses: [],
    priorities: [],
    departments: initialDepartments,
    members: [],
  });

  // Use existing employee search for member filtering
  const {
    employees: allEmployees,
    loading: employeeSearchLoading,
    searchEmployees,
  } = useTeamSearch({
    minLength: 0,
    maxResults: 200,
    loadInitialResults: true,
  });

  const fetchTasks = useCallback(
    async (params?: TaskSearchParams) => {
      console.log("fetchTasks called with:", params);
      console.log("current filters:", filters);
      setLoading(true);
      setError(null);

      const searchParams = { ...filters, ...params };

      console.log("searchParams:", searchParams);

      try {
        const response = await membersTasksService.getTasks(searchParams);

        if (response.success && response.data) {
          console.log("API response success:", response.data);
          setTasks(response.data.tasks);
          setTotalPages(response.data.totalPages);
          setCurrentPage(response.data.currentPage);
          setTotalCount(response.data.totalCount);
        } else {
          throw new Error(response.message || "Failed to fetch tasks");
        }

        if (params) {
          setFilters(searchParams);
        }
      } catch (err) {
        console.warn("API not available, using mock data:", err);
        // Fallback to mock data when API is not available
        const mockTasks = generateMockTasks();

        console.log("Generated mock tasks:", mockTasks.length, mockTasks);
        const limit = searchParams.limit || 20;
        const page = searchParams.page || 1;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const slicedTasks = mockTasks.slice(startIndex, endIndex);

        console.log("Setting tasks:", slicedTasks.length, slicedTasks);
        setTasks(slicedTasks);
        setTotalPages(Math.ceil(mockTasks.length / limit));
        setCurrentPage(page);
        setTotalCount(mockTasks.length);

        if (params) {
          setFilters(searchParams);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  const fetchFiltersData = useCallback(async () => {
    try {
      const response = await membersTasksService.getFiltersData();

      if (response.success && response.data) {
        setFiltersData((prev) => ({
          ...response.data,
          departments:
            initialDepartments.length > 0
              ? initialDepartments
              : response.data.departments,
        }));
      }
    } catch (err) {
      console.error("Error fetching filter data:", err);
      // Set fallback filter data
      setFiltersData((prev) => ({
        ...prev,
        departments:
          initialDepartments.length > 0 ? initialDepartments : prev.departments,
      }));
    }
  }, [initialDepartments]);

  const refreshTasks = useCallback(() => {
    return fetchTasks();
  }, [fetchTasks]);

  const exportTasks = useCallback(
    async (format: "csv" | "pdf" | "excel") => {
      try {
        const blob = await membersTasksService.exportTasks(filters, format);

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
    },
    [filters],
  );

  // Load initial data
  useEffect(() => {
    // Initial load without dependencies to avoid loops
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await membersTasksService.getTasks({
          page: 1,
          limit: 20,
          memberFilterMode: "any",
          sortBy: "startDate",
          sortOrder: "asc",
        });

        if (response.success && response.data) {
          setTasks(response.data.tasks);
          setTotalPages(response.data.totalPages);
          setCurrentPage(response.data.currentPage);
          setTotalCount(response.data.totalCount);
        } else {
          throw new Error(response.message || "Failed to fetch tasks");
        }
      } catch (err) {
        // Fallback to mock data when API is not available
        const mockTasks = generateMockTasks();

        setTasks(mockTasks.slice(0, 20));
        setTotalPages(Math.ceil(mockTasks.length / 20));
        setCurrentPage(1);
        setTotalCount(mockTasks.length);
      } finally {
        setLoading(false);
      }
    };

    // Load filters data
    const loadFiltersData = async () => {
      try {
        const response = await membersTasksService.getFiltersData();

        if (response.success && response.data) {
          setFiltersData((prev) => ({
            ...response.data,
            departments:
              initialDepartments.length > 0
                ? initialDepartments
                : response.data.departments,
          }));
        }
      } catch (err) {
        console.error("Error fetching filter data:", err);
        // Set fallback filter data
        setFiltersData((prev) => ({
          ...prev,
          departments:
            initialDepartments.length > 0
              ? initialDepartments
              : prev.departments,
        }));
      }
    };

    loadInitialData();
    loadFiltersData();
  }, []);

  // Update filters data when departments change
  useEffect(() => {
    if (initialDepartments.length > 0) {
      setFiltersData((prev) => ({
        ...prev,
        departments: initialDepartments,
      }));
    }
  }, [initialDepartments]);

  return {
    tasks,
    loading,
    error,
    totalPages,
    currentPage,
    totalCount,
    departments: filtersData.departments,
    allEmployees,
    filters,
    setFilters,
    fetchTasks,
    refreshTasks,
    exportTasks,
    searchEmployees,
    filtersData,
  };
};
