import React, { useEffect, useState } from "react";
import { FolderKanban, ListChecks, FileText, Users } from "lucide-react";
import { Card } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

import { useLanguage } from "@/contexts/LanguageContext";
import { useQuickStats } from "@/hooks";
import { cn } from "@/utils/cn";

interface StatItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  getValue: (stats: any) => number;
}

const statItems: StatItem[] = [
  {
    key: "dashboard.activeProjects",
    icon: FolderKanban,
    getValue: (stats) => stats?.activeProjects || 0,
  },
  {
    key: "dashboard.totalTasks",
    icon: ListChecks,
    getValue: (stats) => stats?.totalTasks || 0,
  },
  {
    key: "dashboard.activeProjectRequirements",
    icon: FileText,
    getValue: (stats) => stats?.activeProjectRequirements || 0,
  },
  {
    key: "dashboard.teamMembers",
    icon: Users,
    getValue: (stats) => stats?.teamMembers || 0,
  },
];

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const start = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(startValue + (value - startValue) * easedProgress),
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function ModernQuickStats() {
  const { t } = useLanguage();
  const { stats, loading, error } = useQuickStats();

  // Show loading skeleton while fetching data
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => (
          <Card
            key={index}
            className="relative overflow-hidden p-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-10 w-20 rounded-lg mb-2" />
                <Skeleton className="h-4 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-14 w-14 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.key}
              className={cn(
                "relative overflow-hidden p-6 transition-all duration-300",
                "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-800/50 dark:to-red-900/30",
                "border border-red-200/50 dark:border-red-700/50",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                    --
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {t(item.key)}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-3 rounded-full",
                    "bg-red-200/50 dark:bg-red-700/30",
                  )}
                >
                  <Icon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        const value = stat.getValue(stats);

        return (
          <Card
            key={stat.key}
            className={cn(
              "relative overflow-hidden p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
              "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/30",
              "border border-gray-200/50 dark:border-gray-700/50",
              "backdrop-blur-sm",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  <AnimatedNumber value={value} />
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t(stat.key)}
                </p>
              </div>
              <div
                className={cn(
                  "p-3 rounded-full",
                  `bg-white/20 dark:bg-white/10`,
                  "backdrop-blur-sm",
                )}
              >
                <Icon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-30" />
          </Card>
        );
      })}
    </div>
  );
}
