import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Language = "en" | "ar";
export type Direction = "ltr" | "rtl";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Translation dictionary
const translations = {
  en: {
    // Navbar
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projects",
    "nav.users": "Users",
    "nav.tasks": "Tasks",
    "nav.team": "Team",
    "nav.reports": "Reports",
    "nav.newProject": "New Project",
    "nav.notifications": "Notifications",
    "nav.search": "Search projects, tasks, people...",
    "nav.searchModal": "Search",
    "nav.searchPlaceholder": "Search projects, tasks, team members...",
    "nav.searchResults": "Search results for",
    "nav.searchPrompt": "Start typing to search projects, tasks, and team members...",

    // User Menu
    "user.account": "Account",
    "user.workspace": "Workspace",
    "user.profile": "Profile",
    "user.settings": "Settings",
    "user.teamManagement": "Team Management",
    "user.billing": "Billing",
    "user.logout": "Log Out",
    "user.profileDesc": "View and edit your profile",
    "user.settingsDesc": "Account preferences",
    "user.teamDesc": "Manage team members",
    "user.billingDesc": "View billing information",
    "user.logoutDesc": "Sign out of your account",
    "user.loading": "Loading user data...",
    "user.loadingProfile": "Loading user profile...",

    // Dashboard
    "dashboard.title": "Project Management Dashboard",
    "dashboard.subtitle": "Track and manage your projects efficiently",
    "dashboard.newProject": "New Project",
    "dashboard.activeProjects": "Active Projects",
    "dashboard.totalTasks": "Total Tasks",
    "dashboard.inProgress": "In Progress",
    "dashboard.overdue": "Overdue",
    "dashboard.importData": "Import Data",
    "dashboard.viewDetails": "View Details",
    "dashboard.recentTasks": "Recent Tasks",
    "dashboard.tasks": "Tasks",
    "dashboard.due": "Due",
    "dashboard.progress": "Progress",
    "dashboard.teamMembers": "Team Members",
    "dashboard.task": "Task",
    "dashboard.assignee": "Assignee",
    "dashboard.status": "Status",
    "dashboard.priority": "Priority",
    "dashboard.dueDate": "Due Date",
    "dashboard.assignedTo": "Assigned to",

    // Project Status
    "status.active": "Active",
    "status.completed": "Completed",
    "status.onHold": "On Hold",
    "status.todo": "To Do",
    "status.inProgress": "In Progress",

    // Priority
    "priority.high": "High",
    "priority.medium": "Medium",
    "priority.low": "Low",

    // Common
    "common.due": "Due",
    "common.tasks": "tasks",
    "common.progress": "Progress",
    "common.close": "Close",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.editProject": "Edit Project",
    "common.cancel": "Cancel",
    "common.all": "All",
    "common.inactive": "Inactive",
    "common.show": "Show",
    "common.loading": "Loading...",
    "common.pleaseWait": "Please wait...",
    "common.noDataFound": "No data found",

    // Pagination
    "pagination.showing": "Showing",
    "pagination.to": "to",
    "pagination.of": "of",
    "pagination.items": "items",
    "pagination.page": "Page",
    "pagination.perPage": "per page",
    "pagination.goTo": "Go to page",
    "pagination.previous": "Previous",
    "pagination.next": "Next",
    "pagination.first": "First",
    "pagination.last": "Last",
    "pagination.loading": "Loading page...",
    "pagination.loadingPage": "Loading page {page}...",

    // Projects
    "projects.title": "Projects Management",
    "projects.subtitle": "Manage all organizational applications and projects",
    "projects.newProject": "New Project",
    "projects.importProjects": "Import Projects",
    "projects.exportData": "Export Data",
    "projects.totalProjects": "Total Projects",
    "projects.active": "Active",
    "projects.planning": "Planning",
    "projects.onHold": "On Hold",
    "projects.completed": "Completed",
    "projects.allProjects": "All Projects",
    "projects.applicationName": "Application Name",
    "projects.projectOwner": "Project Owner",
    "projects.alternativeOwner": "Alternative Owner",
    "projects.owningUnit": "Owning Unit",
    "projects.startDate": "Start Date",
    "projects.expectedCompletion": "Expected Completion",
    "projects.description": "Description",
    "projects.remarks": "Remarks",
    "projects.status": "Status",
    "projects.actions": "Actions",
    "projects.editProject": "Edit Project",
    "projects.deleteProject": "Delete Project",
    "projects.addProject": "Add New Project",
    "projects.updateProject": "Update Project",
    "projects.confirmDelete": "Confirm Delete",
    "projects.deleteConfirmMessage": "Are you sure you want to delete the project",
    "projects.actionCannotBeUndone": "This action cannot be undone.",
    "projects.noProjectsFound": "No projects found",
    "projects.noProjectsOnPage": "No projects on this page. Try a different page.",
    "projects.startFirstProject": "Start by creating your first project.",
    "projects.fillProjectDetails": "Fill in the project details below",
    "projects.updateProjectInfo": "Update project information",
    "projects.searchByName": "Search by name, military number, or username",
    "projects.noRemarks": "No remarks",

    // User Management
    "users.title": "User Management",
    "users.subtitle": "Manage system users, roles, and permissions",
    "users.addUser": "Add New User",
    "users.editUser": "Edit User",
    "users.deleteUser": "Delete User",
    "users.userName": "Username",
    "users.fullName": "Full Name",
    "users.militaryNumber": "Military Number",
    "users.gradeName": "Grade",
    "users.roles": "Roles",
    "users.actions": "Actions",
    "users.isVisible": "Active",
    "users.status": "Status",
    "users.searchEmployees": "Search employees by name, military number, or username",
    "users.selectEmployee": "Select Employee",
    "users.employeeNotFound": "Employee not found",
    "users.assignRoles": "Assign Role",
    "users.assignActions": "Assign Actions",
    "users.assignAdditionalActions": "Assign Additional Actions",
    "users.permissionsSummary": "Permissions Summary",
    "users.confirmDelete": "Confirm Delete User",
    "users.deleteConfirmMessage": "Are you sure you want to delete this user?",
    "users.userStats": "User Statistics",
    "users.totalUsers": "Total Users",
    "users.activeUsers": "Active Users",
    "users.inactiveUsers": "Inactive Users",
    "users.usersByRole": "Users by Role",
    "users.accountStatus": "Account Status",
    "users.activeDescription": "User is active and can access the system",
    "users.inactiveDescription": "User is inactive and cannot access the system",

    // Roles
    "roles.title": "Role Management",
    "roles.name": "Role Name",
    "roles.description": "Description",
    "roles.active": "Active",
    "roles.order": "Order",
    "roles.permissions": "Permissions",
    "roles.assignActions": "Assign Actions",
    "roles.selectRole": "Select a Role",
    "roles.role": "Role",

    // Actions/Permissions
    "actions.title": "Action Management",
    "actions.name": "Action Name",
    "actions.category": "Category",
    "actions.description": "Description",
    "actions.userManagement": "User Management",
    "actions.projectManagement": "Project Management",
    "actions.roleManagement": "Role Management",
    "actions.systemAdmin": "System Administration",
    "actions.defaultActions": "default actions",
    "actions.defaultActionsForRole": "Default actions for role",
    "actions.defaultActionsNote": "These actions are automatically granted with this role and cannot be removed.",
    "actions.totalActions": "Total Actions",
    "actions.defaultFromRole": "Default from Role",
    "actions.additionalSelected": "Additional Selected",
    "actions.scrollToSeeMore": "Scroll to see more categories",
    "actions.totalAvailable": "total actions available",

    // Permissions
    "permissions.create": "Create",
    "permissions.read": "Read",
    "permissions.update": "Update",
    "permissions.delete": "Delete",
    "permissions.admin": "Administrator",
    "permissions.denied": "Access Denied",
    "permissions.insufficient": "Insufficient permissions to perform this action",

    // Project Status Options
    "projectStatus.planning": "Planning",
    "projectStatus.active": "Active",
    "projectStatus.onHold": "On Hold", 
    "projectStatus.completed": "Completed",
    "projectStatus.cancelled": "Cancelled",
  },
  ar: {
    // Navbar
    "nav.dashboard": "لوحة التحكم",
    "nav.projects": "المشاريع",
    "nav.users": "المستخدمين",
    "nav.tasks": "المهام",
    "nav.team": "الفريق",
    "nav.reports": "التقارير",
    "nav.newProject": "مشروع جديد",
    "nav.notifications": "الإشعارات",
    "nav.search": "البحث في المشاريع والمهام والأشخاص...",
    "nav.searchModal": "البحث",
    "nav.searchPlaceholder": "البحث في المشاريع والمهام وأعضاء الفريق...",
    "nav.searchResults": "نتائج البحث عن",
    "nav.searchPrompt": "ابدأ الكتابة للبحث في المشاريع والمهام وأعضاء الفريق...",

    // User Menu
    "user.account": "الحساب",
    "user.workspace": "مساحة العمل",
    "user.profile": "الملف الشخصي",
    "user.settings": "الإعدادات",
    "user.teamManagement": "إدارة الفريق",
    "user.billing": "الفواتير",
    "user.logout": "تسجيل الخروج",
    "user.profileDesc": "عرض وتحرير ملفك الشخصي",
    "user.settingsDesc": "تفضيلات الحساب",
    "user.teamDesc": "إدارة أعضاء الفريق",
    "user.billingDesc": "عرض معلومات الفواتير",
    "user.logoutDesc": "تسجيل الخروج من حسابك",
    "user.loading": "جاري تحميل بيانات المستخدم...",

    // Dashboard
    "dashboard.title": "لوحة تحكم إدارة المشاريع",
    "dashboard.subtitle": "تتبع وإدارة مشاريعك بكفاءة",
    "dashboard.newProject": "مشروع جديد",
    "dashboard.activeProjects": "المشاريع النشطة",
    "dashboard.totalTasks": "إجمالي المهام",
    "dashboard.inProgress": "قيد التنفيذ",
    "dashboard.overdue": "متأخرة",
    "dashboard.importData": "استيراد البيانات",
    "dashboard.viewDetails": "عرض التفاصيل",
    "dashboard.recentTasks": "المهام الحديثة",
    "dashboard.tasks": "المهام",
    "dashboard.due": "الاستحقاق",
    "dashboard.progress": "التقدم",
    "dashboard.teamMembers": "أعضاء الفريق",
    "dashboard.task": "المهمة",
    "dashboard.assignee": "المُعين",
    "dashboard.status": "الحالة",
    "dashboard.priority": "الأولوية",
    "dashboard.dueDate": "تاريخ الاستحقاق",
    "dashboard.assignedTo": "مُعين إلى",

    // Project Status
    "status.active": "نشط",
    "status.completed": "مكتمل",
    "status.onHold": "معلق",
    "status.todo": "للقيام",
    "status.inProgress": "قيد التنفيذ",

    // Priority
    "priority.high": "عالية",
    "priority.medium": "متوسطة",
    "priority.low": "منخفضة",

    // Common
    "common.due": "تاريخ الاستحقاق",
    "common.tasks": "مهام",
    "common.progress": "التقدم",
    "common.close": "إغلاق",
    "common.edit": "تحرير",
    "common.save": "حفظ",
    "common.editProject": "تحرير المشروع",
    "common.cancel": "إلغاء",
    "common.all": "الكل",
    "common.inactive": "غير نشط",
    "common.show": "عرض",
    "common.loading": "جاري التحميل...",
    "common.pleaseWait": "يرجى الانتظار...",
    "common.noDataFound": "لا توجد بيانات",

    // Pagination
    "pagination.showing": "عرض",
    "pagination.to": "إلى",
    "pagination.of": "من",
    "pagination.items": "عنصر",
    "pagination.page": "صفحة",
    "pagination.perPage": "لكل صفحة",
    "pagination.goTo": "الذهاب إلى الصفحة",
    "pagination.previous": "السابق",
    "pagination.next": "التالي",
    "pagination.first": "الأولى",
    "pagination.last": "الأخيرة",
    "pagination.loading": "جاري تحميل الصفحة...",
    "pagination.loadingPage": "جاري تحميل الصفحة {page}...",

    // Projects
    "projects.title": "إدارة المشاريع",
    "projects.subtitle": "إدارة جميع تطبيقات ومشاريع المؤسسة",
    "projects.newProject": "مشروع جديد",
    "projects.importProjects": "استيراد المشاريع",
    "projects.exportData": "تصدير البيانات",
    "projects.totalProjects": "إجمالي المشاريع",
    "projects.active": "نشط",
    "projects.planning": "تخطيط",
    "projects.onHold": "معلق",
    "projects.completed": "مكتمل",
    "projects.allProjects": "جميع المشاريع",
    "projects.applicationName": "اسم التطبيق",
    "projects.projectOwner": "مدير المشروع",
    "projects.alternativeOwner": "مدير المشروع البديل",
    "projects.owningUnit": "الوحدة المالكة",
    "projects.startDate": "تاريخ البداية",
    "projects.expectedCompletion": "تاريخ الإنجاز المتوقع",
    "projects.description": "الوصف",
    "projects.remarks": "ملاحظات",
    "projects.status": "الحالة",
    "projects.actions": "الإجراءات",
    "projects.editProject": "تحرير المشروع",
    "projects.deleteProject": "حذف المشروع",
    "projects.addProject": "إضافة مشروع جديد",
    "projects.updateProject": "تحديث المشروع",
    "projects.confirmDelete": "تأكيد الحذف",
    "projects.deleteConfirmMessage": "هل أنت متأكد من رغبتك في حذف المشروع",
    "projects.actionCannotBeUndone": "لا يمكن التراجع عن هذا الإجراء.",
    "projects.noProjectsFound": "لم يتم العثور على مشاريع",
    "projects.noProjectsOnPage": "لا توجد مشاريع في هذه الصفحة. جرب صفحة أخرى.",
    "projects.startFirstProject": "ابدأ بإنشاء مشروعك الأول.",
    "projects.fillProjectDetails": "املأ تفاصيل المشروع أدناه",
    "projects.updateProjectInfo": "تحديث معلومات المشروع",
    "projects.searchByName": "البحث بالاسم أو الرقم العسكري أو اسم المستخدم",
    "projects.noRemarks": "لا توجد ملاحظات",

    // User Management
    "users.title": "إدارة المستخدمين",
    "users.subtitle": "إدارة مستخدمي النظام والأدوار والصلاحيات",
    "users.addUser": "إضافة مستخدم جديد",
    "users.editUser": "تحرير المستخدم",
    "users.deleteUser": "حذف المستخدم",
    "users.userName": "اسم المستخدم",
    "users.fullName": "الاسم الكامل",
    "users.militaryNumber": "الرقم العسكري",
    "users.gradeName": "الرتبة",
    "users.roles": "الأدوار",
    "users.actions": "الصلاحيات",
    "users.isVisible": "نشط",
    "users.status": "الحالة",
    "users.searchEmployees": "البحث عن الموظفين بالاسم أو الرقم العسكري أو اسم المستخدم",
    "users.selectEmployee": "اختر موظف",
    "users.employeeNotFound": "لم يتم العثور على الموظف",
    "users.assignRoles": "تعيين دور",
    "users.assignActions": "تعيين الصلاحيات",
    "users.assignAdditionalActions": "تعيين صلاحيات إضافية",
    "users.permissionsSummary": "ملخص الصلاحيات",
    "users.confirmDelete": "تأكيد حذف المستخدم",
    "users.deleteConfirmMessage": "هل أنت متأكد من حذف هذا المستخدم؟",
    "users.userStats": "إحصائيات المستخدمين",
    "users.totalUsers": "إجمالي المستخدمين",
    "users.activeUsers": "المستخدمون النشطون",
    "users.inactiveUsers": "المستخدمون غير النشطين",
    "users.usersByRole": "المستخدمون حسب الدور",
    "users.accountStatus": "حالة الحساب",
    "users.activeDescription": "المستخدم نشط ويمكنه الوصول للنظام",
    "users.inactiveDescription": "المستخدم غير نشط ولا يمكنه الوصول للنظام",

    // Roles
    "roles.title": "إدارة الأدوار",
    "roles.name": "اسم الدور",
    "roles.description": "الوصف",
    "roles.active": "نشط",
    "roles.order": "الترتيب",
    "roles.permissions": "الصلاحيات",
    "roles.assignActions": "تعيين الصلاحيات",
    "roles.selectRole": "اختر دوراً",
    "roles.role": "الدور",

    // Actions/Permissions
    "actions.title": "إدارة الصلاحيات",
    "actions.name": "اسم الصلاحية",
    "actions.category": "الفئة",
    "actions.description": "الوصف",
    "actions.userManagement": "إدارة المستخدمين",
    "actions.projectManagement": "إدارة المشاريع",
    "actions.roleManagement": "إدارة الأدوار",
    "actions.systemAdmin": "إدارة النظام",
    "actions.defaultActions": "صلاحيات افتراضية",
    "actions.defaultActionsForRole": "الصلاحيات الافتراضية للدور",
    "actions.defaultActionsNote": "هذه الصلاحيات تُمنح تلقائياً مع هذا الدور ولا يمكن إزالتها.",
    "actions.totalActions": "إجمالي الصلاحيات",
    "actions.defaultFromRole": "افتراضية من الدور",
        "actions.additionalSelected": "مختارة إضافياً",
    "actions.scrollToSeeMore": "مرر لرؤية المزيد من الفئات",
    "actions.totalAvailable": "صلاحية متاحة إجمالاً",

    // Permissions
    "permissions.create": "إنشاء",
    "permissions.read": "قراءة",
    "permissions.update": "تحديث",
    "permissions.delete": "حذف",
    "permissions.admin": "مدير النظام",
    "permissions.denied": "الوصول مرفوض",
    "permissions.insufficient": "صلاحيات غير كافية لتنفيذ هذا الإجراء",

    // Project Status Options
    "projectStatus.planning": "تخطيط",
    "projectStatus.active": "نشط",
    "projectStatus.onHold": "معلق",
    "projectStatus.completed": "مكتمل",
    "projectStatus.cancelled": "ملغي",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar"); // Default to Arabic
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  useEffect(() => {
    // Check for saved language preference first
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ar")) {
      setLanguageState(savedLanguage); // Use setLanguageState to avoid infinite loop
      document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = savedLanguage;
    } else {
      // Default to Arabic if no saved preference
      setLanguageState("ar");
      localStorage.setItem("language", "ar");
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    }
  }, []);

  // Handle language changes and update document direction
  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
