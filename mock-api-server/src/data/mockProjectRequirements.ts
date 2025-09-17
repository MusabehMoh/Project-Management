export interface RequirementTask {
  id: number;
  requirementId: number;
  developerId?: number;
  developerName?: string;
  qcId?: number;
  qcName?: string;
  status: "not-started" | "in-progress" | "testing" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface ProjectRequirement {
  id: number;
  projectId: number;
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
  type: "new" | "change request";
  expectedCompletionDate: string;
  attachments?: ProjectRequirementAttachment[];
  status: "draft" | "approved" | "in-development" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  assignedAnalyst?: number;
  // Task information if exists
  task?: RequirementTask;
  // Timeline information if exists
  timeline?: {
    id: number;
    name: string;
  };
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
    status: "completed",
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-10T09:00:00Z",
    createdBy: 1,
    assignedAnalyst: 2,
    // This requirement has a timeline (from mockTimelines.ts)
    timeline: {
      id: 1,
      name: "Customer Portal Phase 1",
    },
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
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
    // This requirement has a task assigned
    task: {
      id: 1,
      requirementId: 2,
      developerId: 4,
      developerName: "خالد الأحمد",
      qcId: 5,
      qcName: "منى السالم",
      status: "in-progress",
      createdAt: "2025-01-11T11:00:00Z",
      updatedAt: "2025-01-11T14:30:00Z",
      createdBy: 1,
    },
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
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
    // This requirement has a timeline
    timeline: {
      id: 2,
      name: "Mobile Banking Notifications Timeline",
    },
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
    // This requirement has a task assigned
    task: {
      id: 2,
      requirementId: 4,
      developerId: 6,
      developerName: "ياسر المحمد",
      qcId: 4,
      qcName: "نور الدين",
      status: "testing",
      createdAt: "2025-01-13T12:00:00Z",
      updatedAt: "2025-01-15T09:30:00Z",
      createdBy: 3,
    },
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
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
    status: "approved",
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
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        uploadedAt: "2025-01-14T10:00:00Z",
        uploadedBy: 5,
      },
    ],
  },
  {
    id: 6,
    projectId: 2,
    name: "Biometric Authentication",
    description:
      "Integrate fingerprint and face recognition authentication for enhanced security in the mobile banking application.",
    priority: "high",
    type: "change request",
    expectedCompletionDate: "2025-05-15",
    status: "approved",
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
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedAt: "2025-01-13T13:00:00Z",
        uploadedBy: 3,
      },
    ],
  },
  // Additional requirements for new users to fill the workload
  {
    id: 7,
    projectId: 1,
    name: "User Profile Management",
    description: "Implement comprehensive user profile management with photo upload and preferences.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-04-10",
    status: "in-development",
    createdAt: "2025-01-15T08:00:00Z",
    updatedAt: "2025-01-15T08:00:00Z",
    createdBy: 8, // Sarah Johnson
    assignedAnalyst: 4,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
  },
  {
    id: 8,
    projectId: 2,
    name: "Transaction History Export",
    description: "Allow users to export transaction history in multiple formats (PDF, Excel, CSV).",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-25",
    status: "in-development",
    createdAt: "2025-01-16T09:00:00Z",
    updatedAt: "2025-01-16T09:00:00Z",
    createdBy: 9, // محمد الغامدي
    assignedAnalyst: 5,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
  },
  {
    id: 9,
    projectId: 3,
    name: "Inventory Management Module",
    description: "Create comprehensive inventory tracking and management system.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-04-15",
    status: "in-development",
    createdAt: "2025-01-17T10:00:00Z",
    updatedAt: "2025-01-17T10:00:00Z",
    createdBy: 10, // عبدالله العتيبي
    assignedAnalyst: 6,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
    },
  },
  {
    id: 10,
    projectId: 1,
    name: "Security Audit System",
    description: "Implement comprehensive security audit and monitoring system.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-20",
    status: "in-development",
    createdAt: "2025-01-18T11:00:00Z",
    updatedAt: "2025-01-18T11:00:00Z",
    createdBy: 11, // Jennifer Smith
    assignedAnalyst: 4,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
  },
  {
    id: 11,
    projectId: 2,
    name: "Fraud Detection System",
    description: "Develop AI-powered fraud detection and prevention system.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-30",
    status: "in-development",
    createdAt: "2025-01-19T12:00:00Z",
    updatedAt: "2025-01-19T12:00:00Z",
    createdBy: 12, // علي الشهري
    assignedAnalyst: 5,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
  },
  {
    id: 12,
    projectId: 3,
    name: "Quality Assurance Dashboard",
    description: "Create QA dashboard for tracking testing progress and metrics.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-04-20",
    status: "approved",
    createdAt: "2025-01-20T13:00:00Z",
    updatedAt: "2025-01-20T13:00:00Z",
    createdBy: 13, // رنا المطيري
    assignedAnalyst: 6,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
    },
  },
  {
    id: 13,
    projectId: 1,
    name: "Automated Testing Framework",
    description: "Implement comprehensive automated testing framework for continuous integration.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-05-01",
    status: "in-development",
    createdAt: "2025-01-21T14:00:00Z",
    updatedAt: "2025-01-21T14:00:00Z",
    createdBy: 14, // David Wilson
    assignedAnalyst: 4,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
  },
  {
    id: 14,
    projectId: 2,
    name: "HR Integration Module",
    description: "Integrate HR system with main application for employee data synchronization.",
    priority: "low",
    type: "change request",
    expectedCompletionDate: "2025-05-15",
    status: "draft",
    createdAt: "2025-01-22T15:00:00Z",
    updatedAt: "2025-01-22T15:00:00Z",
    createdBy: 15, // فاطمة الزهراني
    assignedAnalyst: 5,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
  },
  {
    id: 15,
    projectId: 3,
    name: "Financial Reporting System",
    description: "Create comprehensive financial reporting and analytics system.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-04-05",
    status: "in-development",
    createdAt: "2025-01-23T16:00:00Z",
    updatedAt: "2025-01-23T16:00:00Z",
    createdBy: 16, // Robert Davis
    assignedAnalyst: 6,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
    },
  },
  {
    id: 16,
    projectId: 1,
    name: "Budget Management Tools",
    description: "Develop tools for budget planning, tracking, and analysis.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-04-25",
    status: "approved",
    createdAt: "2025-01-24T17:00:00Z",
    updatedAt: "2025-01-24T17:00:00Z",
    createdBy: 17, // سلمى القحطاني
    assignedAnalyst: 4,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
  },
  {
    id: 17,
    projectId: 2,
    name: "Legal Compliance Checker",
    description: "Implement system to check transactions for legal compliance and regulations.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-28",
    status: "in-development",
    createdAt: "2025-01-25T18:00:00Z",
    updatedAt: "2025-01-25T18:00:00Z",
    createdBy: 18, // أحمد الدوسري
    assignedAnalyst: 5,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
  },
  {
    id: 18,
    projectId: 3,
    name: "Customer Support Portal",
    description: "Create integrated customer support portal with ticketing system.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-05-10",
    status: "draft",
    createdAt: "2025-01-26T19:00:00Z",
    updatedAt: "2025-01-26T19:00:00Z",
    createdBy: 19, // Lisa Anderson
    assignedAnalyst: 6,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
    },
  },
  {
    id: 19,
    projectId: 1,
    name: "Multi-language Support",
    description: "Add comprehensive multi-language support with RTL layout for Arabic.",
    priority: "medium",
    type: "change request",
    expectedCompletionDate: "2025-04-30",
    status: "in-development",
    createdAt: "2025-01-27T20:00:00Z",
    updatedAt: "2025-01-27T20:00:00Z",
    createdBy: 20, // خالد الحربي
    assignedAnalyst: 4,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
  },
  // Add more in-development requirements for existing users to make them "busy"
  {
    id: 20,
    projectId: 2,
    name: "Advanced Analytics Engine",
    description: "Develop advanced analytics engine for business intelligence.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-22",
    status: "in-development",
    createdAt: "2025-01-28T21:00:00Z",
    updatedAt: "2025-01-28T21:00:00Z",
    createdBy: 8, // Sarah Johnson - 2nd requirement
    assignedAnalyst: 5,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
  },
  {
    id: 21,
    projectId: 3,
    name: "Performance Monitoring",
    description: "Implement real-time performance monitoring and alerting system.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-18",
    status: "in-development",
    createdAt: "2025-01-29T22:00:00Z",
    updatedAt: "2025-01-29T22:00:00Z",
    createdBy: 9, // محمد الغامدي - 2nd requirement
    assignedAnalyst: 6,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
    },
  },
  {
    id: 22,
    projectId: 1,
    name: "API Gateway Implementation",
    description: "Implement centralized API gateway for microservices architecture.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-15",
    status: "in-development",
    createdAt: "2025-01-30T23:00:00Z",
    updatedAt: "2025-01-30T23:00:00Z",
    createdBy: 10, // عبدالله العتيبي - 2nd requirement
    assignedAnalyst: 4,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
  },
  {
    id: 23,
    projectId: 2,
    name: "Data Backup & Recovery",
    description: "Implement automated data backup and disaster recovery system.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-12",
    status: "in-development",
    createdAt: "2025-01-31T08:00:00Z",
    updatedAt: "2025-01-31T08:00:00Z",
    createdBy: 11, // Jennifer Smith - 2nd requirement
    assignedAnalyst: 5,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
  },
  {
    id: 24,
    projectId: 3,
    name: "Third-party Integrations",
    description: "Develop framework for third-party service integrations and API management.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-04-08",
    status: "in-development",
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-01T09:00:00Z",
    createdBy: 12, // علي الشهري - 2nd requirement
    assignedAnalyst: 6,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
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

// Additional requirements to create "busy" users
export const additionalBusyRequirements: ProjectRequirement[] = [
  {
    id: 6,
    projectId: 2,
    name: "Performance Optimization Module",
    description: "Optimize application performance and implement caching strategies.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-04-01",
    status: "in-development",
    createdAt: "2025-01-15T08:00:00Z",
    updatedAt: "2025-01-15T08:00:00Z",
    createdBy: 3,
    assignedAnalyst: 4,
  },
  {
    id: 7,
    projectId: 2,
    name: "API Rate Limiting",
    description: "Implement rate limiting for API endpoints to prevent abuse.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-25",
    status: "in-development",
    createdAt: "2025-01-16T09:00:00Z",
    updatedAt: "2025-01-16T09:00:00Z",
    createdBy: 3,
    assignedAnalyst: 5,
  },
  {
    id: 8,
    projectId: 1,
    name: "Mobile App Integration",
    description: "Create mobile app integration for the customer portal.",
    priority: "medium",
    type: "new",
    expectedCompletionDate: "2025-04-15",
    status: "in-development",
    createdAt: "2025-01-17T10:00:00Z",
    updatedAt: "2025-01-17T10:00:00Z",
    createdBy: 1,
    assignedAnalyst: 2,
  },
  {
    id: 9,
    projectId: 1,
    name: "Advanced Search Feature",
    description: "Implement advanced search with filters and sorting.",
    priority: "low",
    type: "new",
    expectedCompletionDate: "2025-05-01",
    status: "in-development",
    createdAt: "2025-01-18T11:00:00Z",
    updatedAt: "2025-01-18T11:00:00Z",
    createdBy: 1,
    assignedAnalyst: 4,
  },
  {
    id: 10,
    projectId: 3,
    name: "Data Analytics Dashboard",
    description: "Create comprehensive analytics dashboard for administrators.",
    priority: "high",
    type: "new",
    expectedCompletionDate: "2025-03-30",
    status: "in-development",
    createdAt: "2025-01-19T12:00:00Z",
    updatedAt: "2025-01-19T12:00:00Z",
    createdBy: 1,
    assignedAnalyst: 5,
  }
];

// Combine all requirements
mockProjectRequirements.push(...additionalBusyRequirements);

// Add additional draft requirements for better testing
const additionalDraftRequirements = [
  {
    id: 100,
    projectId: 1,
    name: "Social Media Integration",
    description: "Integrate social media login and sharing capabilities for enhanced user engagement.",
    priority: "medium" as const,
    type: "new" as const,
    expectedCompletionDate: "2025-06-15",
    status: "draft" as const,
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-01T09:00:00Z",
    createdBy: 8, // Sarah Johnson
    assignedAnalyst: 4,
    project: {
      id: 1,
      applicationName: "Customer Portal System",
      projectOwner: "أحمد محمد العتيبي",
      owningUnit: "Information Technology Division",
      analysts: "خالد الأحمد, منى السالم",
      analystIds: [4, 5],
    },
  },
  {
    id: 101,
    projectId: 2,
    name: "Fraud Detection System",
    description: "Implement AI-powered fraud detection and prevention system for banking transactions.",
    priority: "high" as const,
    type: "new" as const,
    expectedCompletionDate: "2025-07-01",
    status: "draft" as const,
    createdAt: "2025-02-02T10:30:00Z",
    updatedAt: "2025-02-02T10:30:00Z",
    createdBy: 11, // Jennifer Smith
    assignedAnalyst: 6,
    project: {
      id: 2,
      applicationName: "Mobile Banking App",
      projectOwner: "محمد أحمد الخالد",
      owningUnit: "Finance and Budgeting",
      analysts: "ياسر المحمد, نور الدين",
      analystIds: [6, 4],
    },
  },
  {
    id: 102,
    projectId: 3,
    name: "Inventory Management Module",
    description: "Enhanced inventory tracking and management module with real-time updates.",
    priority: "medium" as const,
    type: "change request" as const,
    expectedCompletionDate: "2025-06-30",
    status: "draft" as const,
    createdAt: "2025-02-03T14:15:00Z",
    updatedAt: "2025-02-03T14:15:00Z",
    createdBy: 5, // منى السالم
    assignedAnalyst: 5,
    project: {
      id: 3,
      applicationName: "ERP System Upgrade",
      projectOwner: "خالد سعد المطيري",
      owningUnit: "Operations and Strategic Planning",
      analysts: "محمد التميمي, سعاد العتيبي",
      analystIds: [5, 6],
    },
  },
];

mockProjectRequirements.push(...additionalDraftRequirements);
