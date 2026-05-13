import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/services/api/client";

interface EmployeeWorkload {
  employeeId: number;
  fullName: string;
  jobTitle: string;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  inReviewTasks: number;
  overdueTasks: number;
  completionRate: number;
  workloadLevel: "Free" | "Light" | "Moderate" | "Heavy" | "Overloaded";
}

const workloadColors: Record<string, "success" | "primary" | "warning" | "danger" | "default"> = {
  Free: "success",
  Light: "primary",
  Moderate: "warning",
  Heavy: "danger",
  Overloaded: "danger",
};

export default function WorkloadPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    apiClient
      .get("/workload")
      .then((res) => setEmployees(res.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) => {
    const matchSearch = e.fullName.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "overdue" && e.overdueTasks > 0) ||
      (filter === "overloaded" && (e.workloadLevel === "Heavy" || e.workloadLevel === "Overloaded")) ||
      (filter === "free" && e.workloadLevel === "Free");
    return matchSearch && matchFilter;
  });

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.workload") || "حجم العمل"}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          className="max-w-xs"
          placeholder={t("nav.search") || "بحث..."}
          startContent={<SearchIcon size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["all", "overloaded", "overdue", "free"].map((f) => (
          <Chip
            key={f}
            className="cursor-pointer"
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "solid" : "flat"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "الكل" : f === "overloaded" ? "مثقل" : f === "overdue" ? "متأخر" : "متاح"}
          </Chip>
        ))}
      </div>

      {/* Employee Cards */}
      {loading ? (
        <div className="text-center py-10 text-default-400">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <Card
              key={emp.employeeId}
              isPressable
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onPress={() => navigate(`/employees/${emp.employeeId}`)}
            >
              <CardHeader className="flex items-center justify-between pb-2">
                <div>
                  <p className="font-semibold text-base">{emp.fullName}</p>
                  <p className="text-sm text-default-400">{emp.jobTitle}</p>
                </div>
                <Chip color={workloadColors[emp.workloadLevel]} size="sm" variant="flat">
                  {emp.workloadLevel === "Free" ? "متاح" :
                   emp.workloadLevel === "Light" ? "خفيف" :
                   emp.workloadLevel === "Moderate" ? "متوسط" :
                   emp.workloadLevel === "Heavy" ? "ثقيل" : "مثقل جداً"}
                </Chip>
              </CardHeader>
              <CardBody className="space-y-3 pt-0">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="font-bold text-lg text-primary">{emp.activeTasks}</p>
                    <p className="text-default-400 text-xs">نشطة</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-success">{emp.completedTasks}</p>
                    <p className="text-default-400 text-xs">منجزة</p>
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${emp.overdueTasks > 0 ? "text-danger" : "text-default-400"}`}>
                      {emp.overdueTasks}
                    </p>
                    <p className="text-default-400 text-xs">متأخرة</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-default-500">
                    <span>معدل الإنجاز</span>
                    <span>{emp.completionRate}%</span>
                  </div>
                  <Progress
                    color={emp.completionRate >= 75 ? "success" : emp.completionRate >= 50 ? "warning" : "danger"}
                    size="sm"
                    value={emp.completionRate}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-10 text-default-400">
              لا توجد نتائج
            </div>
          )}
        </div>
      )}
    </div>
  );
}
