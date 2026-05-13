import { Route, Routes } from "react-router-dom";

import IndexPage from "./pages";
import GanttChartFullScreen from "./pages/GanttChartFullScreen";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessDenied } from "@/components/AccessDenied";
import ProjectsPage from "@/pages/projects";
import UsersPage from "@/pages/users";
import EmployeesPage from "@/pages/company-employees";
import TimelinePage from "@/pages/timeline";
import ProfilePage from "@/pages/profile";
import ProjectTasksPage from "@/pages/members-tasks";
import WorkloadPage from "@/pages/workload";
import EmployeeProfilePage from "@/pages/employee-profile";
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
        <Route element={<ProjectTasksPage />} path="projects/:projectId/tasks" />
        <Route element={<EmployeesPage />} path="employees" />
        <Route element={<WorkloadPage />} path="workload" />
        <Route element={<EmployeeProfilePage />} path="employees/:employeeId" />
        <Route element={<UsersPage />} path="users" />
        <Route element={<TimelinePage />} path="timeline" />
        <Route element={<ProfilePage />} path="profile" />
        <Route element={<GanttChartFullScreen />} path="ganttChart" />
      </Route>
    </Routes>
  );
}

export default App;
