import { useState, useEffect } from "react";
import { pipelineService, type PipelineProject, type PipelineStats } from "@/services/api/pipelineService";

interface UsePipelineReturn {
  planning: PipelineProject[];
  inProgress: PipelineProject[];
  completed: PipelineProject[];
  stats: PipelineStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePipeline = (): UsePipelineReturn => {
  const [planning, setPlanning] = useState<PipelineProject[]>([]);
  const [inProgress, setInProgress] = useState<PipelineProject[]>([]);
  const [completed, setCompleted] = useState<PipelineProject[]>([]);
  const [stats, setStats] = useState<PipelineStats>({ planning: 0, inProgress: 0, completed: 0 });
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
        setStats(response.data.stats);
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
    stats,
    loading,
    error,
    refetch: fetchPipelineData,
  };
};
