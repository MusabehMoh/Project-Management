import { RequirementTask } from "./mockProjectRequirements.js";

export const mockRequirementTasks: RequirementTask[] = [
  {
    id: 1,
    requirementId: 2, // PDF Invoice Generation
    developerId: 4,
    developerName: "خالد الأحمد",
    qcId: 5,
    qcName: "منى السالم",
    status: "in-progress",
    createdAt: "2025-01-11T11:00:00Z",
    updatedAt: "2025-01-11T14:30:00Z",
    createdBy: 1,
  },
  {
    id: 2,
    requirementId: 4, // Biometric Authentication
    developerId: 6,
    developerName: "ياسر المحمد",
    qcId: 4,
    qcName: "نور الدين",
    status: "testing",
    createdAt: "2025-01-13T12:00:00Z",
    updatedAt: "2025-01-15T09:30:00Z",
    createdBy: 3,
  },
];
