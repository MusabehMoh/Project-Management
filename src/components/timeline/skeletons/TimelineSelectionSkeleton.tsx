import { Card, CardHeader } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
export default function TimelineSelectionSkeleton() {
  const { language } = useLanguage();
  const direction = language === "ar" ? "rtl" : "ltr";
  return (
    <Card>
      <CardHeader
        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
          direction === "rtl" ? "text-right" : "text-left"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
          {/* Project/Timeline Selector Skeleton */}
          <div className="min-w-[400px]">
            <Skeleton className="h-4 w-32 rounded mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          {/* Quick Stats Skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

