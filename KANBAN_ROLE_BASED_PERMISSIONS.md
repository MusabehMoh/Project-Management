# Role-Based Kanban Drag and Drop Implementation

## Overview
This implementation adds role-based permissions to the TeamKanbanBoard component, allowing different roles to have restricted access to specific task status columns and transitions.

## Architecture

### 1. Role Configuration System (`src/utils/kanbanRoleConfig.ts`)

The configuration system defines:
- **Allowed Statuses**: Which status columns a role can view/interact with
- **Allowed Transitions**: Which status changes a role can make
- **Drag Permissions**: Which columns allow dragging tasks out
- **Drop Permissions**: Which columns allow dropping tasks into

### 2. Role-Specific Configurations

#### Software Developer (Role ID: 5)
```typescript
Allowed Statuses: [1, 2, 3] // To Do, In Progress, In Review
Workflow:
  - Can drag from: To Do, In Progress, In Review
  - Can drop to: To Do, In Progress, In Review
  - Cannot access: Rework (4), Completed (5)
```

#### Quality Control Team Member (Role ID: 7)
```typescript
Allowed Statuses: [3, 4, 5] // In Review, Rework, Completed
Workflow:
  - From In Review (3): Can move to Rework (4) or Completed (5)
  - From Rework (4): Can move to In Review (3) or Completed (5)
  - Cannot access: To Do (1), In Progress (2)
```

#### Analyst (Role ID: 3)
```typescript
Allowed Statuses: [1, 2, 3] // To Do, In Progress, In Review
Workflow: Same as Software Developer
```

#### Designer Team Member (Role ID: 9)
```typescript
Allowed Statuses: [1, 2, 3] // To Do, In Progress, In Review
Workflow: Same as Software Developer
```

#### Managers & Administrators
```typescript
Allowed Statuses: [1, 2, 3, 4, 5] // Full access
Workflow: Can move tasks between any statuses
```

## Usage in Components

### TeamKanbanBoard Component

```typescript
import { getKanbanConfigForRoles, getColumnAccessibility } from "@/utils/kanbanRoleConfig";

// Get user's role IDs
const userRoleIds = user?.roles?.map(role => role.id) || [];

// Get Kanban configuration
const kanbanConfig = getKanbanConfigForRoles(userRoleIds);

// Check column accessibility
const columnAccess = getColumnAccessibility(userRoleIds, statusId);
// Returns: { isVisible, isDraggable, isDroppable, reason }
```

### Key Functions

#### `getKanbanConfigForRole(roleId: number)`
Returns configuration for a single role.

#### `getKanbanConfigForRoles(roleIds: number[])`
Returns merged configuration when user has multiple roles.
- If user has admin/manager role → full access
- Otherwise → union of all role permissions

#### `isTransitionAllowed(roleIds, fromStatus, toStatus)`
Checks if a status transition is permitted.

#### `isDragAllowed(roleIds, statusId)`
Checks if dragging from a status is permitted.

#### `getColumnAccessibility(roleIds, statusId)`
Returns detailed accessibility information for a column.

## API Integration

Each drag and drop operation calls the API to update the task status:

```typescript
const response = await membersTasksService.updateTaskStatus(
  taskId,
  newStatusId.toString()
);
```

### API Endpoint
```
PUT /api/MembersTasks/{id}/status
Body: { status: "2" } // Status ID as string
```

## Visual Indicators

### Locked Columns
- Columns that cannot be modified show a lock icon
- Tooltip explains the restriction
- Reduced opacity when dragging is active

### Draggable Tasks
- Tasks in draggable columns: `cursor-move` and hover shadow
- Tasks in restricted columns: `cursor-default` no hover effect

### Drop Zones
- Valid drop zones: Normal appearance
- Invalid drop zones: 50% opacity during drag

## Permission Workflow Examples

### Software Developer Workflow
```
To Do (1) ←→ In Progress (2) ←→ In Review (3)
     ✓            ✓                ✓
[Can drag]   [Can drag]       [Can drag]
[Can drop]   [Can drop]       [Can drop]

Rework (4)        Completed (5)
   ✗                  ✗
[Cannot access]  [Cannot access]
```

### QC Team Member Workflow
```
To Do (1)    In Progress (2)
   ✗              ✗
[Cannot access] [Cannot access]

In Review (3) → Rework (4) or Completed (5)
     ✓              ✓              ✓
[Can drag]     [Can drag]     [Read only]
[Can drop]     [Can drop]

Rework (4) → In Review (3) or Completed (5)
```

## Testing Scenarios

### 1. Software Developer
- ✅ Can drag tasks between To Do, In Progress, In Review
- ✅ Cannot see or access Rework and Completed columns
- ✅ API is called on each successful drop

### 2. QC Team Member
- ✅ Can move tasks from In Review to Rework or Completed
- ✅ Can move tasks from Rework back to In Review or Completed
- ✅ Cannot see or access To Do and In Progress columns

### 3. Multiple Roles
- ✅ User with Developer + QC roles gets union of permissions
- ✅ Can access all statuses (1, 2, 3, 4, 5)
- ✅ Can make all transitions

### 4. Admin/Manager
- ✅ Full access to all columns
- ✅ Can move tasks anywhere

## Error Handling

### Permission Denied
```typescript
if (!kanbanConfig.canDragFrom(statusId)) {
  console.warn(`User does not have permission to drag from status ${statusId}`);
  return;
}
```

### Invalid Transition
```typescript
if (!kanbanConfig.canDropTo(toStatusId, fromStatusId)) {
  console.warn(`Transition not allowed from ${fromStatusId} to ${toStatusId}`);
  return;
}
```

### API Failure
```typescript
catch (err) {
  console.error("Failed to update task status:", err);
  // Task stays in original column
}
```

## Extending the System

### Adding New Roles
1. Create configuration in `kanbanRoleConfig.ts`:
```typescript
const NEW_ROLE_CONFIG: KanbanRoleConfig = {
  roleId: RoleIds.NEW_ROLE,
  allowedStatuses: [1, 2],
  allowedTransitions: { from: [1], to: [2] },
  canDragFrom: (statusId) => statusId === 1,
  canDropTo: (statusId, fromStatusId) => 
    fromStatusId === 1 && statusId === 2,
};
```

2. Add to ROLE_CONFIGS map:
```typescript
const ROLE_CONFIGS: Record<number, KanbanRoleConfig> = {
  // ... existing roles
  [RoleIds.NEW_ROLE]: NEW_ROLE_CONFIG,
};
```

### Customizing Workflows
Modify the `canDropTo` function for specific business rules:
```typescript
canDropTo: (statusId: number, fromStatusId: number) => {
  // Custom validation logic
  if (fromStatusId === 1 && statusId === 3) {
    return false; // Cannot skip In Progress
  }
  return allowedStatuses.includes(statusId);
}
```

## Benefits

1. **Security**: Role-based access control at UI level
2. **User Experience**: Clear visual feedback for permissions
3. **Flexibility**: Easy to modify workflows per role
4. **Maintainability**: Centralized configuration
5. **Scalability**: Support for multiple roles per user
6. **API Consistency**: Each drag/drop triggers API call

## Future Enhancements

1. **Backend Validation**: Add role checking in API endpoints
2. **Audit Logging**: Track who moved which tasks
3. **Custom Workflows**: Per-project status workflows
4. **Notification System**: Alert on status changes
5. **Undo Functionality**: Revert accidental moves
6. **Batch Operations**: Move multiple tasks at once
