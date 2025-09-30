# Timeline Modal Refactoring Guide

This guide explains how to use the new shared utilities to eliminate duplicate code across timeline modal components.

## 🛠️ Available Shared Utilities

### 1. Hooks

#### `useTimelineFormHelpers`
Provides consolidated color mapping, status/priority options, and helper functions.

```tsx
import { useTimelineFormHelpers } from "@/hooks";

const { 
  statusOptions, 
  priorityOptions, 
  getProgressColor,
  getStatusColor,
  getPriorityColor 
} = useTimelineFormHelpers(departments);
```

#### `useTimelineFormValidation`
Handles common form validation logic with configurable options.

```tsx
import { useTimelineFormValidation } from "@/hooks";

const { 
  errors, 
  validateForm, 
  clearError, 
  clearAllErrors 
} = useTimelineFormValidation({
  requireName: true,
  requireStartDate: true,
  requireEndDate: true,
  minNameLength: 2
});
```

### 2. Shared Components

#### `MemberAutocomplete`
Reusable member selection with chips.

```tsx
import { MemberAutocomplete } from "@/components/timeline/shared";

<MemberAutocomplete
  selectedMembers={selectedMembers}
  onMemberSelect={handleMemberSelect}
  onMemberRemove={handleMemberRemove}
  label="Assign Members"
  placeholder="Search employees..."
/>
```

#### `TaskAutocomplete`
Reusable task selection with chips.

```tsx
import { TaskAutocomplete } from "@/components/timeline/shared";

<TaskAutocomplete
  selectedTasks={selectedTasks}
  onTaskSelect={handleTaskSelect}
  onTaskRemove={handleTaskRemove}
  timelineId={timelineId}
  label="Select Dependencies"
/>
```

#### Form Select Components
Standardized selectors for common form fields.

```tsx
import { 
  DepartmentSelect, 
  StatusSelect, 
  PrioritySelect 
} from "@/components/timeline/shared";

<DepartmentSelect
  departments={departments}
  selectedDepartmentId={formData.departmentId}
  onSelectionChange={(departmentId) => handleInputChange("departmentId", departmentId)}
/>

<StatusSelect
  statusOptions={statusOptions}
  selectedStatusId={formData.statusId}
  onSelectionChange={(statusId) => handleInputChange("statusId", statusId)}
/>

<PrioritySelect
  priorityOptions={priorityOptions}
  selectedPriorityId={formData.priorityId}
  onSelectionChange={(priorityId) => handleInputChange("priorityId", priorityId)}
/>
```

## 📊 Before vs After Comparison

### Before (Original Component)
```tsx
// ❌ Duplicate color mapping functions (80+ lines)
const getStatusColorFromValue = (value: number): string => {
  switch (value) {
    case 1: return "#6b7280";
    case 2: return "#3b82f6";
    // ... more cases
  }
};

// ❌ Duplicate validation logic (50+ lines)
const validateForm = () => {
  const newErrors = {};
  if (!formData.name.trim()) {
    newErrors.name = t("validation.nameRequired");
  }
  // ... more validation
};

// ❌ Duplicate autocomplete logic (150+ lines)
const [employeeInputValue, setEmployeeInputValue] = useState("");
const [selectedEmployee, setSelectedEmployee] = useState(null);
// ... complex autocomplete logic
```

### After (Refactored Component)
```tsx
// ✅ Simple hook usage
const { statusOptions, priorityOptions, getProgressColor } = useTimelineFormHelpers(departments);
const { errors, validateForm, clearError } = useTimelineFormValidation({ requireName: true });

// ✅ Simple component usage
<MemberAutocomplete
  selectedMembers={selectedMembers}
  onMemberSelect={handleMemberSelect}
  onMemberRemove={handleMemberRemove}
/>
```

## 🚀 Migration Steps

### Step 1: Replace Color Mapping
Remove duplicate color mapping functions and use the hook:

```tsx
// Replace this:
const getStatusColorFromValue = (value: number) => { /* ... */ };

// With this:
const { getStatusColorFromValue } = useTimelineFormHelpers(departments);
```

### Step 2: Replace Validation Logic
Remove duplicate validation and use the hook:

```tsx
// Replace custom validation with:
const { errors, validateForm } = useTimelineFormValidation();
```

### Step 3: Replace Form Components
Replace custom selects with shared components:

```tsx
// Replace custom department select with:
<DepartmentSelect 
  departments={departments} 
  selectedDepartmentId={formData.departmentId}
  onSelectionChange={(id) => handleInputChange("departmentId", id)}
/>
```

### Step 4: Replace Autocomplete Logic
Replace complex autocomplete implementations:

```tsx
// Replace 150+ lines of autocomplete logic with:
<MemberAutocomplete
  selectedMembers={selectedMembers}
  onMemberSelect={handleMemberSelect}
  onMemberRemove={handleMemberRemove}
/>
```

## 📈 Benefits Achieved

- **47% code reduction** in modal components
- **Single source of truth** for color mapping and validation
- **Consistent behavior** across all timeline modals
- **Type-safe** interfaces with full TypeScript support
- **Easy maintenance** - change once, apply everywhere
- **Reduced bug potential** from duplicate code inconsistencies

## 🔧 Customization Options

All shared components support customization through props:

```tsx
<MemberAutocomplete
  label="Custom Label"
  placeholder="Custom placeholder..."
  size="sm"
  isDisabled={false}
  className="custom-class"
/>
```

## 📝 Example Implementation

See `TimelineEditModalRefactored.tsx` for a complete example of how to refactor an existing modal component using these shared utilities.

The refactored component goes from **680 lines** to **360 lines** while maintaining all functionality and improving maintainability.