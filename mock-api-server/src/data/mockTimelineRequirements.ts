import { TimelineRequirement } from "../types/timelineRequirement.js";

export const mockTimelineRequirements: TimelineRequirement[] = [
  {
    id: 1,
    requirementId: 1,
    timelineId: 1,
    status: "timeline_created",
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-15T10:30:00Z",
    createdBy: 2, // analyst
    assignedManager: 1,
    requirement: {
      id: 1,
      name: "User Authentication System",
      description: "Implement secure user login and registration functionality with multi-factor authentication support. The system should support OAuth integration with Google and Microsoft accounts.",
      priority: "high",
      expectedCompletionDate: "2025-03-15",
      status: "in-development",
      project: {
        id: 1,
        applicationName: "Customer Portal System",
        projectOwner: "أحمد محمد العتيبي",
        owningUnit: "Information Technology Division"
      },
      createdBy: 1,
      assignedAnalyst: 2
    },
    timeline: {
      id: 1,
      name: "Customer Portal Phase 1",
      description: "Initial development phase for customer portal redesign",
      startDate: "2025-01-15",
      endDate: "2025-06-15",
      projectId: 1
    }
  },
  {
    id: 2,
    requirementId: 2,
    status: "pending",
    createdAt: "2025-01-11T10:30:00Z",
    updatedAt: "2025-01-11T10:30:00Z",
    createdBy: 2, // analyst
    requirement: {
      id: 2,
      name: "PDF Invoice Generation",
      description: "Create a module to generate PDF invoices with company branding, including QR codes for verification and support for multiple languages (Arabic/English).",
      priority: "medium",
      expectedCompletionDate: "2025-04-01",
      status: "in-development",
      project: {
        id: 1,
        applicationName: "Customer Portal System",
        projectOwner: "أحمد محمد العتيبي",
        owningUnit: "Information Technology Division"
      },
      createdBy: 1,
      assignedAnalyst: 2
    }
  },
  {
    id: 3,
    requirementId: 3,
    status: "pending",
    createdAt: "2025-01-12T14:20:00Z",
    updatedAt: "2025-01-12T16:45:00Z",
    createdBy: 6, // analyst
    requirement: {
      id: 3,
      name: "Mobile App Push Notifications",
      description: "Implement push notification system for the mobile banking application to notify users of transactions, account updates, and security alerts.",
      priority: "high",
      expectedCompletionDate: "2025-03-30",
      status: "draft",
      project: {
        id: 2,
        applicationName: "Mobile Banking App",
        projectOwner: "محمد أحمد الخالد",
        owningUnit: "Finance and Budgeting"
      },
      createdBy: 3,
      assignedAnalyst: 6
    }
  },
  {
    id: 4,
    requirementId: 4,
    status: "in_progress",
    createdAt: "2025-01-13T11:00:00Z",
    updatedAt: "2025-01-20T09:30:00Z",
    createdBy: 7, // analyst
    assignedManager: 2,
    timelineId: 2,
    requirement: {
      id: 4,
      name: "Biometric Authentication",
      description: "Integrate fingerprint and face recognition authentication for enhanced security in the mobile banking application.",
      priority: "high",
      expectedCompletionDate: "2025-05-15",
      status: "in-development",
      project: {
        id: 2,
        applicationName: "Mobile Banking App",
        projectOwner: "محمد أحمد الخالد",
        owningUnit: "Finance and Budgeting"
      },
      createdBy: 3,
      assignedAnalyst: 7
    },
    timeline: {
      id: 2,
      name: "Mobile Banking Security Phase",
      description: "Implementation of advanced security features",
      startDate: "2025-02-01",
      endDate: "2025-05-30",
      projectId: 2
    }
  },
  {
    id: 5,
    requirementId: 5,
    status: "pending",
    createdAt: "2025-01-14T08:45:00Z",
    updatedAt: "2025-01-14T08:45:00Z",
    createdBy: 8, // analyst
    requirement: {
      id: 5,
      name: "Advanced Reporting Dashboard",
      description: "Create comprehensive reporting dashboard with charts, graphs, and data export capabilities for the ERP system upgrade.",
      priority: "medium",
      expectedCompletionDate: "2025-06-01",
      status: "draft",
      project: {
        id: 3,
        applicationName: "ERP System Upgrade",
        projectOwner: "خالد سعد المطيري",
        owningUnit: "Operations and Strategic Planning"
      },
      createdBy: 5,
      assignedAnalyst: 8
    }
  }
];
