export interface ProjectRequirement {
  id: number;
  projectId: number;
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
  type: "new" | "change request";
  expectedCompletionDate: string;
  attachments?: ProjectRequirementAttachment[];
  status: "draft" | "pending" | "in-development" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  assignedAnalyst?: number;
  // Project information for display
  project?: {
    id: number;
    applicationName: string;
    projectOwner: string;
    owningUnit: string;
  };
}

export interface ProjectRequirementAttachment {
  id: number;
  requirementId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: number;
}

export const mockProjectRequirements: ProjectRequirement[] = [
  {
    id: 1,
    projectId: 1,
    name: "User Authentication System",
    description:
      "Implement secure user login and registration functionality with multi-factor authentication support. The system should support OAuth integration with Google and Microsoft accounts.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-15",
    status: "draft",
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-10T09:00:00Z",
    createdBy: 1,
    assignedAnalyst: 2,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
    },
    attachments: [
      {
        id: 1,
        requirementId: 1,
        fileName: "auth_wireframes.pdf",
        originalName: "Authentication Wireframes.pdf",
        fileSize: 2048576,
        mimeType: "application/pdf",
        uploadedAt: "2025-01-10T09:15:00Z",
        uploadedBy: 1,
      },
    ],
  },
  {
    id: 2,
    projectId: 1,
    name: "PDF Invoice Generation",
    description:
      "Create a module to generate PDF invoices with company branding, including QR codes for verification and support for multiple languages (Arabic/English).",
    priority: "medium",
    type: "change request",
    expectedCompletionDate: "2025-04-01",
    status: "in-development",
    createdAt: "2025-01-11T10:30:00Z",
    updatedAt: "2025-01-11T10:30:00Z",
    createdBy: 1,
    assignedAnalyst: 2,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
    },
  },
  {
    id: 3,
    projectId: 2,
    name: "Mobile App Push Notifications",
    description:
      "Implement push notification system for the mobile banking application to notify users of transactions, account updates, and security alerts.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-30",
    status: "in-development",
    createdAt: "2025-01-12T14:20:00Z",
    updatedAt: "2025-01-12T16:45:00Z",
    createdBy: 3,
    assignedAnalyst: 6,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
    },
  },
  {
    id: 4,
    projectId: 2,
    name: "Biometric Authentication",
    description:
      "Integrate fingerprint and face recognition authentication for enhanced security in the mobile banking application.",
    priority: "high",
    type: "change request",
    expectedCompletionDate: "2025-05-15",
    status: "in-development",
    createdAt: "2025-01-13T11:00:00Z",
    updatedAt: "2025-01-15T09:30:00Z",
    createdBy: 3,
    assignedAnalyst: 7,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
    },
  },
  {
    id: 5,
    projectId: 3,
    name: "Advanced Reporting Dashboard",
    description:
      "Create comprehensive reporting dashboard with charts, graphs, and data export capabilities for the ERP system upgrade.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-06-01",
    status: "draft",
    createdAt: "2025-01-14T08:45:00Z",
    updatedAt: "2025-01-14T08:45:00Z",
    createdBy: 5,
    assignedAnalyst: 8,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
    },
  },
];

export const mockRequirementAttachments: ProjectRequirementAttachment[] = [
  {
    id: 1,
    requirementId: 1,
    fileName: "auth_wireframes.pdf",
    originalName: "Authentication Wireframes.pdf",
    fileSize: 2048576,
    mimeType: "application/pdf",
    uploadedAt: "2025-01-10T09:15:00Z",
    uploadedBy: 1,
  },
  {
    id: 2,
    requirementId: 1,
    fileName: "auth_specs.docx",
    originalName: "Authentication Technical Specifications.docx",
    fileSize: 1024768,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uploadedAt: "2025-01-10T10:00:00Z",
    uploadedBy: 1,
  },
  {
    id: 3,
    requirementId: 3,
    fileName: "notification_flow.png",
    originalName: "Push Notification Flow Diagram.png",
    fileSize: 512000,
    mimeType: "image/png",
    uploadedAt: "2025-01-12T15:30:00Z",
    uploadedBy: 3,
  },
];
