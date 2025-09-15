// Project details related types based on the API schema

export interface SystemAttachment {
  id: number;
  systemId: number;
  name: string;
  fileName: string;
  note?: string;
  type: string;
  isDeleted: boolean;
  createdAt: string;
  createdBy: number;
  modifiedAt: string;
  modifiedBy: number;
}

export interface SystemAttachmentContent {
  id: number;
  fileName: string;
  content: string; // base64 encoded binary content
}

export interface SystemDeveloper {
  id: number;
  systemId: number;
  developerId: number;
  // Additional developer info (joined from user/employee data)
  developerName?: string;
  militaryNumber?: string;
  department?: string;
  rank?: string;
}

export interface SystemTechnology {
  id: number;
  systemId: number;
  technologyId: number;
  technologyCategoryId: number;
  // Additional technology info (joined data)
  technologyName?: string;
  categoryName?: string;
}

export interface Technology {
  id: number;
  technologyCategoryId: number;
  name: string;
  description?: string;
}

export interface TechnologyCategory {
  id: number;
  code: string;
  name: string;
}

export interface ProjectDetails {
  id: number;
  projectId: number;
  attachments: SystemAttachment[];
  developers: SystemDeveloper[];
  technologies: SystemTechnology[];
}

// Form data types
export interface CreateAttachmentRequest {
  systemId: number;
  name: string;
  fileName: string;
  note?: string;
  type: string;
  content: File | string;
}

export interface CreateDeveloperRequest {
  systemId: number;
  developerId: number;
}

export interface CreateTechnologyRequest {
  systemId: number;
  technologyId: number;
  technologyCategoryId: number;
}

export interface CreateTechnologyCategoryRequest {
  code: string;
  name: string;
}

export interface CreateTechnologyItemRequest {
  technologyCategoryId: number;
  name: string;
  description?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
