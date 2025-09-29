import { mockUsers } from "./mockUsers";

// Developer workload data structure
export interface DeveloperWorkload {
  developerId: string;
  developerName: string;
  currentTasks: number;
  completedTasks: number;
  averageTaskTime: number;
  efficiency: number;
  workloadPercentage: number;
  skills: string[];
  currentProjects: string[];
  availableHours: number;
  status: "available" | "busy" | "blocked" | "on-leave";
  department?: string;
  militaryNumber?: string;
  gradeName?: string;
  email?: string;
  phone?: string;
}

// Generate more comprehensive developer workload data
const skillSets = [
  ["React", "TypeScript", "Node.js"],
  ["Vue.js", "Python", "PostgreSQL"],
  ["Angular", "Java", "MySQL"],
  ["React Native", "Swift", "Kotlin"],
  ["DevOps", "Docker", "Kubernetes"],
  ["C#", ".NET", "SQL Server"],
  ["PHP", "Laravel", "MongoDB"],
  ["Python", "Django", "Redis"],
  ["JavaScript", "Express.js", "GraphQL"],
  ["Flutter", "Dart", "Firebase"],
  ["Go", "Microservices", "gRPC"],
  ["React", "Next.js", "Tailwind CSS"],
  ["Vue.js", "Nuxt.js", "Vuetify"],
  ["Angular", "NestJS", "Prisma"],
  ["Python", "FastAPI", "Celery"],
  ["Java", "Spring Boot", "Hibernate"],
  ["Rust", "WebAssembly", "Tokio"],
  ["Scala", "Akka", "Play Framework"],
  ["Elixir", "Phoenix", "LiveView"],
  ["Ruby", "Rails", "Sidekiq"],
];

const projectNames = [
  "E-Commerce Platform",
  "Admin Panel",
  "API Gateway",
  "Data Analytics Dashboard",
  "Mobile App",
  "Infrastructure Management",
  "CI/CD Pipeline",
  "User Authentication System",
  "Payment Gateway Integration",
  "Real-time Chat Application",
  "Document Management System",
  "Inventory Management",
  "Customer Support Portal",
  "Business Intelligence Platform",
  "Security Monitoring System",
  "Content Management System",
  "Workflow Automation",
  "Video Streaming Platform",
  "IoT Device Management",
  "Machine Learning Pipeline",
  "Blockchain Integration",
  "Cloud Migration Project",
  "Legacy System Modernization",
  "Performance Optimization",
  "Database Migration",
];

const statuses: DeveloperWorkload["status"][] = [
  "available",
  "busy",
  "blocked",
  "on-leave",
];

// Helper function to generate random data
const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomFloat = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 10) / 10;

const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, count);
};

// Generate developer workload data from mock users
export const mockDeveloperWorkloadData: DeveloperWorkload[] = mockUsers
  .filter(
    (user) =>
      user.department === "IT" ||
      user.department === "Engineering" ||
      user.department === "Analysis",
  )
  .map((user, index) => {
    const status = statuses[index % statuses.length];
    const efficiency = getRandomInt(65, 98);
    const completedTasks = getRandomInt(15, 50);
    const currentTasks = status === "on-leave" ? 0 : getRandomInt(1, 8);

    const workloadPercentage =
      status === "on-leave" ? 0 : getRandomInt(30, 100);
    const availableHours = status === "on-leave" ? 0 : getRandomInt(0, 8);

    return {
      developerId: user.id.toString(),
      developerName: user.fullName,
      currentTasks,
      completedTasks,
      averageTaskTime: getRandomFloat(4.5, 9.5),
      efficiency,
      workloadPercentage,
      skills: getRandomItems(skillSets[index % skillSets.length], 3),
      currentProjects:
        status === "on-leave"
          ? []
          : getRandomItems(projectNames, getRandomInt(1, 3)),
      availableHours,
      status,
      department: user.department,
      militaryNumber: user.militaryNumber,
      gradeName: user.gradeName,
      email: user.email,
      phone: user.phone,
    };
  });

// Add more developers to reach a good number for pagination testing
const additionalDevelopers: DeveloperWorkload[] = [
  {
    developerId: "101",
    developerName: "محمد العبدالله",
    currentTasks: 6,
    completedTasks: 42,
    averageTaskTime: 5.2,
    efficiency: 91,
    workloadPercentage: 88,
    skills: ["React", "GraphQL", "AWS"],
    currentProjects: ["Microservices Architecture", "Cloud Migration"],
    availableHours: 4,
    status: "busy",
    department: "IT",
    militaryNumber: "20001",
    gradeName: "Major",
    email: "mohammed.abdullah@example.com",
    phone: "+966501234600",
  },
  {
    developerId: "102",
    developerName: "سارة الخليل",
    currentTasks: 3,
    completedTasks: 38,
    averageTaskTime: 6.1,
    efficiency: 87,
    workloadPercentage: 65,
    skills: ["Vue.js", "Laravel", "MySQL"],
    currentProjects: ["Customer Portal"],
    availableHours: 7,
    status: "available",
    department: "IT",
    militaryNumber: "20002",
    gradeName: "Captain",
    email: "sara.alkhalil@example.com",
    phone: "+966501234601",
  },
  {
    developerId: "103",
    developerName: "عبدالرحمن المالكي",
    currentTasks: 5,
    completedTasks: 29,
    averageTaskTime: 7.3,
    efficiency: 82,
    workloadPercentage: 75,
    skills: ["Angular", "Spring Boot", "PostgreSQL"],
    currentProjects: ["Enterprise Dashboard", "API Gateway"],
    availableHours: 5,
    status: "available",
    department: "Engineering",
    militaryNumber: "20003",
    gradeName: "Lieutenant",
    email: "abdulrahman.almalki@example.com",
    phone: "+966501234602",
  },
  {
    developerId: "104",
    developerName: "نورا السليمان",
    currentTasks: 4,
    completedTasks: 35,
    averageTaskTime: 5.8,
    efficiency: 93,
    workloadPercentage: 70,
    skills: ["React Native", "Firebase", "TypeScript"],
    currentProjects: ["Mobile Banking App"],
    availableHours: 6,
    status: "available",
    department: "IT",
    militaryNumber: "20004",
    gradeName: "Captain",
    email: "nora.alsulaiman@example.com",
    phone: "+966501234603",
  },
  {
    developerId: "105",
    developerName: "أحمد الرشيد",
    currentTasks: 7,
    completedTasks: 41,
    averageTaskTime: 6.8,
    efficiency: 89,
    workloadPercentage: 95,
    skills: ["Python", "Django", "Redis"],
    currentProjects: ["Data Pipeline", "Analytics Platform"],
    availableHours: 2,
    status: "busy",
    department: "Analysis",
    militaryNumber: "20005",
    gradeName: "Major",
    email: "ahmed.alrashid@example.com",
    phone: "+966501234604",
  },
  {
    developerId: "106",
    developerName: "فاطمة الحسن",
    currentTasks: 2,
    completedTasks: 26,
    averageTaskTime: 8.2,
    efficiency: 76,
    workloadPercentage: 45,
    skills: ["PHP", "Laravel", "MongoDB"],
    currentProjects: ["CMS System"],
    availableHours: 8,
    status: "available",
    department: "IT",
    militaryNumber: "20006",
    gradeName: "Lieutenant",
    email: "fatima.alhassan@example.com",
    phone: "+966501234605",
  },
  {
    developerId: "107",
    developerName: "يوسف القرشي",
    currentTasks: 5,
    completedTasks: 33,
    averageTaskTime: 5.9,
    efficiency: 90,
    workloadPercentage: 80,
    skills: ["Go", "Kubernetes", "Docker"],
    currentProjects: ["Container Orchestration", "DevOps Pipeline"],
    availableHours: 4,
    status: "busy",
    department: "Engineering",
    militaryNumber: "20007",
    gradeName: "Captain",
    email: "youssef.alqurashi@example.com",
    phone: "+966501234606",
  },
  {
    developerId: "108",
    developerName: "رنا المطيري",
    currentTasks: 6,
    completedTasks: 37,
    averageTaskTime: 6.4,
    efficiency: 85,
    workloadPercentage: 85,
    skills: ["Flutter", "Dart", "Firebase"],
    currentProjects: ["Cross-platform App", "Real-time Features"],
    availableHours: 3,
    status: "busy",
    department: "IT",
    militaryNumber: "20008",
    gradeName: "Staff Sergeant",
    email: "rana.almutairi@example.com",
    phone: "+966501234607",
  },
  {
    developerId: "109",
    developerName: "خالد الدوسري",
    currentTasks: 0,
    completedTasks: 28,
    averageTaskTime: 7.1,
    efficiency: 80,
    workloadPercentage: 0,
    skills: ["Java", "Spring", "Hibernate"],
    currentProjects: [],
    availableHours: 0,
    status: "on-leave",
    department: "Engineering",
    militaryNumber: "20009",
    gradeName: "Major",
    email: "khalid.aldossari@example.com",
    phone: "+966501234608",
  },
  {
    developerId: "110",
    developerName: "مريم الزهراني",
    currentTasks: 4,
    completedTasks: 31,
    averageTaskTime: 6.7,
    efficiency: 88,
    workloadPercentage: 72,
    skills: ["C#", ".NET Core", "Azure"],
    currentProjects: ["Enterprise API", "Cloud Services"],
    availableHours: 5,
    status: "available",
    department: "IT",
    militaryNumber: "20010",
    gradeName: "Captain",
    email: "mariam.alzahrani@example.com",
    phone: "+966501234609",
  },
  {
    developerId: "111",
    developerName: "عمر الغامدي",
    currentTasks: 3,
    completedTasks: 24,
    averageTaskTime: 8.5,
    efficiency: 74,
    workloadPercentage: 55,
    skills: ["Rust", "WebAssembly", "Systems Programming"],
    currentProjects: ["Performance Optimization"],
    availableHours: 7,
    status: "available",
    department: "Engineering",
    militaryNumber: "20011",
    gradeName: "Lieutenant",
    email: "omar.alghamdi@example.com",
    phone: "+966501234610",
  },
  {
    developerId: "112",
    developerName: "هند العتيبي",
    currentTasks: 5,
    completedTasks: 39,
    averageTaskTime: 5.6,
    efficiency: 92,
    workloadPercentage: 78,
    skills: ["Scala", "Akka", "Kafka"],
    currentProjects: ["Event Streaming", "Distributed Systems"],
    availableHours: 4,
    status: "busy",
    department: "Analysis",
    militaryNumber: "20012",
    gradeName: "Major",
    email: "hind.alotaibi@example.com",
    phone: "+966501234611",
  },
  {
    developerId: "113",
    developerName: "طارق الشهري",
    currentTasks: 6,
    completedTasks: 34,
    averageTaskTime: 6.9,
    efficiency: 86,
    workloadPercentage: 90,
    skills: ["Elixir", "Phoenix", "LiveView"],
    currentProjects: ["Real-time Dashboard", "WebSocket Services"],
    availableHours: 2,
    status: "busy",
    department: "IT",
    militaryNumber: "20013",
    gradeName: "Captain",
    email: "tariq.alshahri@example.com",
    phone: "+966501234612",
  },
  {
    developerId: "114",
    developerName: "ليلى الحارثي",
    currentTasks: 4,
    completedTasks: 27,
    averageTaskTime: 7.4,
    efficiency: 81,
    workloadPercentage: 68,
    skills: ["Ruby", "Rails", "Sidekiq"],
    currentProjects: ["Background Processing", "Web Application"],
    availableHours: 6,
    status: "available",
    department: "IT",
    militaryNumber: "20014",
    gradeName: "Lieutenant",
    email: "layla.alharthi@example.com",
    phone: "+966501234613",
  },
  {
    developerId: "115",
    developerName: "سلمان القحطاني",
    currentTasks: 3,
    completedTasks: 30,
    averageTaskTime: 6.2,
    efficiency: 89,
    workloadPercentage: 60,
    skills: ["Node.js", "Express", "MongoDB"],
    currentProjects: ["API Development"],
    availableHours: 7,
    status: "available",
    department: "Engineering",
    militaryNumber: "20015",
    gradeName: "Staff Sergeant",
    email: "salman.alqahtani@example.com",
    phone: "+966501234614",
  },
];

// Combine all developers
export const allDeveloperWorkloadData = [
  ...mockDeveloperWorkloadData,
  ...additionalDevelopers,
];

// Team performance metrics
export const teamPerformanceMetrics = {
  totalDevelopers: allDeveloperWorkloadData.length,
  activeDevelopers: allDeveloperWorkloadData.filter(
    (dev) => dev.status !== "on-leave",
  ).length,

  averageEfficiency:
    Math.round(
      (allDeveloperWorkloadData.reduce((sum, dev) => sum + dev.efficiency, 0) /
        allDeveloperWorkloadData.length) *
        10,
    ) / 10,
  totalTasksCompleted: allDeveloperWorkloadData.reduce(
    (sum, dev) => sum + dev.completedTasks,
    0,
  ),
  totalTasksInProgress: allDeveloperWorkloadData.reduce(
    (sum, dev) => sum + dev.currentTasks,
    0,
  ),

  averageTaskCompletionTime:
    Math.round(
      (allDeveloperWorkloadData.reduce(
        (sum, dev) => sum + dev.averageTaskTime,
        0,
      ) /
        allDeveloperWorkloadData.length) *
        10,
    ) / 10,
  codeReviewsCompleted: Math.floor(allDeveloperWorkloadData.length * 2.5),
  averageReviewTime: 2.8,
  bugsFixed: Math.floor(allDeveloperWorkloadData.length * 1.8),
  featuresDelivered: Math.floor(allDeveloperWorkloadData.length * 1.2),
};
