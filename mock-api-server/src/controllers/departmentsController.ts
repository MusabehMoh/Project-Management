import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock departments data
const mockDepartments = [
  {
    id: 1,
    name: "Engineering",
    code: "ENG",
    description: "Engineering and Development Department",
    isActive: true,
    parentId: null,
    memberCount: 25,
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Operations",
    code: "OPS",
    description: "Operations and Logistics Department",
    isActive: true,
    parentId: null,
    memberCount: 30,
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Information Technology",
    code: "IT",
    description: "IT and Systems Department",
    isActive: true,
    parentId: null,
    memberCount: 20,
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    name: "Software Development",
    code: "SW",
    description: "Software Development Division",
    isActive: true,
    parentId: 3,
    memberCount: 15,
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    name: "Quality Assurance",
    code: "QA",
    description: "Quality Assurance Division",
    isActive: true,
    parentId: 1,
    memberCount: 10,
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// Mock department members data
const mockDepartmentMembers = [
  {
    id: 1,
    departmentId: 1,
    userId: 101,
    role: "Manager",
    joinDate: "2024-01-01T00:00:00Z",
    isActive: true,
    user: {
      id: 101,
      fullName: "Ahmed Hassan",
      userName: "ahmed.hassan",
      email: "ahmed.hassan@company.com",
      militaryNumber: "M123456",
      gradeName: "Captain",
      isActive: true,
    },
  },
  {
    id: 2,
    departmentId: 1,
    userId: 102,
    role: "Developer",
    joinDate: "2024-01-15T00:00:00Z",
    isActive: true,
    user: {
      id: 102,
      fullName: "Sara Ahmed",
      userName: "sara.ahmed",
      email: "sara.ahmed@company.com",
      militaryNumber: "M123457",
      gradeName: "Lieutenant",
      isActive: true,
    },
  },
  {
    id: 3,
    departmentId: 2,
    userId: 103,
    role: "Coordinator",
    joinDate: "2024-02-01T00:00:00Z",
    isActive: true,
    user: {
      id: 103,
      fullName: "Mohamed Ali",
      userName: "mohamed.ali",
      email: "mohamed.ali@company.com",
      militaryNumber: "M123458",
      gradeName: "Major",
      isActive: true,
    },
  },
];

export class DepartmentsController {
  /**
   * Get all departments
   */
  async getDepartments(req: Request, res: Response) {
    try {
      const { search, isActive } = req.query;

      let filteredDepartments = [...mockDepartments];

      // Apply search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();

        filteredDepartments = filteredDepartments.filter(
          (dept) =>
            dept.name.toLowerCase().includes(searchTerm) ||
            dept.code.toLowerCase().includes(searchTerm) ||
            dept.description?.toLowerCase().includes(searchTerm),
        );
      }

      // Apply active filter
      if (isActive !== undefined) {
        filteredDepartments = filteredDepartments.filter(
          (dept) => dept.isActive === (isActive === "true"),
        );
      }

      logger.info(`Retrieved ${filteredDepartments.length} departments`);

      res.json({
        success: true,
        data: filteredDepartments,
      });
    } catch (error) {
      logger.error("Error getting departments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const department = mockDepartments.find((d) => d.id === Number(id));

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      logger.info(`Retrieved department ${id}`);

      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      logger.error("Error getting department by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get department members
   */
  async getDepartmentMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const departmentId = Number(id);
      const pageNum = Number(page);
      const limitNum = Number(limit);

      // Check if department exists
      const department = mockDepartments.find((d) => d.id === departmentId);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      // Filter members by department
      const departmentMembers = mockDepartmentMembers.filter(
        (member) => member.departmentId === departmentId && member.isActive,
      );

      // Pagination
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedMembers = departmentMembers.slice(startIndex, endIndex);

      logger.info(
        `Retrieved ${paginatedMembers.length} members for department ${id}`,
      );

      res.json({
        success: true,
        data: paginatedMembers,
        totalCount: departmentMembers.length,
        totalPages: Math.ceil(departmentMembers.length / limitNum),
        currentPage: pageNum,
      });
    } catch (error) {
      logger.error("Error getting department members:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Add member to department
   */
  async addDepartmentMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;

      const departmentId = Number(id);

      // Check if department exists
      const department = mockDepartments.find((d) => d.id === departmentId);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      // Check if user is already a member
      const existingMember = mockDepartmentMembers.find(
        (member) =>
          member.departmentId === departmentId && member.userId === userId,
      );

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "User is already a member of this department",
        });
      }

      // Create new member
      const newMember = {
        id: Math.max(...mockDepartmentMembers.map((m) => m.id), 0) + 1,
        departmentId,
        userId: Number(userId),
        role: role || "Member",
        joinDate: new Date().toISOString(),
        isActive: true,
        user: {
          id: Number(userId),
          fullName: `User ${userId}`,
          userName: `user${userId}`,
          email: `user${userId}@company.com`,
          militaryNumber: `M${userId}`,
          gradeName: "Staff",
          isActive: true,
        },
      };

      mockDepartmentMembers.push(newMember);

      logger.info(`Added member ${userId} to department ${id}`);

      res.status(201).json({
        success: true,
        data: newMember,
        message: "Member added successfully",
      });
    } catch (error) {
      logger.error("Error adding department member:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update department member
   */
  async updateDepartmentMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const { role, isActive } = req.body;

      const departmentId = Number(id);
      const memberIdNum = Number(memberId);

      // Find the member
      const memberIndex = mockDepartmentMembers.findIndex(
        (member) =>
          member.id === memberIdNum && member.departmentId === departmentId,
      );

      if (memberIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      // Update member
      if (role !== undefined) mockDepartmentMembers[memberIndex].role = role;
      if (isActive !== undefined)
        mockDepartmentMembers[memberIndex].isActive = isActive;

      logger.info(`Updated member ${memberId} in department ${id}`);

      res.json({
        success: true,
        data: mockDepartmentMembers[memberIndex],
        message: "Member updated successfully",
      });
    } catch (error) {
      logger.error("Error updating department member:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Remove member from department
   */
  async removeDepartmentMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;

      const departmentId = Number(id);
      const memberIdNum = Number(memberId);

      // Find the member
      const memberIndex = mockDepartmentMembers.findIndex(
        (member) =>
          member.id === memberIdNum && member.departmentId === departmentId,
      );

      if (memberIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      // Remove member (or mark as inactive)
      mockDepartmentMembers[memberIndex].isActive = false;

      logger.info(`Removed member ${memberId} from department ${id}`);

      res.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      logger.error("Error removing department member:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Remove department member by member ID only
   */
  async removeMemberById(req: Request, res: Response) {
    try {
      const { memberId } = req.params;
      const memberIdNum = Number(memberId);

      // Find the member
      const memberIndex = mockDepartmentMembers.findIndex(
        (member) => member.id === memberIdNum,
      );

      if (memberIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      // Remove member (or mark as inactive)
      mockDepartmentMembers[memberIndex].isActive = false;

      logger.info(`Removed member ${memberId} from department`);

      res.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      logger.error("Error removing department member by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
