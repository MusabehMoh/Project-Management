// Import services first
import { projectsApi } from "./projects";
import { timelineApi } from "./timelineService";
import {
  userService as realUserService,
  roleService as realRoleService,
  actionService as realActionService,
} from "./userService";
import { departmentService as realDepartmentService } from "./departmentService";
import { realUnitService } from "./unitService";
import { ProjectDetailsApiService } from "./projectDetailsService";
import { lookupService } from "./lookupService";
import { ProjectStatusService } from "./projectStatusService";

// API Client
export { apiClient, ApiError, API_CONFIG } from "./client";

// API Services
export { projectsApi, ProjectsApiService } from "./projects";
export { timelineApi } from "./timelineService";
export { DepartmentService } from "./departmentService";
export { ProjectDetailsApiService } from "./projectDetailsService";
export { lookupService } from "./lookupService";
export { membersTasksService } from "./membersTasksService";

// Export the service instances
export const projectService = projectsApi;
export const timelineService = timelineApi;
export const userService = realUserService;
export const departmentService = realDepartmentService;
export const unitService = realUnitService;
export const projectStatusApiService = new ProjectStatusService();
export const projectDetailsService = new ProjectDetailsApiService();
export const lookupServiceInstance = lookupService;

// For roles and actions, use the real services
export const roleService = realRoleService;
export const actionService = realActionService;
