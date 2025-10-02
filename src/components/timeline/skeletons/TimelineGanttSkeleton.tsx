import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

import { useLanguage } from "@/contexts/LanguageContext";
interface TimelineGanttSkeletonProps {
  height?: string;
}
export default function TimelineGanttSkeleton({
  height = "600px",
}: TimelineGanttSkeletonProps) {
  const { language } = useLanguage();
  const direction = language === "ar" ? "rtl" : "ltr";

  return (
    <Card className="h-full">
      <CardBody
        className={`p-0 ${direction === "rtl" ? "text-right" : "text-left"}`}
      >
        <div className="h-full flex flex-col" style={{ height }}>
          {/* Gantt Header */}
          <div className="border-b p-4 space-y-3">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-8 w-18 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            {/* Date Range Selector */}
            <div className="flex gap-4 items-center">
              <Skeleton className="h-6 w-16 rounded" />
              <Skeleton className="h-8 w-32 rounded" />
              <Skeleton className="h-6 w-8 rounded" />
              <Skeleton className="h-8 w-32 rounded" />
            </div>
            {/* Scale Selector */}
            <div className="flex gap-2">
              <Skeleton className="h-7 w-12 rounded" />
              <Skeleton className="h-7 w-14 rounded" />
              <Skeleton className="h-7 w-16 rounded" />
              <Skeleton className="h-7 w-18 rounded" />
            </div>
          </div>
          {/* Gantt Chart Content */}
          <div className="flex-1 flex">
            {/* Left Panel - Task List */}
            <div className="w-1/3 border-r">
              {/* Column Headers */}
              <div className="border-b p-3 bg-default-50">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-14 rounded" />
                </div>
              </div>
              {/* Task Rows */}
              <div className="space-y-0">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <div
                    key={index}
                    className="border-b p-3 h-12 flex items-center gap-3"
                  >
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1">
                      <Skeleton
                        className={`h-4 rounded ${
                          index % 3 === 0 ? "w-3/4" : "w-full"
                        }`}
                      />
                    </div>
                    <Skeleton className="h-3 w-8 rounded-full" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            {/* Right Panel - Timeline Chart */}
            <div className="flex-1 bg-default-25">
              {/* Timeline Header */}
              <div className="border-b p-2 bg-default-50 h-16">
                <div className="flex gap-1 h-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                    <div key={month} className="flex-1 text-center">
                      <Skeleton className="h-4 w-8 rounded mx-auto mb-1" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-4 rounded" />
                        <Skeleton className="h-3 w-4 rounded" />
                        <Skeleton className="h-3 w-4 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Timeline Bars */}
              <div className="space-y-0">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <div
                    key={index}
                    className="border-b h-12 flex items-center px-4 relative"
                  >
                    <div className="absolute inset-0 flex items-center px-4">
                      <div
                        className={`h-6 bg-gradient-to-r from-primary-200 to-primary-400 rounded-sm ${
                          index % 4 === 0
                            ? "w-1/4"
                            : index % 3 === 0
                              ? "w-1/3"
                              : index % 2 === 0
                                ? "w-1/2"
                                : "w-2/3"
                        }`}
                        style={{
                          marginLeft: `${(index * 8) % 40}%`,
                        }}
                      >
                        <div className="w-full h-full bg-primary-300 rounded-sm animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
