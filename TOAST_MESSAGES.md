# Toast Messages for Timeline Operations

This document describes the toast message functionality added to the Project Management Application for timeline operations.

## Overview

Toast messages have been implemented to provide user feedback for create, edit, and delete operations across all timeline components. The messages are fully internationalized and support both English and Arabic languages.

## Translation Keys Added

### General Toast Messages
- `toast.success` - "Success" / "نجح"
- `toast.error` - "Error" / "خطأ"  
- `toast.warning` - "Warning" / "تحذير"
- `toast.info` - "Information" / "معلومات"
- `toast.createSuccess` - "Successfully created" / "تم الإنشاء بنجاح"
- `toast.createError` - "Failed to create" / "فشل في الإنشاء"
- `toast.updateSuccess` - "Successfully updated" / "تم التحديث بنجاح"
- `toast.updateError` - "Failed to update" / "فشل في التحديث"
- `toast.deleteSuccess` - "Successfully deleted" / "تم الحذف بنجاح"
- `toast.deleteError` - "Failed to delete" / "فشل في الحذف"
- `toast.saveSuccess` - "Successfully saved" / "تم الحفظ بنجاح"
- `toast.saveError` - "Failed to save" / "فشل في الحفظ"

### Timeline-Specific Toast Messages

#### Timeline Operations
- `timeline.toast.timelineCreated` - "Timeline created successfully" / "تم إنشاء الجدول الزمني بنجاح"
- `timeline.toast.timelineCreateError` - "Failed to create timeline" / "فشل في إنشاء الجدول الزمني"
- `timeline.toast.timelineUpdated` - "Timeline updated successfully" / "تم تحديث الجدول الزمني بنجاح"
- `timeline.toast.timelineUpdateError` - "Failed to update timeline" / "فشل في تحديث الجدول الزمني"
- `timeline.toast.timelineDeleted` - "Timeline deleted successfully" / "تم حذف الجدول الزمني بنجاح"
- `timeline.toast.timelineDeleteError` - "Failed to delete timeline" / "فشل في حذف الجدول الزمني"

#### Sprint Operations
- `timeline.toast.sprintCreated` - "Sprint created successfully" / "تم إنشاء السبرنت بنجاح"
- `timeline.toast.sprintCreateError` - "Failed to create sprint" / "فشل في إنشاء السبرنت"
- `timeline.toast.sprintUpdated` - "Sprint updated successfully" / "تم تحديث السبرنت بنجاح"
- `timeline.toast.sprintUpdateError` - "Failed to update sprint" / "فشل في تحديث السبرنت"
- `timeline.toast.sprintDeleted` - "Sprint deleted successfully" / "تم حذف السبرنت بنجاح"
- `timeline.toast.sprintDeleteError` - "Failed to delete sprint" / "فشل في حذف السبرنت"

#### Requirement Operations
- `timeline.toast.requirementCreated` - "Requirement created successfully" / "تم إنشاء المتطلب بنجاح"
- `timeline.toast.requirementCreateError` - "Failed to create requirement" / "فشل في إنشاء المتطلب"
- `timeline.toast.requirementUpdated` - "Requirement updated successfully" / "تم تحديث المتطلب بنجاح"
- `timeline.toast.requirementUpdateError` - "Failed to update requirement" / "فشل في تحديث المتطلب"
- `timeline.toast.requirementDeleted` - "Requirement deleted successfully" / "تم حذف المتطلب بنجاح"
- `timeline.toast.requirementDeleteError` - "Failed to delete requirement" / "فشل في حذف المتطلب"

#### Task Operations
- `timeline.toast.taskCreated` - "Task created successfully" / "تم إنشاء المهمة بنجاح"
- `timeline.toast.taskCreateError` - "Failed to create task" / "فشل في إنشاء المهمة"
- `timeline.toast.taskUpdated` - "Task updated successfully" / "تم تحديث المهمة بنجاح"
- `timeline.toast.taskUpdateError` - "Failed to update task" / "فشل في تحديث المهمة"
- `timeline.toast.taskDeleted` - "Task deleted successfully" / "تم حذف المهمة بنجاح"
- `timeline.toast.taskDeleteError` - "Failed to delete task" / "فشل في حذف المهمة"

#### Subtask Operations
- `timeline.toast.subtaskCreated` - "Subtask created successfully" / "تم إنشاء المهمة الفرعية بنجاح"
- `timeline.toast.subtaskCreateError` - "Failed to create subtask" / "فشل في إنشاء المهمة الفرعية"
- `timeline.toast.subtaskUpdated` - "Subtask updated successfully" / "تم تحديث المهمة الفرعية بنجاح"
- `timeline.toast.subtaskUpdateError` - "Failed to update subtask" / "فشل في تحديث المهمة الفرعية"
- `timeline.toast.subtaskDeleted` - "Subtask deleted successfully" / "تم حذف المهمة الفرعية بنجاح"
- `timeline.toast.subtaskDeleteError` - "Failed to delete subtask" / "فشل في حذف المهمة الفرعية"

## Implementation

### Files Created

1. **`src/utils/toast.ts`** - Core toast utility functions
2. **`src/hooks/useTimelineToasts.ts`** - Hook for timeline-specific toast operations
3. **`src/contexts/LanguageContext.tsx`** - Updated with all translation keys

### Usage Examples

#### Basic Usage with useTimelineToasts Hook

```tsx
import { useTimelineToasts } from "@/hooks/useTimelineToasts";

export default function TimelineComponent() {
  const toasts = useTimelineToasts();

  const handleCreateTimeline = async () => {
    try {
      await createTimeline(data);
      toasts.onTimelineCreateSuccess();
    } catch (error) {
      toasts.onTimelineCreateError();
    }
  };

  const handleUpdateSprint = async () => {
    try {
      await updateSprint(data);
      toasts.onSprintUpdateSuccess();
    } catch (error) {
      toasts.onSprintUpdateError();
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask(id);
      toasts.onTaskDeleteSuccess();
    } catch (error) {
      toasts.onTaskDeleteError();
    }
  };
}
```

#### Integration in Timeline Modals

```tsx
import { useTimelineToasts } from "@/hooks/useTimelineToasts";

export default function TimelineItemCreateModal({ type, onSubmit }) {
  const toasts = useTimelineToasts();

  const handleSubmit = async () => {
    try {
      await onSubmit(payload);
      
      // Show appropriate success message based on type
      switch (type) {
        case "sprint":
          toasts.onSprintCreateSuccess();
          break;
        case "requirement":
          toasts.onRequirementCreateSuccess();
          break;
        case "task":
          toasts.onTaskCreateSuccess();
          break;
        case "subtask":
          toasts.onSubtaskCreateSuccess();
          break;
      }
      
      onClose();
    } catch (error) {
      // Show appropriate error message based on type
      switch (type) {
        case "sprint":
          toasts.onSprintCreateError();
          break;
        case "requirement":
          toasts.onRequirementCreateError();
          break;
        case "task":
          toasts.onTaskCreateError();
          break;
        case "subtask":
          toasts.onSubtaskCreateError();
          break;
      }
    }
  };
}
```

## Toast Library Integration

The current implementation includes a placeholder toast function. To integrate with a real toast library:

### For react-hot-toast:

```bash
npm install react-hot-toast
```

```tsx
// In src/utils/toast.ts
import toast from 'react-hot-toast';

export const showToast = (message: ToastMessage) => {
  switch(message.type) {
    case 'success': return toast.success(message.title);
    case 'error': return toast.error(message.title);
    case 'warning': return toast(message.title, { icon: '⚠️' });
    case 'info': return toast(message.title, { icon: 'ℹ️' });
  }
};
```

### For react-toastify:

```bash
npm install react-toastify
```

```tsx
// In src/utils/toast.ts
import { toast } from 'react-toastify';

export const showToast = (message: ToastMessage) => {
  switch(message.type) {
    case 'success': return toast.success(message.title);
    case 'error': return toast.error(message.title);
    case 'warning': return toast.warn(message.title);
    case 'info': return toast.info(message.title);
  }
};
```

## Next Steps

1. **Install a toast library** (react-hot-toast or react-toastify)
2. **Update the toast implementation** in `src/utils/toast.ts`
3. **Integrate the hooks** into existing timeline components
4. **Test with both English and Arabic languages**
5. **Add toast container** to your main App component if using react-toastify

The translation keys are ready to use and will automatically display in the correct language based on the user's language preference.