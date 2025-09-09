import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@heroui/toast";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessDenied } from "@/components/AccessDenied";
import DashboardPage from "@/pages/dashboard";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import ProjectsPage from "@/pages/projects";
import UsersPage from "@/pages/users";
import DepartmentsPage from "@/pages/departments";
import RequirementsPage from "@/pages/requirements";
import ProjectRequirementsPage from "@/pages/project-requirements";
import TimelinePage from "@/pages/timeline";
import MembersTasksPage from "@/pages/members-tasks";
import { TasksTest } from "@/components/TasksTest";
import IndexPage from "./pages";
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
    <>
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<ProjectsPage />} path="/projects" />
        <Route element={<RequirementsPage />} path="/requirements" />
        <Route
          element={<ProjectRequirementsPage />}
          path="/requirements/:projectId"
        />
        <Route element={<UsersPage />} path="/users" />
        <Route element={<DepartmentsPage />} path="/departments" />
        <Route element={<TimelinePage />} path="/timeline" />
        <Route element={<TasksTest />} path="/test-tasks" />
        <Route element={<MembersTasksPage />} path="/tasks" />

        <Route element={<DocsPage />} path="/docs" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<AboutPage />} path="/about" />
      </Routes>
      <ToastProvider placement="bottom-right" />
    </>
  );
}

export default App;
