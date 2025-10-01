import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
interface TimelineTreeSkeletonProps {
  showSearch?: boolean;
}
export default function TimelineTreeSkeleton({
  showSearch = true,
}: TimelineTreeSkeletonProps) {
  const { language } = useLanguage();
  const direction = language === "ar" ? "rtl" : "ltr";
  return (
    <Card className="h-full">
      <CardBody
        className={`p-4 ${direction === "rtl" ? "text-right" : "text-left"}`}
      >
        {/* Color Legend Skeleton */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-22 rounded-full" />
        </div>
        {/* Search Bar Skeleton */}
        {showSearch && (
          <div className="mb-4">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        )}
        {/* Timeline Header Skeleton */}
        <div className="mb-4 p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-48 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-18 rounded-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
        {/* Sprint Skeletons */}
        {[1, 2, 3].map((sprintIndex) => (
          <div key={sprintIndex} className="mb-4 ml-4 p-3 border rounded-lg">
            {/* Sprint Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
            {/* Sprint Stats */}
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            {/* Sprint Progress */}
            <div className="space-y-1 mb-3">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            {/* Task Skeletons */}
            {[1, 2].map((taskIndex) => (
              <div key={taskIndex} className="ml-4 mb-3 p-2 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                </div>
                {/* Task Stats */}
                <div className="flex gap-2 mb-1">
                  <Skeleton className="h-3 w-12 rounded-full" />
                  <Skeleton className="h-3 w-14 rounded-full" />
                  <Skeleton className="h-3 w-10 rounded-full" />
                </div>
                {/* Task Progress */}
                <Skeleton className="h-2 w-full rounded-full" />
                {/* Subtask Skeletons (only for first task) */}
                {taskIndex === 1 &&
                  [1].map((subtaskIndex) => (
                    <div
                      key={subtaskIndex}
                      className="ml-4 mt-2 p-2 border-l border-dashed border-default-300"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-3 rounded" />
                          <Skeleton className="h-3 w-24 rounded" />
                        </div>
                        <div className="flex gap-1">
                          <Skeleton className="h-5 w-5 rounded" />
                          <Skeleton className="h-5 w-5 rounded" />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Skeleton className="h-3 w-10 rounded-full" />
                        <Skeleton className="h-3 w-12 rounded-full" />
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}
        {/* Load More Skeleton */}
        <div className="text-center mt-4">
          <Skeleton className="h-8 w-24 rounded mx-auto" />
        </div>
      </CardBody>
    </Card>
  );
}

