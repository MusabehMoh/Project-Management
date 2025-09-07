// import React from "react";
// import {
//   Card,
//   CardBody,
//   Button,
//   Select,
//   SelectItem,
//   Input,
//   Chip,
//   Spinner,
// } from "@nextui-org/react";

// import {
//   Department,
//   Resource,
//   TimelineFilters as ITimelineFilters,
//   TaskStatus,
//   TaskPriority,
// } from "@/types/timeline";
// import { useLanguage } from "@/contexts/LanguageContext";
// import { useTaskLookups } from "@/hooks/useTaskLookups";

// interface TimelineFiltersProps {
//   filters: ITimelineFilters;
//   departments: Department[];
//   resources: Resource[];
//   onFiltersChange: (filters: Partial<ITimelineFilters>) => void;
//   onClearFilters: () => void;
// }

// export default function TimelineFilters({
//   filters,
//   departments,
//   resources,
//   onFiltersChange,
//   onClearFilters,
// }: TimelineFiltersProps) {
//   const { t, direction } = useLanguage();

//   // Use the new dynamic lookup hooks
//   const {
//     statusOptions,
//     priorityOptions,
//     loading: lookupsLoading,
//     error: lookupsError,
//     getStatusLabel,
//     getStatusColor,
//     getPriorityLabel,
//     getPriorityColor,
//     getPriorityIcon,
//   } = useTaskLookups();

//   // Fallback options in case dynamic loading fails
//   const fallbackStatusOptions = [
//     {
//       key: "not-started",
//       label: t("timeline.filters.notStarted"),
//       color: "default",
//     },
//     {
//       key: "in-progress",
//       label: t("timeline.filters.inProgress"),
//       color: "primary",
//     },
//     {
//       key: "completed",
//       label: t("timeline.filters.completed"),
//       color: "success",
//     },
//     { key: "on-hold", label: t("timeline.filters.onHold"), color: "warning" },
//     {
//       key: "cancelled",
//       label: t("timeline.filters.cancelled"),
//       color: "danger",
//     },
//   ];

//   const fallbackPriorityOptions = [
//     { key: "low", label: t("timeline.filters.low"), color: "default" },
//     { key: "medium", label: t("timeline.filters.medium"), color: "primary" },
//     { key: "high", label: t("timeline.filters.high"), color: "warning" },
//     { key: "critical", label: t("timeline.filters.critical"), color: "danger" },
//   ];

//   // Use dynamic options if available, otherwise use fallback
//   const currentStatusOptions =
//     statusOptions.length > 0 ? statusOptions : fallbackStatusOptions;
//   const currentPriorityOptions =
//     priorityOptions.length > 0 ? priorityOptions : fallbackPriorityOptions;

//   const handleDepartmentChange = (selectedDepts: string[]) => {
//     onFiltersChange({ departments: selectedDepts });
//   };

//   const handleResourceChange = (selectedResources: string[]) => {
//     onFiltersChange({ resources: selectedResources });
//   };

//   const handleStatusChange = (selectedStatuses: string[]) => {
//     onFiltersChange({ status: selectedStatuses as TaskStatus[] });
//   };

//   const handlePriorityChange = (selectedPriorities: string[]) => {
//     onFiltersChange({ priority: selectedPriorities as TaskPriority[] });
//   };

//   const handleSearchChange = (search: string) => {
//     onFiltersChange({ search });
//   };

//   const activeFiltersCount =
//     filters.departments.length +
//     filters.resources.length +
//     filters.status.length +
//     filters.priority.length +
//     (filters.search ? 1 : 0);

//   if (lookupsError) {
//     console.error("Failed to load lookup data:", lookupsError);
//   }

//   return (
//     <Card className="mb-6">
//       <CardBody>
//         <div className="flex flex-col gap-4">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-semibold">
//               {t("timeline.filters.filters")}
//             </h3>
//             {activeFiltersCount > 0 && (
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-default-500">
//                   {t("timeline.filters.activeFilters")}: {activeFiltersCount}
//                 </span>
//                 <Button
//                   color="danger"
//                   size="sm"
//                   variant="flat"
//                   onClick={onClearFilters}
//                 >
//                   {t("timeline.filters.clearAll")}
//                 </Button>
//               </div>
//             )}
//           </div>

//           {/* Search Input */}
//           <Input
//             className="w-full"
//             placeholder={t("timeline.filters.searchPlaceholder")}
//             value={filters.search || ""}
//             variant="bordered"
//             onChange={(e) => handleSearchChange(e.target.value)}
//           />

//           {/* Filter Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {/* Department Filter */}
//             <Select
//               label={t("timeline.filters.departments")}
//               placeholder={t("timeline.filters.departments")}
//               selectedKeys={new Set(filters.departments)}
//               selectionMode="multiple"
//               variant="bordered"
//               onSelectionChange={(keys) => {
//                 const selectedArray = Array.from(keys) as string[];

//                 handleDepartmentChange(selectedArray);
//               }}
//             >
//               {departments.map((dept) => (
//                 <SelectItem key={dept.id} value={dept.id}>
//                   <div className="flex items-center gap-2">
//                     <div
//                       className="w-3 h-3 rounded-full"
//                       style={{ backgroundColor: dept.color }}
//                     />
//                     {dept.name}
//                   </div>
//                 </SelectItem>
//               ))}
//             </Select>

//             {/* Resource Filter */}
//             <Select
//               label={t("timeline.filters.resources")}
//               placeholder={t("timeline.filters.resources")}
//               selectedKeys={new Set(filters.resources)}
//               selectionMode="multiple"
//               variant="bordered"
//               onSelectionChange={(keys) => {
//                 const selectedArray = Array.from(keys) as string[];

//                 handleResourceChange(selectedArray);
//               }}
//             >
//               {resources.map((resource) => (
//                 <SelectItem key={resource.id} value={resource.id}>
//                   <div className="flex items-center gap-2">
//                     <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs">
//                       {resource.name.charAt(0)}
//                     </div>
//                     {resource.name}
//                   </div>
//                 </SelectItem>
//               ))}
//             </Select>

//             {/* Status Filter - Using Dynamic Lookups */}
//             <Select
//               isLoading={lookupsLoading}
//               label={t("timeline.filters.taskStatus")}
//               placeholder={t("timeline.filters.taskStatus")}
//               selectedKeys={new Set(filters.status)}
//               selectionMode="multiple"
//               startContent={lookupsLoading ? <Spinner size="sm" /> : undefined}
//               variant="bordered"
//               onSelectionChange={(keys) => {
//                 const selectedArray = Array.from(keys) as string[];

//                 handleStatusChange(selectedArray);
//               }}
//             >
//               {currentStatusOptions.map((status) => (
//                 <SelectItem key={status.key} value={status.key}>
//                   <div className="flex items-center gap-2">
//                     <Chip color={status.color as any} size="sm" variant="flat">
//                       {status.label}
//                     </Chip>
//                   </div>
//                 </SelectItem>
//               ))}
//             </Select>

//             {/* Priority Filter - Using Dynamic Lookups */}
//             <Select
//               isLoading={lookupsLoading}
//               label={t("timeline.filters.taskPriority")}
//               placeholder={t("timeline.filters.taskPriority")}
//               selectedKeys={new Set(filters.priority)}
//               selectionMode="multiple"
//               startContent={lookupsLoading ? <Spinner size="sm" /> : undefined}
//               variant="bordered"
//               onSelectionChange={(keys) => {
//                 const selectedArray = Array.from(keys) as string[];

//                 handlePriorityChange(selectedArray);
//               }}
//             >
//               {currentPriorityOptions.map((priority) => (
//                 <SelectItem key={priority.key} value={priority.key}>
//                   <div className="flex items-center gap-2">
//                     {priority.icon && (
//                       <span className="text-sm">{priority.icon}</span>
//                     )}
//                     <Chip
//                       color={priority.color as any}
//                       size="sm"
//                       variant="flat"
//                     >
//                       {priority.label}
//                     </Chip>
//                   </div>
//                 </SelectItem>
//               ))}
//             </Select>
//           </div>

//           {/* Active Filters Display */}
//           {activeFiltersCount > 0 && (
//             <div className="flex flex-wrap gap-2">
//               {filters.departments.map((deptId) => {
//                 const dept = departments.find((d) => d.id === deptId);

//                 return dept ? (
//                   <Chip
//                     key={`dept-${deptId}`}
//                     size="sm"
//                     variant="flat"
//                     onClose={() =>
//                       handleDepartmentChange(
//                         filters.departments.filter((id) => id !== deptId),
//                       )
//                     }
//                   >
//                     {t("timeline.filters.dept")}: {dept.name}
//                   </Chip>
//                 ) : null;
//               })}

//               {filters.resources.map((resourceId) => {
//                 const resource = resources.find((r) => r.id === resourceId);

//                 return resource ? (
//                   <Chip
//                     key={`resource-${resourceId}`}
//                     size="sm"
//                     variant="flat"
//                     onClose={() =>
//                       handleResourceChange(
//                         filters.resources.filter((id) => id !== resourceId),
//                       )
//                     }
//                   >
//                     {t("timeline.filters.resource")}: {resource.name}
//                   </Chip>
//                 ) : null;
//               })}

//               {filters.status.map((statusKey) => (
//                 <Chip
//                   key={`status-${statusKey}`}
//                   color={getStatusColor(statusKey) as any}
//                   size="sm"
//                   variant="flat"
//                   onClose={() =>
//                     handleStatusChange(
//                       filters.status.filter((s) => s !== statusKey),
//                     )
//                   }
//                 >
//                   {t("timeline.filters.status")}: {getStatusLabel(statusKey)}
//                 </Chip>
//               ))}

//               {filters.priority.map((priorityKey) => (
//                 <Chip
//                   key={`priority-${priorityKey}`}
//                   color={getPriorityColor(priorityKey) as any}
//                   size="sm"
//                   variant="flat"
//                   onClose={() =>
//                     handlePriorityChange(
//                       filters.priority.filter((p) => p !== priorityKey),
//                     )
//                   }
//                 >
//                   {t("timeline.filters.priority")}:{" "}
//                   {getPriorityLabel(priorityKey)}
//                 </Chip>
//               ))}

//               {filters.search && (
//                 <Chip
//                   size="sm"
//                   variant="flat"
//                   onClose={() => handleSearchChange("")}
//                 >
//                   {t("timeline.filters.search")}: "{filters.search}"
//                 </Chip>
//               )}
//             </div>
//           )}
//         </div>
//       </CardBody>
//     </Card>
//   );
// }
