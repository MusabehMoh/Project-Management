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
    analysts?: string; // Display names for analysts (comma-separated)
    analystIds?: number[]; // Actual IDs for analysts
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
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
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
      {
        id: 2,
        requirementId: 1,
        fileName: "auth_specs.docx",
        originalName: "Authentication Technical Specifications.docx",
        fileSize: 1024768,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedAt: "2025-01-10T10:00:00Z",
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
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
    attachments: [
      {
        id: 4,
        requirementId: 2,
        fileName: "invoice_template.pdf",
        originalName: "Invoice Template Design.pdf",
        fileSize: 1536000,
        mimeType: "application/pdf",
        uploadedAt: "2025-01-11T11:00:00Z",
        uploadedBy: 1,
      },
      {
        id: 5,
        requirementId: 2,
        fileName: "qr_integration.docx",
        originalName: "QR Code Integration Specs.docx",
        fileSize: 768000,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedAt: "2025-01-11T11:30:00Z",
        uploadedBy: 1,
      },
    ],
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
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
    attachments: [
      {
        id: 6,
        requirementId: 3,
        fileName: "notification_flow.png",
        originalName: "Push Notification Flow Diagram.png",
        fileSize: 512000,
        mimeType: "image/png",
        uploadedAt: "2025-01-12T15:30:00Z",
        uploadedBy: 3,
      },
      {
        id: 7,
        requirementId: 3,
        fileName: "push_notification_specs.pdf",
        originalName: "Push Notification Technical Specifications.pdf",
        fileSize: 1200000,
        mimeType: "application/pdf",
        uploadedAt: "2025-01-12T16:00:00Z",
        uploadedBy: 3,
      },
    ],
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
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
    attachments: [
      {
        id: 8,
        requirementId: 4,
        fileName: "biometric_design.pdf",
        originalName: "Biometric Authentication UI Design.pdf",
        fileSize: 2400000,
        mimeType: "application/pdf",
        uploadedAt: "2025-01-13T12:00:00Z",
        uploadedBy: 3,
      },
      {
        id: 9,
        requirementId: 4,
        fileName: "security_protocols.docx",
        originalName: "Biometric Security Protocols.docx",
        fileSize: 950000,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedAt: "2025-01-13T13:00:00Z",
        uploadedBy: 3,
      },
    ],
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
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
    },
    attachments: [
      {
        id: 10,
        requirementId: 5,
        fileName: "dashboard_mockups.pdf",
        originalName: "Advanced Dashboard Mockups.pdf",
        fileSize: 3200000,
        mimeType: "application/pdf",
        uploadedAt: "2025-01-14T09:30:00Z",
        uploadedBy: 5,
      },
      {
        id: 11,
        requirementId: 5,
        fileName: "reporting_requirements.xlsx",
        originalName: "Reporting Requirements Matrix.xlsx",
        fileSize: 850000,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        uploadedAt: "2025-01-14T10:00:00Z",
        uploadedBy: 5,
      },
    ],
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
