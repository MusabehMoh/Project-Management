import { Route, Routes } from "react-router-dom";

import IndexPage from "./pages";
import GanttChartFullScreen from "./pages/GanttChartFullScreen";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessDenied } from "@/components/AccessDenied";
import { TasksTest } from "@/components/TasksTest";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import ProjectsPage from "@/pages/projects";
import UsersPage from "@/pages/users";
import DepartmentsPage from "@/pages/departments";
import RequirementsPage from "@/pages/requirements";
import ProjectRequirementsPage from "@/pages/project-requirements";
import DevelopmentRequirementsPage from "@/pages/development-requirements";
import TimelinePage from "@/pages/timeline";
import MembersTasksPage from "@/pages/members-tasks";
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
        <Route element={<UsersPage />} path="users" />
        <Route element={<DepartmentsPage />} path="departments" />
        <Route element={<TimelinePage />} path="timeline" />
        <Route element={<TasksTest />} path="test-tasks" />
        <Route element={<MembersTasksPage />} path="tasks" />
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
