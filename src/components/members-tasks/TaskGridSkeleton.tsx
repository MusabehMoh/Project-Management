import { Card, CardBody, CardHeader } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

export const TaskGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start w-full gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          </CardHeader>

          <CardBody className="pt-0 space-y-4">
            {/* Department indicator */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>

            {/* Assignees */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-lg" />
              <div className="flex items-center gap-2 p-2 border rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex flex-col gap-1 flex-1">
                  <Skeleton className="h-3 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16 rounded-lg" />
                <Skeleton className="h-4 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            {/* Time tracking */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-12 rounded-lg" />
                  <Skeleton className="h-4 w-8 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-16 rounded-lg" />
                  <Skeleton className="h-4 w-8 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Dates */}
            <Skeleton className="h-3 w-full rounded-lg" />

            {/* Tags */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>

            {/* Project & Requirement */}
            <div className="pt-3 border-t border-divider space-y-2">
              <div className="space-y-1">
                <Skeleton className="h-3 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-2/3 rounded-lg" />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
