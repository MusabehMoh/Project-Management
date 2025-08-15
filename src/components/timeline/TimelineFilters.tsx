import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";

import { 
  TimelineFilters as ITimelineFilters,
  Department,
  Resource,
  TaskStatus,
  TaskPriority
} from "@/types/timeline";

interface TimelineFiltersProps {
  filters: ITimelineFilters;
  departments: Department[];
  resources: Resource[];
  onFiltersChange: (filters: Partial<ITimelineFilters>) => void;
  onClearFilters: () => void;
}

const statusOptions: { key: TaskStatus; label: string; color: any }[] = [
  { key: 'not-started', label: 'Not Started', color: 'default' },
  { key: 'in-progress', label: 'In Progress', color: 'primary' },
  { key: 'completed', label: 'Completed', color: 'success' },
  { key: 'on-hold', label: 'On Hold', color: 'warning' },
  { key: 'cancelled', label: 'Cancelled', color: 'danger' },
];

const priorityOptions: { key: TaskPriority; label: string; color: any }[] = [
  { key: 'low', label: 'Low', color: 'default' },
  { key: 'medium', label: 'Medium', color: 'primary' },
  { key: 'high', label: 'High', color: 'warning' },
  { key: 'critical', label: 'Critical', color: 'danger' },
];

export default function TimelineFilters({
  filters,
  departments,
  resources,
  onFiltersChange,
  onClearFilters
}: TimelineFiltersProps) {

  const handleDepartmentChange = (selectedDepts: string[]) => {
    onFiltersChange({ departments: selectedDepts });
  };

  const handleResourceChange = (selectedResources: string[]) => {
    onFiltersChange({ resources: selectedResources });
  };

  const handleStatusChange = (selectedStatus: string[]) => {
    onFiltersChange({ status: selectedStatus as TaskStatus[] });
  };

  const handlePriorityChange = (selectedPriorities: string[]) => {
    onFiltersChange({ priority: selectedPriorities as TaskPriority[] });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ search });
  };

  const hasActiveFilters = 
    filters.departments.length > 0 ||
    filters.resources.length > 0 ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    (filters.search && filters.search.length > 0);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Input
          label="Search"
          placeholder="Search timelines, sprints, tasks, or subtasks..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          isClearable
          className="w-full"
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-default-700">Active Filters</p>
            <Button
              size="sm"
              variant="light"
              color="danger"
              onPress={onClearFilters}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.departments.map(dept => (
              <Chip
                key={dept}
                size="sm"
                variant="flat"
                color="primary"
                onClose={() => handleDepartmentChange(filters.departments.filter(d => d !== dept))}
              >
                Dept: {departments.find(d => d.id === dept)?.name || dept}
              </Chip>
            ))}
            {filters.resources.map(res => (
              <Chip
                key={res}
                size="sm"
                variant="flat"
                color="secondary"
                onClose={() => handleResourceChange(filters.resources.filter(r => r !== res))}
              >
                Resource: {resources.find(r => r.id === res)?.name || res}
              </Chip>
            ))}
            {filters.status.map(status => (
              <Chip
                key={status}
                size="sm"
                variant="flat"
                color={statusOptions.find(s => s.key === status)?.color || 'default'}
                onClose={() => handleStatusChange(filters.status.filter(s => s !== status))}
              >
                Status: {statusOptions.find(s => s.key === status)?.label || status}
              </Chip>
            ))}
            {filters.priority.map(priority => (
              <Chip
                key={priority}
                size="sm"
                variant="flat"
                color={priorityOptions.find(p => p.key === priority)?.color || 'default'}
                onClose={() => handlePriorityChange(filters.priority.filter(p => p !== priority))}
              >
                Priority: {priorityOptions.find(p => p.key === priority)?.label || priority}
              </Chip>
            ))}
            {filters.search && (
              <Chip
                size="sm"
                variant="flat"
                color="default"
                onClose={() => handleSearchChange('')}
              >
                Search: "{filters.search}"
              </Chip>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments */}
        <div>
          <p className="text-sm font-medium text-default-700 mb-3">Departments</p>
          <CheckboxGroup
            value={filters.departments}
            onValueChange={handleDepartmentChange}
            className="gap-2"
          >
            {departments.map((dept) => (
              <Checkbox
                key={dept.id}
                value={dept.id}
                classNames={{
                  label: "text-sm",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span>{dept.name}</span>
                  {dept.description && (
                    <span className="text-xs text-default-500">
                      ({dept.description})
                    </span>
                  )}
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>

        {/* Resources */}
        <div>
          <p className="text-sm font-medium text-default-700 mb-3">Resources</p>
          <CheckboxGroup
            value={filters.resources}
            onValueChange={handleResourceChange}
            className="gap-2"
          >
            {resources.map((resource) => (
              <Checkbox
                key={resource.id}
                value={resource.id}
                classNames={{
                  label: "text-sm",
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{resource.name}</span>
                  <span className="text-xs text-default-500">
                    ({resource.type} - {resource.department})
                  </span>
                  {!resource.isAvailable && (
                    <Chip size="sm" color="danger" variant="flat">
                      Unavailable
                    </Chip>
                  )}
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm font-medium text-default-700 mb-3">Task Status</p>
          <CheckboxGroup
            value={filters.status}
            onValueChange={handleStatusChange}
            className="gap-2"
          >
            {statusOptions.map((status) => (
              <Checkbox
                key={status.key}
                value={status.key}
                classNames={{
                  label: "text-sm",
                }}
              >
                <div className="flex items-center gap-2">
                  <Chip
                    size="sm"
                    color={status.color}
                    variant="flat"
                    className="min-w-0"
                  >
                    {status.label}
                  </Chip>
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>

        {/* Priority */}
        <div>
          <p className="text-sm font-medium text-default-700 mb-3">Task Priority</p>
          <CheckboxGroup
            value={filters.priority}
            onValueChange={handlePriorityChange}
            className="gap-2"
          >
            {priorityOptions.map((priority) => (
              <Checkbox
                key={priority.key}
                value={priority.key}
                classNames={{
                  label: "text-sm",
                }}
              >
                <div className="flex items-center gap-2">
                  <Chip
                    size="sm"
                    color={priority.color}
                    variant="flat"
                    className="min-w-0"
                  >
                    {priority.label}
                  </Chip>
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>
      </div>
    </div>
  );
}
