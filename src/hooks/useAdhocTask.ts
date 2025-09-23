import { useState } from "react";

import { membersTasksService } from "@/services/api/membersTasksService";
import { AdhocTask } from "@/types/membersTasks";
import { addToast } from "@heroui/toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const UseAdhocTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  /// Add adhoc task
  async function addAdhocTask(newTask: AdhocTask): Promise<boolean> {
    setLoading(true);
    setError(null);

    console.log("Adding adhoc task:", newTask);

    try {
      const response = await membersTasksService.addAdhocTask(newTask);

      if (response.success) {
        addToast({
          title: response.message,
          color: "success",
        });

        return true;
      } else {
        setError(response.message || "Failed to add task");
        addToast({
          title: response.message,
          color: "danger",
        });

        return false;
      }
    } catch (e) {
      setError("Something went wrong");
      addToast({
        title: t("common.unexpectedError"),
        color: "danger",
      });

      return false;
    } finally {
      setLoading(false);
    }
  }

  return { addAdhocTask, loading, error };
};
