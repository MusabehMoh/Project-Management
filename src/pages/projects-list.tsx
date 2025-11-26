import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { RefreshCw } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import ProjectsCardList from "@/components/ProjectsCardList";
import { projectService } from "@/services/api/projectService";
import { showErrorToast } from "@/utils/toast";

interface ProjectCardData {
  id: number;
  name: string;
  statusId: number;
  statusName: string;
  startDate: string;
  expectedEndDate: string;
  teamMembers?: Array<{
    id: number;
    fullName: string;
    avatar?: string;
  }>;
  budget?: number;
}

export default function ProjectsPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch projects with timelines only
      const response = await projectService.getProjects(1, 1000);

      if (response.data) {
        // Filter only projects that have timelines
        const projectsWithTimelines = response.data
          .filter((project) => project.hasTimeline === true)
          .map((project) => ({
            id: project.id,
            name: project.name,
            statusId: project.statusId,
            statusName: project.statusName || "",
            startDate: project.startDate,
            expectedEndDate: project.expectedEndDate,
            teamMembers: [], // Can be populated if available
            budget: project.budget,
          }));

        setProjects(projectsWithTimelines);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      showErrorToast(t("timeline.errorFetchingProjects"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectClick = (project: ProjectCardData) => {
    console.log("Project clicked:", project);
    // Navigate to project details or timeline
    window.location.href = `/timeline?projectId=${project.id}`;
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-4 py-8 md:py-10">
        <div className="flex justify-between items-center">
          <div className="inline-block max-w-lg">
            <h1 className={title()}>{t("timeline.projects")}</h1>
            <p className="text-default-500 mt-2">
              {t("timeline.projectsSubtitle")}
            </p>
          </div>
          <Button
            isIconOnly
            isLoading={loading}
            startContent={!loading ? <RefreshCw className="w-4 h-4" /> : null}
            variant="flat"
            onPress={fetchProjects}
          />
        </div>

        <ProjectsCardList
          loading={loading}
          projects={projects}
          onProjectClick={handleProjectClick}
        />
      </section>
    </DefaultLayout>
  );
}
