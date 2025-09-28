import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import DHTMLXGantt from "@/components/timeline/GanttChart/dhtmlx/DhtmlxGantt";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTimelines } from "@/hooks/useTimelines";

const GanttChartFullScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const projectId = location.state?.projectId; // ✅ pass projectId when navigating
  const timeline = location.state?.timeline;

  const { deleteEntity, updateEntity } = useTimelines(projectId);

  if (!timeline) {
    return <div>No timeline data provided</div>;
  }

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-end p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          aria-label="Close fullscreen Gantt chart"
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Close Page"
          onClick={handleClose}
        >
          <span className="text-gray-700 dark:text-gray-200 font-medium select-none">
            {t("timelane.back")}
          </span>
          <span className="flex items-center justify-center w-7 h-7 bg-gray-300 dark:bg-gray-700 rounded-full">
            <X className="h-4 w-4 text-gray-700 dark:text-gray-200" />
          </span>
        </button>
      </header>

      {/* Chart fills the rest */}
      <main className="flex-grow min-h-0">
        <div className="w-full h-full">
          <DHTMLXGantt
            isFullScreen={true}
            projectId={projectId}
            timeline={timeline}
            onDeleteEntity={deleteEntity}
            onUpdateEntity={updateEntity}
          />
        </div>
      </main>
    </div>
  );
};

export default GanttChartFullScreen;
