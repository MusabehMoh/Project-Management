import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Import mock data from other controllers for lookups
import { mockRoles } from "./rolesController.js";
import { mockActions } from "./actionsController.js";

// Mock users data
const mockUsers = [
  {
    id: 1,
    userName: "admin",
    prsId: 1001,
    isVisible: true,
    fullName: "Ahmed Hassan",
    militaryNumber: "12345",
    gradeName: "Colonel",
    department: "Engineering",
    email: "ahmed.hassan@example.com",
    phone: "+966501234567",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    employee: {
      id: 1001,
      userName: "admin",
      fullName: "Ahmed Hassan",
      militaryNumber: "12345",
      gradeName: "Colonel",
      statusId: 1,
    },
    roles: [
      {
        id: 1,
        name: "Administrator", //Administrator
        active: true,
        roleOrder: 1,
      },
    ],
  actions: [
      {
        id: 1,
        name: "users.create",
        categoryName: "User Management",
        categoryType: "System",
        description: "Create new users",
        isActive: true,
        actionOrder: 1,
      },
      {
        id: 2,
        name: "users.read",
        categoryName: "User Management",
        categoryType: "System",
        description: "View user information",
        isActive: true,
        actionOrder: 2,
      },
      {
        id: 3,
        name: "users.update",
        categoryName: "User Management",
        categoryType: "System",
        description: "Update user information",
        isActive: true,
        actionOrder: 3,
      },
      {
        id: 4,
        name: "users.delete",
        categoryName: "User Management",
        categoryType: "System",
        description: "Delete users",
        isActive: true,
        actionOrder: 4,
      },
      {
        id: 5,
        name: "projects.create",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Create new projects",
        isActive: true,
        actionOrder: 5,
      },
      {
        id: 6,
        name: "projects.read",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "View project information",
        isActive: true,
        actionOrder: 6,
      },
      {
        id: 7,
        name: "projects.update",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Update project information",
        isActive: true,
        actionOrder: 7,
      },
      {
        id: 8,
        name: "projects.delete",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Delete projects",
        isActive: true,
        actionOrder: 8,
      },
      {
        id: 9,
        name: "projects.sendToAnylsis",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Send projects to analysis",
        isActive: true,
        actionOrder: 9,
      },
      {
        id: 10,
        name: "requirements.create",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Create new requirements",
        isActive: true,
        actionOrder: 10,
      },
      {
        id: 11,
        name: "requirements.read",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View requirements",
        isActive: true,
        actionOrder: 11,
      },
      {
        id: 12,
        name: "requirements.update",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Update requirements",
        isActive: true,
        actionOrder: 12,
      },
      {
        id: 13,
        name: "requirements.delete",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Delete requirements",
        isActive: true,
        actionOrder: 13,
      },
      {
        id: 14,
        name: "requirements.send",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Send requirements to development",
        isActive: true,
        actionOrder: 14,
      },
      {
        id: 15,
        name: "requirements.attachments.upload",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Upload attachments to requirements",
        isActive: true,
        actionOrder: 15,
      },
      {
        id: 16,
        name: "requirements.attachments.delete",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Delete attachments from requirements",
        isActive: true,
        actionOrder: 16,
      },
      {
        id: 17,
        name: "requirements.attachments.download",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Download attachments from requirements",
        isActive: true,
        actionOrder: 17,
      },
      {
        id: 18,
        name: "requirements.view",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View project requirements",
        isActive: true,
        actionOrder: 18,
      },
      {
        id: 19,
        name: "requirements.tasks.create",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Create tasks for requirements",
        isActive: true,
        actionOrder: 19,
      },
      {
        id: 20,
        name: "requirements.tasks.update",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Update tasks for requirements",
        isActive: true,
        actionOrder: 20,
      },
      {
        id: 21,
        name: "requirements.timelines.create",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Create timelines for requirements",
        isActive: true,
        actionOrder: 21,
      },
      {
        id: 22,
        name: "requirements.timelines.read",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View timelines for requirements",
        isActive: true,
        actionOrder: 22,
      },
      {
        id: 23,
        name: "requirements.development.view",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View development requirements",
        isActive: true,
        actionOrder: 23,
      },
      {
        id: 24,
        name: "timelines.view",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View timelines",
        isActive: true,
        actionOrder: 24,
      },
      {
        id: 25,
        name: "timelines.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update timelines",
        isActive: true,
        actionOrder: 25,
      },
      {
        id: 26,
        name: "sprints.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create sprints",
        isActive: true,
        actionOrder: 26,
      },
      {
        id: 27,
        name: "sprints.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View sprints",
        isActive: true,
        actionOrder: 27,
      },
      {
        id: 28,
        name: "sprints.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update sprints",
        isActive: true,
        actionOrder: 28,
      },
      {
        id: 29,
        name: "sprints.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete sprints",
        isActive: true,
        actionOrder: 29,
      },
      {
        id: 30,
        name: "timelines.requirements.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create timeline requirements",
        isActive: true,
        actionOrder: 30,
      },
      {
        id: 31,
        name: "timelines.requirements.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View timeline requirements",
        isActive: true,
        actionOrder: 31,
      },
      {
        id: 32,
        name: "timelines.requirements.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update timeline requirements",
        isActive: true,
        actionOrder: 32,
      },
      {
        id: 33,
        name: "timelines.requirements.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete timeline requirements",
        isActive: true,
        actionOrder: 33,
      },
      {
        id: 34,
        name: "timelines.requirements.move",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Move timeline requirements",
        isActive: true,
        actionOrder: 34,
      },
      {
        id: 35,
        name: "timelines.tasks.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create timeline tasks",
        isActive: true,
        actionOrder: 35,
      },
      {
        id: 36,
        name: "timelines.tasks.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View timeline tasks",
        isActive: true,
        actionOrder: 36,
      },
      {
        id: 37,
        name: "timelines.tasks.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update timeline tasks",
        isActive: true,
        actionOrder: 37,
      },
      {
        id: 38,
        name: "timelines.tasks.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete timeline tasks",
        isActive: true,
        actionOrder: 38,
      },
      {
        id: 39,
        name: "timelines.tasks.move",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Move timeline tasks",
        isActive: true,
        actionOrder: 39,
      },
      {
        id: 40,
        name: "subtasks.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create subtasks",
        isActive: true,
        actionOrder: 40,
      },
      {
        id: 41,
        name: "subtasks.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View subtasks",
        isActive: true,
        actionOrder: 41,
      },
      {
        id: 42,
        name: "subtasks.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update subtasks",
        isActive: true,
        actionOrder: 42,
      },
      {
        id: 43,
        name: "subtasks.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete subtasks",
        isActive: true,
        actionOrder: 43,
      },
      {
        id: 44,
        name: "departments.read",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "View departments",
        isActive: true,
        actionOrder: 44,
      },
      {
        id: 45,
        name: "departments.update",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Update departments",
        isActive: true,
        actionOrder: 45,
      },
      {
        id: 46,
        name: "departments.delete",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Delete departments",
        isActive: true,
        actionOrder: 46,
      },
      {
        id: 47,
        name: "departments.members.read",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "View department members",
        isActive: true,
        actionOrder: 47,
      },
      {
        id: 48,
        name: "departments.members.create",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Add members to departments",
        isActive: true,
        actionOrder: 48,
      },
      {
        id: 49,
        name: "departments.members.delete",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Remove members from departments",
        isActive: true,
        actionOrder: 49,
      },
      {
        id: 50,
        name: "employees.search",
        categoryName: "User Management",
        categoryType: "System",
        description: "Search employees",
        isActive: true,
        actionOrder: 50,
      },
    ],
  },
  {
    id: 2,
    userName: "manager",
    prsId: 1002,
    isVisible: true,
    fullName: "Fatima Al-Zahra",
    militaryNumber: "12346",
    gradeName: "Major",
    department: "Operations",
    email: "fatima.alzahra@example.com",
    phone: "+966501234568",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    employee: {
      id: 1002,
      userName: "manager",
      fullName: "Fatima Al-Zahra",
      militaryNumber: "12346",
      gradeName: "Major",
      statusId: 1,
    },
    roles: [
      {
        id: 2,
        name: "Project Manager",
        active: true,
        roleOrder: 2,
        actions: [
          {
            id: 6,
            name: "Create Projects",
            categoryName: "Project Management",
            categoryType: "Business",
            description: "Create new projects",
            isActive: true,
            actionOrder: 6,
          },
          {
            id: 7,
            name: "Edit Projects",
            categoryName: "Project Management",
            categoryType: "Business",
            description: "Modify existing projects",
            isActive: true,
            actionOrder: 7,
          },
          {
            id: 8,
            name: "View Reports",
            categoryName: "Reporting",
            categoryType: "Business",
            description: "Access project reports",
            isActive: true,
            actionOrder: 8,
          },
        ],
      },
    ],
    actions: [
      {
        id: 6,
        name: "Create Projects",
        categoryName: "Project Management",
        categoryType: "Business",
        description: "Create new projects",
        isActive: true,
        actionOrder: 6,
      },
      {
        id: 7,
        name: "Edit Projects",
        categoryName: "Project Management",
        categoryType: "Business",
        description: "Modify existing projects",
        isActive: true,
        actionOrder: 7,
      },
      {
        id: 8,
        name: "View Reports",
        categoryName: "Reporting",
        categoryType: "Business",
        description: "Access project reports",
        isActive: true,
        actionOrder: 8,
      },
      {
        id: 9,
        name: "Manage Team",
        categoryName: "Team Management",
        categoryType: "Business",
        description: "Manage team members and assignments",
        isActive: true,
        actionOrder: 9,
      },
    ],
  },
  {
    id: 3,
    userName: "developer",
    prsId: 1003,
    isVisible: true,
    fullName: "Omar Mahmoud",
    militaryNumber: "12347",
    gradeName: "Captain",
    department: "IT",
    email: "omar.mahmoud@example.com",
    phone: "+966501234569",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
    employee: {
      id: 1003,
      userName: "developer",
      fullName: "Omar Mahmoud",
      militaryNumber: "12347",
      gradeName: "Captain",
      statusId: 1,
    },
    roles: [
      {
        id: 3,
        name: "Developer",
        active: true,
        roleOrder: 3,
        actions: [
          {
            id: 10,
            name: "Code Review",
            categoryName: "Development",
            categoryType: "Technical",
            description: "Review and approve code changes",
            isActive: true,
            actionOrder: 10,
          },
          {
            id: 11,
            name: "Deploy Applications",
            categoryName: "Development",
            categoryType: "Technical",
            description: "Deploy applications to servers",
            isActive: true,
            actionOrder: 11,
          },
          {
            id: 12,
            name: "Access Logs",
            categoryName: "System Monitoring",
            categoryType: "Technical",
            description: "View system and application logs",
            isActive: true,
            actionOrder: 12,
          },
        ],
      },
    ],
    actions: [
      {
        id: 10,
        name: "Code Review",
        categoryName: "Development",
        categoryType: "Technical",
        description: "Review and approve code changes",
        isActive: true,
        actionOrder: 10,
      },
      {
        id: 11,
        name: "Deploy Applications",
        categoryName: "Development",
        categoryType: "Technical",
        description: "Deploy applications to servers",
        isActive: true,
        actionOrder: 11,
      },
      {
        id: 12,
        name: "Access Logs",
        categoryName: "System Monitoring",
        categoryType: "Technical",
        description: "View system and application logs",
        isActive: true,
        actionOrder: 12,
      },
    ],
  },
  {
    id: 4,
    userName: "analyst1",
    prsId: 1004,
    isVisible: true,
    fullName: "خالد الأحمد",
    militaryNumber: "12348",
    gradeName: "Lieutenant",
    department: "Analysis",
    email: "khalid.ahmed@example.com",
    phone: "+966501234570",
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z",
    employee: {
      id: 1004,
      userName: "analyst1",
      fullName: "خالد الأحمد",
      militaryNumber: "12348",
      gradeName: "Lieutenant",
      statusId: 1,
    },
  },
  {
    id: 5,
    userName: "analyst2",
    prsId: 1005,
    isVisible: true,
    fullName: "منى السالم",
    militaryNumber: "12349",
    gradeName: "Lieutenant",
    department: "Analysis",
    email: "mona.salem@example.com",
    phone: "+966501234571",
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
    employee: {
      id: 1005,
      userName: "analyst2",
      fullName: "منى السالم",
      militaryNumber: "12349",
      gradeName: "Lieutenant",
      statusId: 1,
    },
  },
  {
    id: 6,
    userName: "analyst3",
    prsId: 1006,
    isVisible: true,
    fullName: "ياسر المحمد",
    militaryNumber: "12350",
    gradeName: "Staff Sergeant",
    department: "Analysis",
    email: "yaser.mohammed@example.com",
    phone: "+966501234572",
    createdAt: "2024-01-06T00:00:00Z",
    updatedAt: "2024-01-06T00:00:00Z",
    employee: {
      id: 1006,
      userName: "analyst3",
      fullName: "ياسر المحمد",
      militaryNumber: "12350",
      gradeName: "Staff Sergeant",
      statusId: 1,
    },
  },
  {
    id: 7,
    userName: "analyst4",
    prsId: 1007,
    isVisible: true,
    fullName: "نور الدين",
    militaryNumber: "12351",
    gradeName: "Staff Sergeant",
    department: "Analysis",
    email: "nour.aldin@example.com",
    phone: "+966501234573",
    createdAt: "2024-01-07T00:00:00Z",
    updatedAt: "2024-01-07T00:00:00Z",
    employee: {
      id: 1007,
      userName: "analyst4",
      fullName: "نور الدين",
      militaryNumber: "12351",
      gradeName: "Staff Sergeant",
      statusId: 1,
    },
  },
];

// Mock owning units data
const mockOwningUnits = [
  {
    id: 1,
    name: "Engineering Division",
    code: "ENG001",
    description: "Main engineering department",
    isActive: true,
  },
  {
    id: 2,
    name: "Operations Division",
    code: "OPS001",
    description: "Operations and logistics",
    isActive: true,
  },
  {
    id: 3,
    name: "IT Division",
    code: "IT001",
    description: "Information Technology department",
    isActive: true,
  },
];

export class UsersController {
  /**
   * Get all users with pagination and filtering
   */
  async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search, department } = req.query;

      let filteredUsers = [...mockUsers];

      // Apply search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();

        filteredUsers = filteredUsers.filter(
          (user) =>
            user.fullName.toLowerCase().includes(searchTerm) ||
            user.userName.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm),
        );
      }

      // Apply department filter
      if (department) {
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.department?.toLowerCase() ===
            (department as string).toLowerCase(),
        );
      }

      // Apply pagination
      const startIndex = ((page as number) - 1) * (limit as number);
      const endIndex = startIndex + (limit as number);
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      logger.info(
        `Retrieved ${paginatedUsers.length} users (page ${page}, limit ${limit})`,
      );

      res.json({
        success: true,
        data: paginatedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / (limit as number)),
        },
      });
    } catch (error) {
      logger.error("Error getting users:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get owning units
   */
  async getOwningUnits(req: Request, res: Response) {
    try {
      logger.info("Retrieved owning units");

      res.json({
        success: true,
        data: mockOwningUnits,
      });
    } catch (error) {
      logger.error("Error getting owning units:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = mockUsers.find((u) => u.id === Number(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      logger.info(`Retrieved user ${id}`);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error("Error getting user by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create new user
   */
  async createUser(req: Request, res: Response) {
    try {
      const userData = req.body;
      const newUser = {
        id: Math.max(...mockUsers.map((u) => u.id)) + 1,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);
      logger.info(`Created new user: ${newUser.userName}`);

      res.status(201).json({
        success: true,
        data: newUser,
      });
    } catch (error) {
      logger.error("Error creating user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userIndex = mockUsers.findIndex((u) => u.id === Number(id));

      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Handle roleIds conversion to roles objects
      let roles = mockUsers[userIndex].roles;

      if (updateData.roleIds && Array.isArray(updateData.roleIds)) {
        roles = mockRoles
          .filter((role) => updateData.roleIds.includes(role.id))
          .map((role) => ({
            id: role.id,
            name: role.name,
            active: role.isActive,
            roleOrder: role.id,
          }));
      }

      // Handle actionIds conversion to actions objects
      let actions = mockUsers[userIndex].actions;

      if (updateData.actionIds && Array.isArray(updateData.actionIds)) {
        actions = mockActions
          .filter((action) => updateData.actionIds.includes(action.id))
          .map((action, index) => ({
            id: action.id,
            name: action.name,
            categoryName: action.category,
            categoryType: "System",
            description: action.description,
            isActive: action.isActive,
            actionOrder: index + 1,
          }));
      }

      // Remove roleIds and actionIds from updateData since we're replacing them with roles and actions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { roleIds, actionIds, ...filteredUpdateData } = updateData;

      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...filteredUpdateData,
        roles,
        actions,
        updatedAt: new Date().toISOString(),
      };

      logger.info(`Updated user ${id}: ${mockUsers[userIndex].userName}`);

      res.json({
        success: true,
        data: mockUsers[userIndex],
      });
    } catch (error) {
      logger.error("Error updating user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userIndex = mockUsers.findIndex((u) => u.id === Number(id));

      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const deletedUser = mockUsers.splice(userIndex, 1)[0];

      logger.info(`Deleted user ${id}: ${deletedUser.userName}`);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req: Request, res: Response) {
    try {
      const stats = {
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter((u) => u.isVisible).length,
        usersByDepartment: mockUsers.reduce(
          (acc, user) => {
            acc[user.department] = (acc[user.department] || 0) + 1;

            return acc;
          },
          {} as Record<string, number>,
        ),
      };

      logger.info("Retrieved user statistics");

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting user stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req: Request, res: Response) {
    try {
      // For mock purposes, return the first admin user
      const currentUser =
        mockUsers.find((u) => u.userName === "admin") || mockUsers[0];

      logger.info(`Retrieved current user: ${currentUser.userName}`);

      res.json({
        success: true,
        data: {
          ...currentUser,
        },
      });
    } catch (error) {
      logger.error("Error getting current user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get current user claims and permissions
   */
  async getCurrentUserClaims(req: Request, res: Response) {
    try {
      const claims = {
        userId: 1,
        userName: "admin",
        roles: ["Administrator"],
        permissions: [
          "users.create",
          "users.read",
          "users.update",
          "users.delete",
          "projects.create",
          "projects.read",
          "projects.update",
          "roles.manage",
          "units.manage",
        ],
        claims: {
          sub: "1",
          preferred_username: "admin",
          email: "ahmed.hassan@example.com",
          roles: ["Administrator"],
        },
      };

      logger.info("Retrieved current user claims");

      res.json({
        success: true,
        data: claims,
      });
    } catch (error) {
      logger.error("Error getting user claims:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(req: Request, res: Response) {
    try {
      const { action, resource } = req.query;

      if (!action || !resource) {
        return res.status(400).json({
          success: false,
          message: "Action and resource parameters are required",
        });
      }

      // For mock purposes, admin has all permissions
      const permission = `${resource}.${action}`;
      const hasPermission = true; // Mock: admin has all permissions

      logger.info(
        `Permission check: ${permission} - ${hasPermission ? "ALLOWED" : "DENIED"}`,
      );

      res.json({
        success: true,
        data: hasPermission,
      });
    } catch (error) {
      logger.error("Error checking permission:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Assign roles to user
   */
  async assignRoles(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { roleIds } = req.body;

      const user = mockUsers.find((u) => u.id === Number(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      logger.info(`Assigned ${roleIds.length} roles to user ${id}`);

      res.json({
        success: true,
        message: "Roles assigned successfully",
      });
    } catch (error) {
      logger.error("Error assigning roles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Remove roles from user
   */
  async removeRoles(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { roleIds } = req.body;

      const user = mockUsers.find((u) => u.id === Number(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      logger.info(`Removed ${roleIds?.length || 0} roles from user ${id}`);

      res.json({
        success: true,
        message: "Roles removed successfully",
      });
    } catch (error) {
      logger.error("Error removing roles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Assign actions to user
   */
  async assignActions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { actionIds } = req.body;

      const user = mockUsers.find((u) => u.id === Number(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      logger.info(`Assigned ${actionIds.length} actions to user ${id}`);

      res.json({
        success: true,
        message: "Actions assigned successfully",
      });
    } catch (error) {
      logger.error("Error assigning actions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Remove actions from user
   */
  async removeActions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { actionIds } = req.body;

      const user = mockUsers.find((u) => u.id === Number(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      logger.info(`Removed ${actionIds?.length || 0} actions from user ${id}`);

      res.json({
        success: true,
        message: "Actions removed successfully",
      });
    } catch (error) {
      logger.error("Error removing actions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
