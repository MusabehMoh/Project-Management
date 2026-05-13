import { useState, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Plus, Calendar, User, Flag } from "lucide-react";
import { parseDate } from "@internationalized/date";
import { apiClient } from "@/services/api/client";

interface Task {
  id: number;
  name: string;
  status: "ToDo" | "InProgress" | "InReview" | "Completed";
  priority: "Low" | "Medium" | "High";
  endDate: string;
  assigneeName?: string;
  assigneeId?: number;
  progress: number;
}

interface Employee {
  prsId: number;
  fullName: string;
  activeTasks?: number;
  workloadLevel?: string;
}

interface ProjectKanbanProps {
  projectId: number;
  tasks: Task[];
  employees: Employee[];
  onTasksChange: () => void;
}

const columns: { key: Task["status"]; label: string; color: string }[] = [
  { key: "ToDo", label: "لم تبدأ", color: "bg-default-100" },
  { key: "InProgress", label: "جارية", color: "bg-primary-50" },
  { key: "InReview", label: "مراجعة", color: "bg-warning-50" },
  { key: "Completed", label: "منجزة", color: "bg-success-50" },
];

const priorityColors: Record<string, "danger" | "warning" | "primary" | "default"> = {
  High: "danger",
  Medium: "warning",
  Low: "primary",
};

const workloadBadge = (level?: string) => {
  if (!level) return null;
  const map: Record<string, string> = {
    Free: "●○○○○",
    Light: "●●○○○",
    Moderate: "●●●○○",
    Heavy: "●●●●○",
    Overloaded: "●●●●●",
  };
  return map[level] ?? "";
};

export function ProjectKanban({ projectId, tasks, employees, onTasksChange }: ProjectKanbanProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [newTask, setNewTask] = useState({ name: "", assigneeId: "", priority: "Medium", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const handleDragStart = (taskId: number) => setDraggingId(taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggingId === null) return;
    try {
      await apiClient.patch(`/tasks/${draggingId}/status`, { status });
      onTasksChange();
    } catch (err) {
      console.error(err);
    }
    setDraggingId(null);
  };

  const handleQuickAdd = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || !quickInput.trim()) return;
    try {
      await apiClient.post(`/tasks`, {
        name: quickInput.trim(),
        projectId,
        status: "ToDo",
        priority: "Medium",
      });
      setQuickInput("");
      onTasksChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTask = async () => {
    if (!newTask.name.trim()) return;
    setSaving(true);
    try {
      await apiClient.post(`/tasks`, {
        name: newTask.name,
        projectId,
        assigneeId: newTask.assigneeId ? parseInt(newTask.assigneeId) : undefined,
        priority: newTask.priority,
        endDate: newTask.endDate || undefined,
        status: "ToDo",
      });
      setNewTask({ name: "", assigneeId: "", priority: "Medium", endDate: "" });
      onClose();
      onTasksChange();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Row */}
      <div className="flex gap-2 items-center">
        <Input
          className="flex-1"
          placeholder="+ اكتب مهمة جديدة واضغط Enter..."
          startContent={<Plus size={16} className="text-default-400" />}
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={handleQuickAdd}
        />
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          إضافة مهمة
        </Button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-xl p-3 ${col.color} min-h-[200px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">{col.label}</span>
                <Chip size="sm" variant="flat">{colTasks.length}</Chip>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    className="bg-background rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    onDragStart={() => handleDragStart(task.id)}
                  >
                    <p className="text-sm font-medium mb-2">{task.name}</p>
                    <div className="flex items-center justify-between">
                      <Chip color={priorityColors[task.priority]} size="sm" variant="dot">
                        {task.priority === "High" ? "عالية" : task.priority === "Medium" ? "متوسطة" : "منخفضة"}
                      </Chip>
                      {task.endDate && (
                        <div className="flex items-center gap-1 text-xs text-default-400">
                          <Calendar size={10} />
                          {new Date(task.endDate).toLocaleDateString("ar-SA")}
                        </div>
                      )}
                    </div>
                    {task.assigneeName && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-default-500">
                        <User size={10} />
                        {task.assigneeName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>إضافة مهمة جديدة</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              isRequired
              label="عنوان المهمة"
              placeholder="أدخل عنوان المهمة..."
              value={newTask.name}
              onChange={(e) => setNewTask((p) => ({ ...p, name: e.target.value }))}
            />
            <Select
              label="الموظف المسؤول"
              placeholder="اختر موظفاً..."
              selectedKeys={newTask.assigneeId ? [newTask.assigneeId] : []}
              onChange={(e) => setNewTask((p) => ({ ...p, assigneeId: e.target.value }))}
            >
              {employees.map((emp) => (
                <SelectItem
                  key={emp.prsId}
                  value={emp.prsId}
                  description={
                    emp.activeTasks !== undefined
                      ? `${workloadBadge(emp.workloadLevel)} ${emp.activeTasks} مهام نشطة`
                      : undefined
                  }
                >
                  {emp.fullName}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="الأولوية"
              selectedKeys={[newTask.priority]}
              onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
            >
              <SelectItem key="High" value="High" startContent={<Flag className="text-danger" size={14} />}>عالية</SelectItem>
              <SelectItem key="Medium" value="Medium" startContent={<Flag className="text-warning" size={14} />}>متوسطة</SelectItem>
              <SelectItem key="Low" value="Low" startContent={<Flag className="text-primary" size={14} />}>منخفضة</SelectItem>
            </Select>
            <Input
              label="الموعد النهائي"
              type="date"
              value={newTask.endDate}
              onChange={(e) => setNewTask((p) => ({ ...p, endDate: e.target.value }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>إلغاء</Button>
            <Button color="primary" isLoading={saving} onPress={handleSaveTask}>إضافة</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
