import { useState } from "react";
import { addToast } from "@heroui/toast";

import { membersTasksService } from "@/services/api/membersTasksService";
import { AdhocTask } from "@/types/membersTasks";
import { useLanguage } from "@/contexts/LanguageContext";

export const UseAdhocTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  /// Add adhoc task
  async function addAdhocTask(newTask: AdhocTask): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const response = await membersTasksService.addAdhocTask(newTask);

      if (response.success) {
        addToast({
          title: t("toast.adhocTaskCreated"),
          color: "success",
        });

        return true;
      } else {
        const errorMessage =
          response.message || t("toast.adhocTaskCreateError");

        setError(errorMessage);
        addToast({
          title: errorMessage,
          color: "danger",
        });

        return false;
      }
    } catch {
      const errorMessage = t("toast.adhocTaskCreateError");

      setError(errorMessage);
      addToast({
        title: errorMessage,
        color: "danger",
      });

      return false;
    } finally {
      setLoading(false);
    }
  }

  return { addAdhocTask, loading, error };
};
