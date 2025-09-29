import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock employees data
const mockEmployees = [
  {
    id: 1,
    username: "jdoe",
    militaryNumber: "12345",
    fullName: "John Doe",
    email: "john.doe@military.gov",
    phone: "+1-555-0101",
    rank: "Captain",
    unit: "Engineering Division",
    department: "Software Engineering",
    position: "Team Lead",
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 2,
    username: "asmith",
    militaryNumber: "67890",
    fullName: "Alice Smith",
    email: "alice.smith@military.gov",
    phone: "+1-555-0102",
    rank: "Lieutenant",
    unit: "Operations Division",
    department: "Logistics",
    position: "Operations Specialist",
    isActive: true,
    createdAt: "2024-02-01T09:15:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 3,
    username: "mjohnson",
    militaryNumber: "11111",
    fullName: "Mike Johnson",
    email: "mike.johnson@military.gov",
    phone: "+1-555-0103",
    rank: "Major",
    unit: "Intelligence Division",
    department: "Analysis",
    position: "Senior Analyst",
    isActive: true,
    createdAt: "2024-01-10T10:30:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
];

export class EmployeesController {
  /**
   * Search employees by username, military number, or full name
   */
  async searchEmployees(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const searchTerm = q.toLowerCase();
      const searchResults = mockEmployees.filter(
        (employee) =>
          employee.username.toLowerCase().includes(searchTerm) ||
          employee.militaryNumber.includes(searchTerm) ||
          employee.fullName.toLowerCase().includes(searchTerm) ||
          employee.email.toLowerCase().includes(searchTerm),
      );

      logger.info(
        `Employee search for "${q}" returned ${searchResults.length} results`,
      );

      res.json({
        success: true,
        data: searchResults.map((emp) => ({
          id: emp.id,
          username: emp.username,
          militaryNumber: emp.militaryNumber,
          fullName: emp.fullName,
          rank: emp.rank,
          unit: emp.unit,
          department: emp.department,
        })),
      });
    } catch (error) {
      logger.error("Error searching employees:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get employee details by username or military number
   */
  async getEmployeeDetails(req: Request, res: Response) {
    try {
      const { identifier } = req.query;

      if (!identifier || typeof identifier !== "string") {
        return res.status(400).json({
          success: false,
          message: "Employee identifier is required",
        });
      }

      const employee = mockEmployees.find(
        (emp) =>
          emp.username.toLowerCase() === identifier.toLowerCase() ||
          emp.militaryNumber === identifier,
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      logger.info(`Retrieved employee details for identifier: ${identifier}`);

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      logger.error("Error getting employee details:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get all employees (for department member listings)
   */
  async getAllEmployees(req: Request, res: Response) {
    try {
      logger.info("Retrieving all employees");

      // Return all employees in the same format as MemberSearchResult
      const allEmployees = mockEmployees
        .filter((emp) => emp.isActive) // Only return active employees
        .map((emp) => ({
          id: emp.id,
          userName: emp.username,
          militaryNumber: emp.militaryNumber,
          fullName: emp.fullName,
          gradeName: emp.rank,
          statusId: emp.isActive ? 1 : 0,
          department: emp.department,
        }));

      res.json({
        success: true,
        data: allEmployees,
      });
    } catch (error) {
      logger.error("Error getting all employees:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
