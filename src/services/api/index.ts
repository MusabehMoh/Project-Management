// Import services first
import { projectsApi } from "./projects";
import { timelineApi } from "./timelineService";
import { mockApiService } from "./mock";
import { userService as realUserService, roleService as realRoleService, actionService as realActionService } from "./userService";
import { mockUserService } from "./mockUserService";

// API Client
export { apiClient, ApiError, API_CONFIG } from "./client";

// API Services
export { projectsApi, ProjectsApiService } from "./projects";
export { timelineApi } from "./timelineService";

// Mock Services (for development)
export { mockApiService, MockApiService } from "./mock";
export { mockUserService } from "./mockUserService";

// Determine which service to use based on environment
const isDevelopment = import.meta.env.MODE === "development";
const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true" || 
                  import.meta.env.NEXT_PUBLIC_USE_MOCK_API === "true" || 
                  isDevelopment;

// Log service selection in development
if (isDevelopment && import.meta.env.VITE_ENABLE_CONSOLE_LOGS === "true") {
  console.log(`🔧 API Service: ${useMockApi ? "Mock API" : "Real API"}`);
  console.log(`🌐 Base URL: ${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}`);
}

// Export the appropriate service instances
export const projectService = useMockApi ? mockApiService : projectsApi;
export const timelineService = useMockApi ? mockApiService : timelineApi;
export const userService = useMockApi ? mockUserService : realUserService;

// For roles and actions, use the same service as userService
// When using mock, both roleService and actionService point to mockUserService
// When using real API, they point to the real imported services
export const roleService = useMockApi ? mockUserService : realRoleService;
export const actionService = useMockApi ? mockUserService : realActionService;
