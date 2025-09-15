import { useState, useEffect } from "react";
import { pipelineService, type PipelineProject } from "@/services/api/pipelineService";

interface UsePipelineReturn {
  planning: PipelineProject[];
  inProgress: PipelineProject[];
  completed: PipelineProject[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePipeline = (): UsePipelineReturn => {
  const [planning, setPlanning] = useState<PipelineProject[]>([]);
  const [inProgress, setInProgress] = useState<PipelineProject[]>([]);
  const [completed, setCompleted] = useState<PipelineProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelineData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await pipelineService.getPipelineProjects();
      
      if (response.success) {
        setPlanning(response.data.planning);
        setInProgress(response.data.inProgress);
        setCompleted(response.data.completed);
      } else {
        setError(response.message || "Failed to fetch pipeline data");
      }
    } catch (err) {
      console.error("Pipeline hook error:", err);
      setError("An error occurred while loading pipeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  return {
    planning,
    inProgress,
    completed,
    loading,
    error,
    refetch: fetchPipelineData,
  };
};
