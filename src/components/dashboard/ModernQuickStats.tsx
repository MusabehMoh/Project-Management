import React, { useEffect, useState } from "react";
import {
  FolderKanban,
  ListChecks,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@heroui/card";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/utils/cn";

interface StatItem {
  key: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

const stats: StatItem[] = [
  {
    key: "dashboard.activeProjects",
    value: 3,
    icon: FolderKanban,
  },
  {
    key: "dashboard.totalTasks",
    value: 22,
    icon: ListChecks,
  },
  {
    key: "dashboard.inProgress",
    value: 5,
    icon: Activity,
  },
  {
    key: "dashboard.overdue",
    value: 2,
    icon: AlertTriangle,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;

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
                  <AnimatedNumber value={stat.value} />
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
