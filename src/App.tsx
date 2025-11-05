import { Route, Routes } from "react-router-dom";

import IndexPage from "./pages";
import GanttChartFullScreen from "./pages/GanttChartFullScreen";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessDenied } from "@/components/AccessDenied";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import ProjectsPage from "@/pages/projects";
import UsersPage from "@/pages/users";
import CompanyEmployeesPage from "@/pages/company-employees";
import DepartmentsPage from "@/pages/departments";
import DepartmentMembersPage from "@/pages/department-members";
import RequirementsPage from "@/pages/requirements";
import ProjectRequirementsPage from "@/pages/project-requirements";
import DevelopmentRequirementsPage from "@/pages/development-requirements";
import ApprovalRequestsPage from "@/pages/approval-requests";
import TimelinePage from "@/pages/timeline";
import MembersTasksPage from "@/pages/members-tasks";
import DesignRequestsPage from "@/pages/design-requests";
import ProfilePage from "@/pages/profile";
import DefaultLayout from "@/layouts/default";
function App() {
  const { user, loading } = useCurrentUser();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">{t("access.denied.loading")}</div>
      </div>
    );
  }

  if (!user || !user.roles || user.roles.length === 0) {
    return <AccessDenied />;
  }

  return (
    <Routes>
      <Route element={<DefaultLayout />} path="/">
        <Route index element={<IndexPage />} />
        <Route element={<ProjectsPage />} path="projects" />
        <Route element={<RequirementsPage />} path="requirements" />
        <Route
          element={<ProjectRequirementsPage />}
          path="requirements/:projectId"
        />
        <Route
          element={<DevelopmentRequirementsPage />}
          path="development-requirements"
        />
        <Route element={<ApprovalRequestsPage />} path="approval-requests" />
        <Route element={<UsersPage />} path="users" />
        <Route element={<CompanyEmployeesPage />} path="company-employees" />
        <Route element={<DepartmentsPage />} path="departments" />
        <Route element={<DepartmentMembersPage />} path="department-members" />
        <Route element={<ProfilePage />} path="profile" />
        <Route element={<TimelinePage />} path="timeline" />
        <Route element={<MembersTasksPage />} path="tasks" />
        <Route element={<DesignRequestsPage />} path="design-requests" />
        <Route element={<DocsPage />} path="docs" />
        <Route element={<PricingPage />} path="pricing" />
        <Route element={<BlogPage />} path="blog" />
        <Route element={<AboutPage />} path="about" />
        <Route element={<GanttChartFullScreen />} path="ganttChart" />
      </Route>
    </Routes>
  );
}

export default App;
