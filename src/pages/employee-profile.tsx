import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, BarChart2 } from "lucide-react";
import { apiClient } from "@/services/api/client";

interface EmployeeTask {
  taskId: number;
  taskName: string;
  status: string;
  priority: string;
  progress: number;
  endDate: string;
  isOverdue: boolean;
}

interface EmployeePerformance {
  employeeId: number;
  fullName: string;
  jobTitle: string;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  inReviewTasks: number;
  overdueTasks: number;
  completionRate: number;
  onTimeCompletionRate: number;
  tasks: EmployeeTask[];
}

const statusColors: Record<string, "success" | "primary" | "warning" | "danger" | "default"> = {
  Completed: "success",
  InProgress: "primary",
  InReview: "warning",
  ToDo: "default",
};

const priorityColors: Record<string, "danger" | "warning" | "primary" | "default"> = {
  High: "danger",
  Medium: "warning",
  Low: "primary",
  None: "default",
};

export default function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!employeeId) return;
    apiClient
      .get(`/workload/employee/${employeeId}`)
      .then((res) => setProfile(res.data?.data ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <div className="text-center py-20 text-default-400">جاري التحميل...</div>;
  if (!profile) return <div className="text-center py-20 text-danger">لم يتم العثور على الموظف</div>;

  const filteredTasks = profile.tasks.filter((t) =>
    statusFilter === "all" ? true :
    statusFilter === "overdue" ? t.isOverdue :
    t.status === statusFilter
  );

  return (
    <div className="py-6 space-y-6">
      {/* Back Button */}
      <Button
        isIconOnly={false}
        startContent={<ArrowLeft size={16} />}
        variant="light"
        onPress={() => navigate("/workload")}
      >
        العودة
      </Button>

      {/* Employee Header */}
      <Card>
        <CardBody className="flex flex-row items-center gap-6 py-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            {profile.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.fullName}</h1>
            <p className="text-default-500">{profile.jobTitle}</p>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center py-4">
            <CheckCircle className="mx-auto mb-2 text-success" size={24} />
            <p className="text-2xl font-bold text-success">{profile.completedTasks}</p>
            <p className="text-sm text-default-500">منجزة</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <Clock className="mx-auto mb-2 text-primary" size={24} />
            <p className="text-2xl font-bold text-primary">{profile.activeTasks}</p>
            <p className="text-sm text-default-500">جارية</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <AlertCircle className="mx-auto mb-2 text-danger" size={24} />
            <p className="text-2xl font-bold text-danger">{profile.overdueTasks}</p>
            <p className="text-sm text-default-500">متأخرة</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <BarChart2 className="mx-auto mb-2 text-warning" size={24} />
            <p className="text-2xl font-bold text-warning">{profile.completionRate}%</p>
            <p className="text-sm text-default-500">معدل الإنجاز</p>
          </CardBody>
        </Card>
      </div>

      {/* Completion Rates */}
      <Card>
        <CardHeader><h3 className="font-semibold">مؤشرات الأداء</h3></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>معدل الإنجاز الإجمالي</span>
              <span className="font-semibold">{profile.completionRate}%</span>
            </div>
            <Progress
              color={profile.completionRate >= 75 ? "success" : profile.completionRate >= 50 ? "warning" : "danger"}
              value={profile.completionRate}
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>الإنجاز في الوقت المحدد</span>
              <span className="font-semibold">{profile.onTimeCompletionRate}%</span>
            </div>
            <Progress
              color={profile.onTimeCompletionRate >= 75 ? "success" : profile.onTimeCompletionRate >= 50 ? "warning" : "danger"}
              value={profile.onTimeCompletionRate}
            />
          </div>
        </CardBody>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold">المهام ({profile.totalTasks})</h3>
          <div className="flex gap-2">
            {["all", "InProgress", "ToDo", "InReview", "Completed", "overdue"].map((s) => (
              <Chip
                key={s}
                className="cursor-pointer"
                color={statusFilter === s ? "primary" : "default"}
                size="sm"
                variant={statusFilter === s ? "solid" : "flat"}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "الكل" :
                 s === "InProgress" ? "جارية" :
                 s === "ToDo" ? "لم تبدأ" :
                 s === "InReview" ? "مراجعة" :
                 s === "Completed" ? "منجزة" : "متأخرة"}
              </Chip>
            ))}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.taskId}
              className={`p-3 rounded-lg border ${task.isOverdue ? "border-danger/30 bg-danger/5" : "border-divider"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{task.taskName}</span>
                <div className="flex gap-2">
                  <Chip color={priorityColors[task.priority] ?? "default"} size="sm" variant="flat">
                    {task.priority}
                  </Chip>
                  <Chip color={statusColors[task.status] ?? "default"} size="sm" variant="flat">
                    {task.status === "Completed" ? "منجزة" :
                     task.status === "InProgress" ? "جارية" :
                     task.status === "InReview" ? "مراجعة" : "لم تبدأ"}
                  </Chip>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-default-400">
                  <span>
                    {new Date(task.endDate).toLocaleDateString("ar-SA")}
                    {task.isOverdue && <span className="text-danger mr-2">متأخرة</span>}
                  </span>
                  <span>{task.progress}%</span>
                </div>
                <Progress
                  color={task.isOverdue ? "danger" : task.status === "Completed" ? "success" : "primary"}
                  size="sm"
                  value={task.progress}
                />
              </div>
            </div>
          ))}
          {filteredTasks.length === 0 && (
            <p className="text-center text-default-400 py-4">لا توجد مهام</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
