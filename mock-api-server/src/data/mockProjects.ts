// Project type interface for mock data
export interface Project {
  id: number;
  applicationName: string;
  projectOwner: string;
  alternativeOwner: string;
  owningUnit: string;
  projectOwnerId: number;
  alternativeOwnerId: number;
  owningUnitId: number;
  analysts?: string; // Display names for analysts (comma-separated)
  analystIds?: number[]; // Actual IDs for analysts
  startDate: string;
  expectedCompletionDate: string;
  description: string;
  remarks: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  priority: string;
  budget: number;
  progress: number;
}

export const mockProjects: Project[] = [
  {
    id: 1,
    applicationName: "Customer Portal Redesign1",
    projectOwner: "أحمد محمد السالم",
    alternativeOwner: "سارة علي الحسن",
    owningUnit: "Information Technology Division",
    projectOwnerId: 1,
    alternativeOwnerId: 2,
    owningUnitId: 1,
    analysts: "خالد الأحمد, منى السالم",
    analystIds: [4, 5],
    startDate: "2025-01-15",
    expectedCompletionDate: "2025-08-30",
    description:
      "Complete redesign of the customer portal interface with modern UI/UX principles and improved functionality.",
    remarks: "High priority project with executive sponsorship",
    status: 4,
    createdAt: "2024-12-01T10:00:00Z",
    updatedAt: "2025-01-10T15:30:00Z",
    priority: "high",
    budget: 250000,
    progress: 35,
  },
  {
    id: 2,
    applicationName: "HR System Automation",
    projectOwner: "ليلى عبد الرحمن",
    alternativeOwner: "محمد عادل حسين",
    owningUnit: "Human Resources Division",
    projectOwnerId: 3,
    alternativeOwnerId: 6,
    owningUnitId: 2,
    analysts: "نورة السبيعي, سامي الفهد",
    analystIds: [7, 4],
    startDate: "2025-02-01",
    expectedCompletionDate: "2025-11-15",
    description:
      "Automation of HR processes including leave requests, payroll, and performance evaluations.",
    remarks: "Medium complexity, requires cross-department coordination",
    status: 2,
    createdAt: "2025-01-05T09:30:00Z",
    updatedAt: "2025-02-20T14:45:00Z",
    priority: "medium",
    budget: 150000,
    progress: 20,
  },
  {
    id: 3,
    applicationName: "Finance Dashboard Upgrade",
    projectOwner: "عبد الله العتيبي",
    alternativeOwner: "ريم خالد العبدالله",
    owningUnit: "Finance Division",
    projectOwnerId: 9,
    alternativeOwnerId: 10,
    owningUnitId: 3,
    analysts: "زياد الغامدي, هند منصور",
    analystIds: [11, 4],
    startDate: "2025-03-10",
    expectedCompletionDate: "2025-09-30",
    description:
      "Enhancement of financial reporting dashboards with real-time analytics and predictive insights.",
    remarks: "Key dependency for budget planning cycle",
    status: 3,
    createdAt: "2025-02-12T11:15:00Z",
    updatedAt: "2025-03-25T16:20:00Z",
    priority: "high",
    budget: 300000,
    progress: 45,
  },
  {
    id: 4,
    applicationName: "Mobile App Enhancement",
    projectOwner: "مها يوسف الدوسري",
    alternativeOwner: "فيصل إبراهيم الحربي",
    owningUnit: "Digital Services Division",
    projectOwnerId: 13,
    alternativeOwnerId: 14,
    owningUnitId: 4,
    analysts: "راشد الكعبي, هدى النعيمي",
    analystIds: [15, 4],
    startDate: "2025-04-05",
    expectedCompletionDate: "2025-12-20",
    description:
      "Addition of new mobile app features including biometric authentication and push notifications.",
    remarks: "Customer-driven initiative",
    status: 1,
    createdAt: "2025-03-01T08:50:00Z",
    updatedAt: "2025-04-15T12:10:00Z",
    priority: "medium",
    budget: 200000,
    progress: 10,
  },
  {
    id: 5,
    applicationName: "Data Warehouse Modernization",
    projectOwner: "ناصر علي المطيري",
    alternativeOwner: "هدى ماجد الزهراني",
    owningUnit: "Data & Analytics Division",
    projectOwnerId: 17,
    alternativeOwnerId: 18,
    owningUnitId: 5,
    analysts: "فهد العوفي, سلمى جابر",
    analystIds: [19, 4],
    startDate: "2025-05-01",
    expectedCompletionDate: "2026-01-31",
    description:
      "Migration of data warehouse to cloud-based infrastructure with improved scalability and security.",
    remarks: "Strategic project with long-term impact",
    status: 2,
    createdAt: "2025-04-10T10:25:00Z",
    updatedAt: "2025-05-20T09:40:00Z",
    priority: "high",
    budget: 500000,
    progress: 25,
  },
  {
    id: 2,
    applicationName: "Mobile Banking App",
    projectOwner: "محمد أحمد الخالد",
    alternativeOwner: "فاطمة حسين النعيمي",
    owningUnit: "Finance and Budgeting",
    analystIds: [6, 4],
    analysts: "ياسر المحمد, نور الدين",
    projectOwnerId: 3,
    alternativeOwnerId: 4,
    owningUnitId: 2,
    startDate: "2025-02-01",
    expectedCompletionDate: "2025-12-15",
    description:
      "Development of a comprehensive cloud storage solution for document management and collaboration.",
    remarks: "Initial planning phase - awaiting budget approval",
    status: 1,
    createdAt: "2024-07-01T16:00:00Z",
    updatedAt: "2025-01-08T11:20:00Z",
    priority: "high",
    budget: 500000,
    progress: 20,
  },
  {
    id: 3,
    applicationName: "ERP System Upgrade",
    projectOwner: "خالد سعد المطيري",
    alternativeOwner: "منى عبدالله العتيبي",
    owningUnit: "Operations and Strategic Planning",
    projectOwnerId: 5,
    alternativeOwnerId: 6,
    owningUnitId: 3,
    startDate: "2025-03-01",
    expectedCompletionDate: "2025-11-30",
    description:
      "Upgrade of the legacy ERP system to improve business process automation and reporting capabilities.",
    remarks: "Coordination with multiple departments required",
    status: 1,
    createdAt: "2024-10-20T14:00:00Z",
    updatedAt: "2024-12-15T16:45:00Z",
    priority: "medium",
    budget: 750000,
    progress: 5,
  },
];
