<!-- # Project Management Application (PMA) - Copilot Instructions

## Project Overview

This is a comprehensive Project Management Application (PMA) built with modern web technologies. The application provides tools for managing projects, tasks, timelines, team collaboration, and role-based dashboards for different user types (Analyst Managers, Developer Managers, etc.). The system supports multi-language functionality (English/Arabic) with full RTL support and features a modern, responsive design.

## High-Level Repository Information

- **Repository Size**: Large-scale application with multiple specialized dashboards
- **Project Type**: Full-stack web application with mock API server
- **Primary Languages**: TypeScript (95%), JavaScript (3%), CSS (2%)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Framework**: HeroUI (NextUI successor) with Tailwind CSS
- **Target Runtime**: Node.js 16+ for development, static build for production

## Architecture & Key Technologies

### Frontend Stack
- **React 18+** with TypeScript for type safety
- **Vite** for fast development and building
- **HeroUI** component library (modern successor to NextUI)
- **Tailwind CSS** for styling with custom design system
- **Framer Motion** for animations
- **React Query** for state management and API calls
- **React Router** for navigation
- **SignalR** for real-time communication

### Backend/API
- **Mock API Server** using Node.js and Express.js
- **Real-time updates** via SignalR hubs
- **RESTful API** design patterns

## Build & Development Instructions

### Prerequisites
- Node.js v16+ (tested with v18+)
- npm (comes with Node.js)

### Environment Setup
1. Always run `npm install` in the root directory first
2. Install mock API server dependencies: `cd mock-api-server && npm install`
3. Copy `.env.example` to `.env` for local development

### Development Commands
- **Frontend only**: `npm run dev` (runs on port 5173)
- **API server only**: `npm run dev:api` (runs mock API server)
- **Full development**: `npm run dev:all` (runs both frontend and API concurrently)
- **Build for production**: `npm run build`
- **Force build**: `npm run build:force` (skips TypeScript checking)
- **Lint code**: `npm run lint` (auto-fixes issues)
- **Preview production build**: `npm run preview`

### Critical Build Notes
- Always run TypeScript compiler before building with `tsc`
- The build process requires clean compilation - fix all TypeScript errors first
- Use `npm run build:force` only when TypeScript errors are non-blocking
- Mock API server must be running for full functionality testing

### Testing & Validation
- Run `npm run lint` before committing to ensure code quality
- Test files are located in root directory (test-*.js, test-*.ts)
- Manual testing: Use `npm run dev:all` to test full application functionality
- Check responsive design on different screen sizes
- Test both English and Arabic language modes

## Project Structure

### Root Directory Files
- `package.json` - Frontend dependencies and scripts
- `vite.config.ts` - Vite configuration with proxy to mock API
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration with custom theme
- `eslint.config.mjs` - ESLint configuration
- `.env.example` - Environment variables template

### Source Code Organization (`src/`)
- `components/` - Reusable UI components
  - `dashboard/` - Dashboard-specific components
    - `AnalystManagerDashboard.tsx` - Analyst manager dashboard
    - `DeveloperManagerDashboard.tsx` - Developer manager dashboard
    - `TeamMemberDashboard.tsx` - Team member dashboard (QC, Developers, Designers)
    - `developer/` - Developer-specific components
    - `team-member/` - Team member-specific components
      - `MyAssignedTasks.tsx` - Shows user's assigned tasks with PendingRequirements design pattern
      - `TeamQuickActions.tsx` - Quick task status updates with Accordion/CustomAlert design
      - `MyNextDeadline.tsx` - Compact deadline tracker with progress and countdown
      - `TeamKanbanBoard.tsx` - Drag-and-drop Kanban board with 5 columns (statuses 1-5)
  - `calendar/` - Calendar components
  - `primitives.ts` - Base UI component definitions
- `pages/` - Main application pages/routes
- `contexts/` - React contexts (Language, User, Notifications, Search)
- `hooks/` - Custom React hooks
  - `useMyAssignedTasks.ts` - Fetch current user's tasks
  - `useTeamQuickActions.ts` - Fetch and update task statuses
  - `useMyNextDeadline.ts` - Fetch next upcoming deadline task
  - `useTaskLookups.ts` - Fetch task status and priority lookups dynamically from API
- `services/` - API service layers
  - `api/` - API service classes and interfaces
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
  - `errorTranslation.ts` - Backend error message translation utility
  - `toast.ts` - Toast notification helpers with custom message support
- `styles/` - Global CSS styles
- `layouts/` - Page layout components
- create directories for everything new to keep things organized.

### Mock API Server (`mock-api-server/`)
- `src/app.ts` - Main Express server (runs on port 3002)
- `src/routes/` - API route definitions  
- `src/controllers/` - Request handlers
- `src/services/` - Business logic
- `src/data/` - Mock data sources
- `src/signalR/` - Real-time hubs

### .NET API Server (`pma-api-server/`)
- **Primary API**: .NET 8 Web API (runs on configured port, typically 5000+)
- `src/PMA.Api/` - Web API project
  - `Controllers/` - API controllers (MembersTasksController, etc.)
  - `Services/` - Application services
- `src/PMA.Core/` - Core domain entities, interfaces, DTOs
  - `DTOs/` - Data Transfer Objects
  - `Enums/` - Enumerations (TaskStatus, Priority, RoleCodes)
  - `Interfaces/` - Service interfaces
    - `IUserRepository` - Includes `CheckUserDependenciesAsync()` and `GetByPrsIdAsync()`
    - `IUserService` - User management with validation
- `src/PMA.Infrastructure/` - Data access and infrastructure
  - `Repositories/` - Data access layer
    - `UserRepository` - Implements dependency checking and duplicate detection
- **Database**: SQL Server (DESKTOP-88VGRA9, Database: PMA)
- **Build Command**: `dotnet build` (in PMA.Api directory)
- **Run Command**: `dotnet run` (in PMA.Api directory)

### API Configuration
- **Mock API Server Port**: 3002 (default)
- **Frontend Dev Server Port**: 5173 (Vite)
- **API Base URL**: `http://localhost:3002/api` (configured in `src/services/api/client.ts`)
- **WebSocket URL**: `ws://localhost:3002` (for SignalR)

### Using API Services
- **Always use service classes** from `src/services/api/` instead of direct fetch calls
- **Use apiClient** for consistent error handling and configuration
- **Follow existing patterns** from services like `projectRequirementsService`, `developerQuickActionsService`
- **Port Configuration**: API calls automatically use port 3002 via `API_CONFIG.BASE_URL`

### Example API Usage
```typescript
// ✅ Correct - Use service classes
import { projectRequirementsService } from "@/services/api";
const result = await projectRequirementsService.getApprovedRequirements({ limit: 5 });

// ❌ Wrong - Direct fetch calls
const response = await fetch('/api/project-requirements/approved-requirements');
```

### Configuration Files
- `vite.config.ts` - Includes proxy configuration for API calls
- `tsconfig.json` - Strict TypeScript configuration
- `tailwind.config.js` - Custom theme with hero-ui integration
- `eslint.config.mjs` - Code quality rules

## Coding Standards & Conventions

### TypeScript Guidelines
- Always use strict TypeScript with proper type annotations
- Define interfaces for all data structures
- Use `React.FC` or explicit return types for components
- Prefer `type` over `interface` for unions and computed types
- Use `interface` for object shapes and extending

### React Patterns
- Use functional components with hooks exclusively
- Implement proper error boundaries where needed
- Use React.memo for performance optimization when appropriate
- Follow component composition patterns
- Use custom hooks for reusable logic

### File Naming
- Components: `PascalCase.tsx` (e.g., `DeveloperManagerDashboard.tsx`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useCurrentUser.ts`)
- Services: `camelCase.ts` (e.g., `apiClient.ts`)
- Types: `PascalCase.ts` or `camelCase.ts` (e.g., `UserTypes.ts`)

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow HeroUI component patterns
- Support both light and dark themes
- Ensure RTL support for Arabic language
- Use responsive design principles
- Maintain consistent spacing using Tailwind's spacing scale
- **Color Usage**: Use subtle, strategic color accents
  - Avoid excessive colors (no "rainbow" or "salad" effects)
  - Primary color for section headers and key action icons only
  - Neutral bordered buttons (`variant="bordered"`) for cleaner appearance
  - Icon-only buttons for space efficiency with tooltips for accessibility

### Import Organization
- External libraries first
- Internal services and utilities
- Component imports
- Type-only imports last
- Use absolute imports with `@/` prefix

## Language & Internationalization

### Multi-language Support
- All user-facing text must be internationalized
- Use `useLanguage()` hook for translations
- Add translations to `LanguageContext.tsx` for both English and Arabic
- Support RTL (right-to-left) layout for Arabic
- Use `dir={language === "ar" ? "rtl" : "ltr"}` on containers
- **CRITICAL**: Always add translations when creating new components with user-facing text
- **NO FALLBACK TEXT**: Use proper translation keys, don't rely on fallback English text
- **CONSISTENCY**: Check existing translation patterns and namespaces before creating new ones

### Translation Key Patterns
- Use dot notation: `"dashboard.title"`, `"user.profile.edit"`
- Group related translations logically (e.g., all `developerDashboard.*` keys together)
- Always add both English and Arabic translations
- For new components, add translations immediately after creating the component
- **CRITICAL**: Use existing translation namespaces when available (e.g., `priority.high`, `calendar.priority.high`)
- **NEVER use fallback text** like `t("key") || "Fallback"` - always ensure translations exist

## Component Library (HeroUI)

### Core Components Used
- `Card`, `CardBody`, `CardHeader` for containers
- `Button` with various variants and states
- `Table` family for data display
- `Modal` for overlays
- `Input`, `Select`, `Autocomplete` for forms
- `Chip`, `Badge` for status indicators
- `Progress` for loading states
- `Avatar`, `AvatarGroup` for user representation

### Select Component Best Practices
**CRITICAL**: When using HeroUI Select components, follow these patterns to avoid validation and dropdown issues:

1. **Basic Select Configuration**:
   ```tsx
   <Select
     label={t("fieldLabel")}
     selectedKeys={[formData.value.toString()]}
     onSelectionChange={(keys) => {
       const selectedKey = Array.from(keys)[0] as string;
       if (selectedKey) {
         setFormData({ ...formData, value: parseInt(selectedKey) });
       }
     }}
   >
     <SelectItem key="1">Option 1</SelectItem>
     <SelectItem key="2">Option 2</SelectItem>
   </Select>
   ```

2. **Deselectable Filters with Placeholders**:
   - For filter dropdowns that should allow deselection (e.g., role filter, status filter):
   - Use `disallowEmptySelection={false}` to enable deselection by clicking the same item again
   - Set `selectedKeys={[]}` when showing placeholder (not `["all"]`)
   - Handle empty selection in `onSelectionChange`:
     ```tsx
     <Select
       aria-label={t("users.filterByRole")}
       placeholder={t("users.filterByRole")}
       disallowEmptySelection={false}
       selectedKeys={filterValue ? [filterValue.toString()] : []}
       onSelectionChange={(keys) => {
         const keysArray = Array.from(keys);
         // If empty (deselected), reset to "all"
         const value = keysArray.length === 0 ? "all" : keysArray[0];
         handleFilter(value);
       }}
     >
       <SelectItem key="all">{t("common.all")}</SelectItem>
       <SelectItem key="1">Option 1</SelectItem>
     </Select>
     ```
   - **Why this works**: Clicking selected item deselects it → empty selection → handler resets to "all" → placeholder shows
   - **Accessibility**: Always add `aria-label` for screen readers when no visible label present

3. **Avoid These Props** (in form contexts):
   - ❌ `isRequired` - Triggers HTML5 validation that conflicts with custom validation
   - ❌ `validationBehavior="aria"` - Not needed for basic functionality
   - ❌ `selectionMode="single"` - Redundant, single is default
   - ✅ `disallowEmptySelection={false}` - USE for deselectable filters

4. **Use Custom Validation** (for forms):
   - Implement validation in a `validateForm()` function
   - Don't rely on HeroUI's built-in validation props for forms
   - Use `validationErrors` state to show error messages

4. **File Upload Validation**:
   - Always filter out empty files (0 bytes) before adding to state
   - Show toast notifications for rejected files using `showWarningToast`
   - Add visual indicators (red border) with auto-clear timers
   - Example:
     ```tsx
     const emptyFiles = Array.from(files).filter(f => f.size === 0);
     if (emptyFiles.length > 0) {
       setHasFileUploadError(true);
       showWarningToast(title, message);
       setTimeout(() => setHasFileUploadError(false), 4000);
     }
     ```

5. **Toast Notifications for User Feedback**:
   - **CRITICAL**: Always provide toast notifications for user actions (create, update, delete, approve, etc.)
   - Use `showSuccessToast`, `showErrorToast`, `showWarningToast` from `@/utils/toast`
   - Import translations from LanguageContext using `t()` for bilingual support
   - Pattern for API operations:
     ```tsx
     try {
       await apiService.performAction(data);
       showSuccessToast(t("action.success"));
       // Refresh data or update UI
     } catch (error) {
       showErrorToast(t("action.error"));
       console.error("Error performing action:", error);
     }
     ```
   - Examples:
     - **Approval workflows**: `showSuccessToast(t("requirements.approveSuccess"))`
     - **Create operations**: `showSuccessToast(t("entity.createSuccess"))`
     - **Update operations**: `showSuccessToast(t("entity.updateSuccess"))`
     - **Validation errors**: `showWarningToast(t("validation.errorTitle"), t("validation.errorMessage"))`
   - Always check if translation keys exist in LanguageContext before use
   - Toast notifications auto-dismiss after 4 seconds by default

6. **Tooltip Usage for Icon Buttons and UI Elements**:
   - **CRITICAL**: Always add tooltips to icon-only buttons and ambiguous UI elements
   - Use `Tooltip` component from `@heroui/tooltip`
   - Import translations from LanguageContext using `t()` for bilingual support
   - Pattern for icon buttons:
     ```tsx
     import { Tooltip } from "@heroui/tooltip";
     
     <Tooltip content={t("action.description")}>
       <Button isIconOnly onPress={handleAction}>
         <Icon className="w-4 h-4" />
       </Button>
     </Tooltip>
     ```
   - Pattern for informational elements:
     ```tsx
     <Tooltip content={t("field.label")}>
       <div className="flex items-center gap-2 w-fit cursor-help">
         <Icon className="w-4 h-4" />
         <span>{data.value}</span>
       </div>
     </Tooltip>
     ```
   - Best practices:
     - Use `cursor-help` class for informational tooltips
     - Use `w-fit` to constrain tooltip wrapper to content width
     - Always provide meaningful, translated tooltip text
     - Ensure tooltips enhance accessibility for all users

7. **Pagination Component (GlobalPagination)**:
   - **CRITICAL**: HeroUI Pagination component has re-render issues that cause incorrect page number display
   - **The Bug**: When changing page size or navigating, pagination may show "3 1 1" instead of "1 2 3"
   - **Root Cause**: Controlled component doesn't re-render properly when `total` or `page` changes
   - **Solution**: Always add a `key` prop to force re-mounting:
     ```tsx
     <Pagination
       key={`pagination-${currentPage}-${totalPages}`}
       isDisabled={isLoading}
       page={currentPage}
       total={totalPages}
       onChange={onPageChange}
     />
     ```
   - **Why it works**: Changing `key` forces React to unmount and remount the component with fresh state
   - **When this happens**: Particularly noticeable when switching page sizes (e.g., 10→5 items per page)
   - **Testing**: Bug appears in normal use but disappears when dev console is opened (forces repaint)
   - **Never use**: `initialPage` prop conflicts with controlled `page` prop
   - Examples:
     - **Icon-only buttons**: Info, Edit, Delete, View Details buttons
     - **Data labels**: Project Owner, Status indicators, Role badges
     - **Complex icons**: Charts, graphs, specialized action buttons

### Theming
- Uses custom theme configuration in `tailwind.config.js`
- Supports automatic dark/light mode switching
- Color palette: primary, secondary, success, warning, danger, default

### Design Consistency Patterns
**CRITICAL**: Maintain consistent design patterns across similar components
- **Quick Actions Components**: Always use "My Actions" title with Accordion + CustomAlert pattern
  - `QuickActions.tsx` (Analyst Manager) - Original design pattern
  - `DesignerQuickActions.tsx` (Designer Manager) - Matches QuickActions design
  - `TeamQuickActions.tsx` (Team Member) - Matches QuickActions design
  - **Title**: "My Actions" (dashboard.myActions) with animated pulse counter chip
  - **Structure**: Single Accordion with business rule categories as parent items (e.g., "Unassigned")
  - **Content**: Multiple CustomAlert components inside each accordion item
  - **Required Elements**: AnimatedCounter with fadeInOut animation, CustomAlert with colored borders, ScrollShadow, bordered buttons
  - **Future-Ready**: Structure allows multiple accordion items for different action types
- **Task Lists**: Use consistent status/priority color coding
- **Modal Patterns**: Follow existing modal structures for updates
- **Loading States**: Use Skeleton components consistently
- **Stat Counters (Modern Minimalist)**: Use horizontal pill-style layout for statistics
  - **Layout**: Horizontal flex with inline numbers and labels
  - **Style**: Rounded backgrounds (`rounded-lg`), subtle colors, compact padding (`px-3 py-2`)
  - **Typography**: `text-2xl font-semibold` for numbers, `text-xs` for labels
  - **Colors**: Neutral backgrounds for general stats, colored backgrounds for status-specific stats
  - **Dark Mode**: Use opacity adjustments (`dark:bg-default-100/10`, `dark:bg-success-100/10`)
  - **Pattern**:
    ```tsx
    <div className="flex gap-3">
      <div className="flex-1 bg-default-50 dark:bg-default-100/10 rounded-lg px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-default-700">{count}</span>
          <span className="text-xs text-default-500">{label}</span>
        </div>
      </div>
      <div className="flex-1 bg-success-50 dark:bg-success-100/10 rounded-lg px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-success-600 dark:text-success-500">{completedCount}</span>
          <span className="text-xs text-success-600/70 dark:text-success-500/70">{completedLabel}</span>
        </div>
      </div>
    </div>
    ```
- **Button Patterns**: Use consistent button styles across similar pages
  - Icon-only buttons: Always wrap with `Tooltip` component for accessibility
  - Action buttons: Use `variant="bordered"` for neutral, clean appearance
  - Colored icons: Apply color classes to icons (e.g., `className="text-success"`) rather than button backgrounds
- **Progress Bars**: Use dynamic color coding based on completion percentage
  - **Color Ranges**:
    - 🔴 Red (danger): 0-39% completion
    - 🟡 Yellow (warning): 40-69% completion
    - 🟢 Green (success): 70-100% completion
    - Gray (default): Empty state (0 requirements)
  - **Pattern**:
    ```tsx
    <div className="w-full bg-default-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${
          count > 0
            ? (completed / count) * 100 >= 70
              ? "bg-success"
              : (completed / count) * 100 >= 40
                ? "bg-warning"
                : "bg-danger"
            : "bg-default-300"
        }`}
        style={{ width: `${count > 0 ? (completed / count) * 100 : 0}%` }}
      />
    </div>
    ```
- **ScrollShadow for Content Overflow**: Use HeroUI ScrollShadow component for scrollable content areas
  - **When to Use**: Card descriptions, long text content that needs scrolling
  - **Configuration**: `hideScrollBar` for clean appearance, `isEnabled={false}` to disable shadow effect if not needed
  - **Pattern**:
    ```tsx
    <ScrollShadow 
      hideScrollBar 
      className="h-[4.5rem]"
      isEnabled={false}
    >
      <p className="text-sm text-default-600 leading-relaxed mb-0">
        {content}
      </p>
    </ScrollShadow>
    ```
  - **Spacing**: Use `space-y-2` for compact layouts, `leading-relaxed` for readable line height, `mb-0` to remove bottom margin

## API Integration

### Service Layer Pattern
- Create service classes in `src/services/api/`
- Use `apiClient` base class for HTTP requests
- Implement proper error handling and TypeScript types
- Follow RESTful conventions
- Handle loading states and error states

### Custom Hooks for Data Fetching
**CRITICAL**: Always create custom hooks for data fetching operations. Never fetch data directly in components with useEffect.

**Hook Creation Pattern**:
```tsx
// src/hooks/useEntityDetails.ts
import { useState, useEffect } from "react";
import { entityApi } from "@/services/api/entity";
import type { Entity } from "@/types/entity";

interface UseEntityDetailsOptions {
  entityId: number | string | undefined;
  enabled?: boolean; // Allow conditional fetching
}

interface UseEntityDetailsResult {
  entity: Entity | null;
  entityName: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEntityDetails(
  options: UseEntityDetailsOptions,
): UseEntityDetailsResult {
  const { entityId, enabled = true } = options;
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntityDetails = async () => {
    if (!entityId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const id = typeof entityId === "string" ? parseInt(entityId) : entityId;
      const response = await entityApi.getEntityById(id);
      
      if (response.data) {
        setEntity(response.data);
      } else {
        setError("Entity not found");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch entity details";
      setError(errorMessage);
      console.error("Error fetching entity details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntityDetails();
  }, [entityId, enabled]);

  return {
    entity,
    entityName: entity?.name || "",
    loading,
    error,
    refetch: fetchEntityDetails,
  };
}
```

**Component Usage**:
```tsx
// Component using the hook
export default function EntityDetailsPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const { entityName, loading, error } = useEntityDetails({ entityId });

  return (
    <h1 className="text-2xl font-bold">
      {entityName || `${t("fallback.text")} ${entityId}`}
    </h1>
  );
}
```

**Hook Export Pattern**:
```tsx
// src/hooks/index.ts - Always export new hooks here
export { useEntityDetails } from "./useEntityDetails";
```

**Examples of Custom Hooks**:
- **`useProjectDetails`**: Fetches project details by ID (used in project-requirements.tsx)
- **`useTaskDetails`**: Fetches task details by ID
- **`useUserProfile`**: Fetches user profile data
- **`useRequirementStatus`**: Fetches requirement status lookups
- **`usePriorityLookups`**: Fetches priority options
- **`useDesignRequests`**: Fetches and manages design requests with filtering and assignment capabilities

**Best Practices**:
- ✅ **DO**: Create custom hooks for all data fetching
- ✅ **DO**: Return loading, error, and refetch capabilities
- ✅ **DO**: Support conditional fetching with `enabled` option
- ✅ **DO**: Export hooks from `src/hooks/index.ts`
- ✅ **DO**: Use proper TypeScript types for all hook parameters and returns
- ❌ **DON'T**: Fetch data directly in components with useEffect
- ❌ **DON'T**: Import API services directly into components (use hooks instead)
- ❌ **DON'T**: Create inline useEffect for API calls (extract to hook)

### API Servers
- **Mock API Server**: Located in `mock-api-server/`, provides realistic data structures for development
- **.NET API Server**: Primary backend in `pma-api-server/`, connects to SQL Server database
- Use Mock API for frontend-only testing, .NET API for full integration testing

### Task Status Enum Values
**CRITICAL**: Task status IDs must match the database enum (`PMA.Core.Enums.TaskStatus`):
- `ToDo = 1` - Initial task state
- `InProgress = 2` - Task being worked on
- `InReview = 3` - Task under review
- `Rework = 4` - Task needs rework
- `Completed = 5` - Task finished
- `OnHold = 6` - Task paused/blocked

### Priority Enum Values
- `Low = 1`
- `Medium = 2`
- `High = 3`

### Key API Endpoints for Team Members
- `GET /api/MembersTasks` - Get tasks (auto-filters by current user for team members)
- `GET /api/MembersTasks/next-deadline` - Get the next upcoming task deadline for current user
- `PUT /api/MembersTasks/{id}/status` - Update task status (accepts status string in body) - **DEPRECATED for Kanban**
- `PATCH /api/Tasks/{id}` - Update task status with audit trail (preferred for Kanban board)

### Key API Services
- **`tasksService`** (src/services/api/tasksService.ts):
  - Uses TasksController (`/api/Tasks`)
  - **Method**: `updateTaskStatus(taskId, statusId, comment?)`
  - **Features**: 
    - Creates TaskStatusHistory records automatically
    - Tracks user who made the change via UserContext
    - Supports optional comments for audit trail
    - Uses numeric status IDs (1-6)
  - **Use Case**: Kanban board drag-and-drop, status updates requiring audit trail
  
- **`membersTasksService`** (src/services/api/membersTasksService.ts):
  - Uses MembersTasksController (`/api/MembersTasks`)
  - **Methods**: `getTasks()`, `getNextDeadline()`, `updateTaskStatus()` (string-based, legacy)
  - **Use Case**: Fetching current user's tasks, quick actions without detailed audit trail

### Backend Search and Filter Implementation Pattern
**CRITICAL**: When adding search/filter functionality to any entity, follow this full-stack pattern:

**1. Update Interface** (`PMA.Core/Interfaces/IRepositories.cs`):
```csharp
System.Threading.Tasks.Task<(IEnumerable<Entity> Items, int TotalCount)> GetEntitiesAsync(
    int page, 
    int limit, 
    string? search = null,           // Add search parameter
    bool? isActive = null,           // Add filter parameters
    int? categoryId = null,          // Add filter parameters
    int? roleId = null);             // Add filter parameters
```

**2. Update Service Interface** (`PMA.Core/Interfaces/IServices.cs`):
```csharp
System.Threading.Tasks.Task<(IEnumerable<EntityDto> Items, int TotalCount)> GetEntitiesAsync(
    int page, 
    int limit, 
    string? search = null,
    bool? isActive = null,
    int? categoryId = null,
    int? roleId = null);
```

**3. Implement Repository** (`PMA.Infrastructure/Repositories/EntityRepository.cs`):
```csharp
public async Task<(IEnumerable<Entity> Items, int TotalCount)> GetEntitiesAsync(
    int page, int limit, string? search = null, bool? isActive = null, 
    int? categoryId = null, int? roleId = null)
{
    var query = _context.Entities
        .Include(e => e.RelatedEntity)
        .AsQueryable();

    // Search filter - search across multiple fields
    if (!string.IsNullOrWhiteSpace(search))
    {
        var searchLower = search.ToLower();
        query = query.Where(e => 
            e.Name.ToLower().Contains(searchLower) ||
            (e.Description != null && e.Description.ToLower().Contains(searchLower)) ||
            (e.Code != null && e.Code.ToLower().Contains(searchLower))
        );
    }

    // Filter by category
    if (categoryId.HasValue)
    {
        query = query.Where(e => e.CategoryId == categoryId.Value);
    }

    // Filter by role (with related entity)
    if (roleId.HasValue)
    {
        query = query.Where(e => e.EntityRoles!.Any(er => er.RoleId == roleId.Value));
    }

    // Filter by boolean
    if (isActive.HasValue)
    {
        query = query.Where(e => e.IsActive == isActive.Value);
    }

    var totalCount = await query.CountAsync();
    var items = await query
        .Skip((page - 1) * limit)
        .Take(limit)
        .ToListAsync();

    return (items, totalCount);
}
```

**4. Update Service** (`PMA.Core/Services/EntityService.cs`):
```csharp
public async Task<(IEnumerable<EntityDto> Items, int TotalCount)> GetEntitiesAsync(
    int page, int limit, string? search = null, bool? isActive = null, 
    int? categoryId = null, int? roleId = null)
{
    var (items, totalCount) = await _repository.GetEntitiesAsync(
        page, limit, search, isActive, categoryId, roleId);
    var dtos = items.Select(MapToDto);
    return (dtos, totalCount);
}
```

**5. Update Controller** (`PMA.Api/Controllers/EntitiesController.cs`):
```csharp
[HttpGet]
[ProducesResponseType(200)]
public async Task<IActionResult> GetEntities(
    [FromQuery] int page = 1,
    [FromQuery] int limit = 20,
    [FromQuery] string? search = null,
    [FromQuery] bool? isActive = null,
    [FromQuery] int? categoryId = null,
    [FromQuery] int? roleId = null)
{
    try
    {
        var (items, totalCount) = await _service.GetEntitiesAsync(
            page, limit, search, isActive, categoryId, roleId);
        var totalPages = (int)Math.Ceiling((double)totalCount / limit);
        
        var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
        return Success(items, pagination);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving entities. Page: {Page}, Limit: {Limit}, Search: {Search}", 
            page, limit, search);
        return Error<IEnumerable<EntityDto>>("An error occurred", ex.Message);
    }
}
```

**Best Practices**:
- ✅ **Search**: Use `.ToLower().Contains()` for case-insensitive search
- ✅ **Multiple Fields**: Search across name, description, code, related entity fields
- ✅ **Related Entities**: Use `Any()` for filtering by related collections (e.g., roles, tags)
- ✅ **Count After Filter**: Always call `CountAsync()` after applying filters
- ✅ **Pagination**: Apply `.Skip()` and `.Take()` after all filters
- ✅ **Logging**: Log all parameters in error messages for debugging
- ✅ **Frontend**: Update service, hook, and component to pass filter parameters

**Example Implementation**: See `UsersController.GetUsers()` method with search, roleId, isVisible, and departmentId filters.

## Dashboard System

### Dashboard Types
- **AnalystManagerDashboard**: Requirements management, team performance (Role ID: 2)
- **DeveloperManagerDashboard**: Development team management, approved requirements, deployments (Role ID: 4)
- **DesignerManagerDashboard**: Design request management, team workload monitoring (Role ID: 8)
  - **Layout**: ModernQuickStats → 50/50 split (DesignerQuickActions + Calendar) → DesignerWorkloadPerformance
  - **Left Column (50%)**: DesignerQuickActions - "My Actions" accordion with unassigned design requests
  - **Right Column (50%)**: Calendar without sidebar (showSidebar={false})
  - **Bottom**: DesignerWorkloadPerformance - Full-width table with designer metrics
  - **Quick Actions Structure**:
    - Title: "My Actions" with animated pulse counter
    - Single Accordion: "Unassigned" (غير معين) parent item
    - Inside: Multiple CustomAlert cards for each unassigned request
    - Future-ready for additional action types
  - **Key Features**:
    - Real-time unassigned design request tracking (status = 1)
    - Designer assignment modal with team member autocomplete search
    - Priority-based request display (Critical/High/Medium/Low)
    - Task details: name, description (truncated), priority, dates, notes
    - Assignment notes and comments
    - Toast notifications for user feedback
  - **API Integration**: Uses `useDesignRequests` hook with `designRequestsService`
- **TeamMemberDashboard**: Task management for QC, Developers, Designers (Role IDs: 5, 7, 9)
  - **Layout**: Vertical stack - ModernQuickStats → TeamKanbanBoard (full-width) → 50/50 Grid layout (TeamQuickActions + Calendar)
  - **Updated Layout (October 2025)**: 
    - Removed MyAssignedTasks and MyNextDeadline components
    - TeamQuickActions and Calendar now split 50/50 horizontally (`grid-cols-2`)
    - Calendar displays without sidebar (`showSidebar={false}`)
  - **Simplified Design**: Focus on Kanban board and quick actions
  - **Refresh Strategy**: 
    - Kanban board: No refresh on drag-and-drop (optimistic updates only)
    - TeamQuickActions: Refresh only when updates come from TeamQuickActions
    - Separate handlers: `handleKanbanUpdate()` (no refresh) vs `handleQuickActionsUpdate()` (triggers refresh)
- Each dashboard has specialized components in respective subdirectories

### Key Pages

#### Requirements Page (`requirements.tsx`)
- **Purpose**: Lists assigned projects for requirements management
- **Design Features**:
  - Modern minimalist stat counters (horizontal pills)
  - Icon-only "View Details" button with tooltip
  - Tooltips on project owner and owning unit fields
  - Dynamic progress bars with color coding (red/yellow/green based on completion %)
  - Neutral bordered buttons for clean appearance
- **Progress Bar Color Scheme**:
  - Red (danger): 0-39% completion
  - Yellow (warning): 40-69% completion
  - Green (success): 70-100% completion
  - Gray (default): Empty state
- **Data Fetching**: Uses `useProjectDetails` hook for dynamic project names

#### Approval Requests Page (`approval-requests.tsx`)
- **Purpose**: Review and approve pending requirements
- **Design Features**:
  - Icon-only "View Details" button with tooltip (matches requirements page)
  - Green checkmark icon for approve button
  - ScrollShadow component for long descriptions
  - Scrollable content on hover (no auto-scroll)
  - Compact spacing with `space-y-2` for card content
- **ScrollShadow Configuration**:
  - `hideScrollBar`: Hides scrollbar for clean look
  - `isEnabled={false}`: Disables shadow effect
  - `className="h-[4.5rem]"`: Fixed height container
  - `leading-relaxed mb-0`: Readable line height, no bottom margin
- **Toast Notifications**: Success/error toasts for approval actions

#### Profile Page (`profile.tsx`)
- **Purpose**: User profile display and management
- **Design Philosophy**: Subtle, elegant color accents only
- **Color Usage**:
  - Primary color on section header icons only (User, Shield)
  - Primary color chips for roles
  - All other icons are gray (`text-default-400`)
  - No colored backgrounds or gradients
  - Clean, professional appearance
- **Layout**: Three-column layout with profile card, personal info, and user actions

#### Users Page (`users.tsx`)
- **Purpose**: User management with search and filtering
- **Filter Implementation**:
  - **Search**: Case-insensitive search across userName, fullName, militaryNumber, employee.fullName
  - **Role Filter**: Dropdown with deselectable options using `disallowEmptySelection={false}`
  - **Status Filter**: Active/Inactive filter with deselectable options
  - **Placeholder Behavior**: Shows placeholder when no filter selected (selectedKeys={[]})
  - **Toggle Behavior**: Clicking same option deselects it and returns to "All"
  - **Backend**: Full-stack filtering implemented in UsersController, UserService, UserRepository
- **Key Features**:
  - Dynamic user list with pagination
  - Create/Edit/Delete user functionality
  - Role and permission assignment
  - Real-time filter updates with debounced search
  - Toast notifications for all user actions
- **Translations**: `users.filterByRole`, `users.filterByStatus` for placeholders

#### Members-Tasks Page (`members-tasks.tsx`)
- **Purpose**: Task management page with comprehensive filtering and multiple view modes
- **Filter Implementation** (October 2025):
  - **Layout**: Clean, card-less design with all filters in responsive horizontal row
  - **Search**: Task name and description search with debouncing
  - **Project Filter**: Dropdown for filtering by project (all team projects)
  - **Assignee Filter**: Autocomplete with avatar display for team member selection
  - **Status Filter**: Dynamic status options from lookup service (To Do, In Progress, In Review, Rework, Completed)
  - **Priority Filter**: Low/Medium/High priority filtering
  - **Type Filter**: Task type filtering (Timeline/Change Request/Adhoc) - **Added October 2025**
    - TypeId values: 1=Timeline, 2=ChangeRequest, 3=Adhoc
    - Backend filtering through full-stack implementation
    - Translation keys: 
      - `tasks.filterByType` - "Filter by Type" / "تصفية حسب النوع"
      - `tasks.allTypes` - "All Types" / "جميع الأنواع"
      - `tasks.type.timeline` - "Timeline Task" / "مهمة جدول زمني"
      - `tasks.type.changeRequest` - "Change Request" / "طلب تغيير"
      - `tasks.type.adhoc` - "Adhoc Task" / "مهمة عاجلة"
      - `common.type` - "Type" / "النوع" (used in active filter chip display)
  - **Backend**: Full-stack filtering implemented in MembersTasksController → MemberTaskService → TaskRepository
  - **Active Filter Display**: Shows active filters as chips with clear button (uses `common.type` translation)
- **Key Features**:
  - Three view modes: Grid, List, Gantt chart
  - Pagination with customizable page size
  - Export functionality (CSV, PDF, XLSX)
  - Role-based task visibility (managers see department, users see own tasks)
  - Real-time filter updates with proper state management
- **UI Design**: Minimal background colors, clean alignment, responsive grid layout (lg breakpoint)
- **Backend API**: GET `/api/MembersTasks` with query parameters: page, limit, projectId, primaryAssigneeId, status, priority, search, typeId

### Dashboard Components
- **ApprovedRequirements**: Shows approved requirements ready for development (Developer Manager)
- **PendingRequirements**: Shows draft requirements awaiting approval (Analyst Manager)
- **DeveloperQuickActions**: Task assignment and management tools (Developer Manager)
- **DesignerQuickActions**: Unassigned design request management (Designer Manager)
  - **Title**: "My Actions" with animated counter chip (no icon, matches QuickActions component pattern)
  - **Design Pattern**: Single Accordion structure with one parent item containing all unassigned requests
  - **Structure**: 
    - Card Header: "My Actions" title with pulsing counter chip, subtitle, and refresh button
    - Divider separator
    - CardBody with proper padding and overflow handling
    - Accordion Item: "Unassigned Designer" (مصمم غير معين) as parent with count badge
    - ScrollShadow: max-h-64, hideScrollBar={true}, size={20} - Contains multiple CustomAlert components (one per request)
  - **Business Rule**: Reminds manager about unassigned design requests (status = 1)
  - **Accordion Configuration**: Uses HeroUI `itemClasses` prop with cursor-pointer on trigger (no hover background)
  - **Detailed Information Display**: 
    - AnimatedCounter with fadeInOut pulse animation
    - **Project Name**: Shows which project the request belongs to (requirementDetails.projectName)
    - **Requirement Name**: The requirement title (requirementDetails.name)
    - **Requirement Description**: Brief description with line-clamp-2 (requirementDetails.description)
    - **Task Details**: Task description separated with border-top (task.description)
    - All fields conditionally rendered only if they exist
  - **Button & Modal Pattern**: Matches exact pattern from design-requests.tsx page
    - **Button Text**: "Assign Designer" (designRequests.assignTo) - "تعيين إلى مصمم"
    - **Modal Header**: "Assign to Designer" (designRequests.assignTo)
    - **Modal Footer**: "Cancel" (cancel) + "Assign Request" (designRequests.assign)
  - **Assignment Modal Implementation**: 
    - **Autocomplete Component**: Searchable designer picker with visible search input
      - Uses HeroUI `Autocomplete` component (NOT Select - Select's keyboard search wasn't intuitive)
      - Loads all designers from Design Department (ID: 3) on mount
      - Display: Avatar + `{gradeName} {fullName}` with secondary `{militaryNumber}`
      - Avatar with `name` prop using designer's full name
      - `textValue`: Only `{gradeName} {fullName}` - this is what appears in input after selection
      - `defaultFilter`: Custom filter function searches across gradeName, fullName, userName, militaryNumber
      - **CRITICAL Autocomplete Pattern**: 
        - Use `defaultItems={designers}` NOT `items={designers}` - enables automatic filtering
        - Use `inputValue={fieldInputValue}` + `onInputChange` for controlled input display
        - `textValue` determines what shows in input after selection
        - `defaultFilter` allows comprehensive search while keeping display clean
    - **Department Filtering**: Uses `useTeamSearchByDepartment` hook
      - `departmentId: 3` - Design Department (hardcoded)
      - `loadInitialResults: true` - Preloads all designers for client-side filtering
      - `maxResults: 100, initialResultsLimit: 100` - Load full department list
    - **State Management**: 
      - `selectedDesigner: MemberSearchResult | null` - Selected designer object
      - `fieldInputValue: string` - Controls what displays in the input field (rank + full name only)
      - `modalError: string | null` for inline error display
      - Uses `selectedDesigner.id` directly (already a number)
      - Semi-controlled input pattern: `inputValue` for display, `defaultFilter` for search
    - **Error Handling**: Shows inline error below Autocomplete (not toast)
    - **Label**: "Select Designer for Assignment" (designRequests.selectDesignerForAssignment)
    - **Placeholder**: Uses `tasks.selectDesigner` - "Search for designer..." / "البحث عن مصمم..."
    - **Assignment Notes**: Textarea with minRows={3}, onChange={(e) => setAssignmentNotes(e.target.value)}
    - **Toast Notifications**: Success/error toasts after assignment attempt
  - **API Integration**: 
    - Uses `useDesignRequests` hook with `designRequestsService`
    - Uses `useTeamSearchByDepartment` hook for department-filtered designer list
    - Fetches design requests with status=1 (unassigned), limit=50
    - Assignment via `designRequestsService.assignDesignRequest(id, designerId, notes)`
    - API Endpoint: `PATCH /api/DesignRequests/{id}/assign`
    - Backend: `DesignRequestsController.AssignDesignRequest()` in .NET API
    - Department Search: `timelineService.searchMembersByDepartment()` → `/employees/searchUsers?q={query}&departmentId={id}`
  - **Styling**: 
    - Clean CustomAlert with title/description props (not children)
    - Divider before buttons: className="bg-default-200 my-3"
    - Button: "Assign Designer" with CheckCircle icon, bordered variant, shadow-small
    - Accordion trigger: cursor-pointer via itemClasses, no hover background highlight
  - **Empty State**: 
    - Icon: CheckCircle with `text-success opacity-60` (positive green checkmark)
    - Message: `designRequests.noUnassigned` - Generic "No actions require your attention" message
    - Translation: "No actions require your attention at this time" / "لا توجد إجراءات تتطلب انتباهك في الوقت الحالي"
    - Design: Centered, positive message with success color (future-proof for additional action types)
  - **Key Translations**: 
    - `designRequests.assignTo` - "Assign to Designer" / "تعيين إلى مصمم"
    - `designRequests.selectDesignerForAssignment` - "Select Designer for Assignment"
    - `tasks.selectDesigner` - "Search for designer..." / "البحث عن مصمم..."
    - `designRequests.assignmentNotes` - "Assignment Notes" / "ملاحظات التعيين"
    - `designRequests.designerRequired` - "Designer selection is required"
    - `designRequests.assignSuccess/assignError` - Success/error messages
    - `designRequests.noUnassigned` - Generic empty state message (not specific to designers)
    - Uses common.project, requirements.requirement, common.taskDetails for display
  - **Future-Ready**: Structure allows adding more accordion items for other action types
- **DesignerWorkloadPerformance**: Full-width designer workload and performance metrics table (Designer Manager)
  - **Design Pattern**: Modern minimalist stats + searchable, filterable, sortable table with pagination
  - **Modern Minimalist Stats**: Horizontal pill-style layout with 4 metrics - **NEUTRAL MONOCHROMATIC DESIGN**
    - All stats use: `bg-default-100 dark:bg-default-50/5` with `border border-default-200` for subtle, clean appearance
    - Number styling: `text-2xl font-semibold text-default-700 dark:text-default-600`
    - Label styling: `text-xs text-default-500`
    - Average Efficiency: Displays team average efficiency percentage
    - Tasks Completed: Shows total completed tasks count
    - Average Task Time: Displays avg completion time in hours
    - Tasks In Progress: Shows currently active tasks count
    - **Pattern**: `flex gap-3`, `flex-1`, `rounded-lg px-3 py-2`, `border border-default-200`, neutral colors only, no colored backgrounds
    - **Philosophy**: Minimal color usage - only neutral grays for professional, clean aesthetic
  - **Table Columns**: Designer (avatar + name + grade), Workload (progress bar + %), Efficiency (with trend icon), Projects (current + completed with icons), Status (colored chip)
  - **Filters & Search**:
    - Search by designer name (debounced input)
    - Status filter dropdown (All, Available, Busy, Blocked, On Leave)
    - Sort by dropdown (Name, Workload, Efficiency)
    - Clear search button (X icon)
    - Refresh button with loading spinner
  - **Data Display**:
    - Designer Info: Avatar with `designerName`, secondary text shows `gradeName` (no skills array)
    - Workload: Progress bar (green/yellow/red based on percentage), percentage text, available hours
    - Efficiency: Trend icon (TrendingUp/TrendingDown), colored percentage (green ≥85%, yellow ≥70%, red <70%)
    - Projects: Clock icon + `currentTasksCount`, CheckCircle icon + `completedTasksCount`
    - Status: Colored chip with translated status text
  - **API Integration**:
    - **Service**: `designerWorkloadService` (src/services/api/designerWorkloadService.ts)
      - Smart PascalCase/camelCase compatibility layer
      - Handles both `.NET` PascalCase responses and future camelCase responses
      - Methods: `getDesignerWorkload()`, `getTeamMetrics()`
    - **Hook**: `useDesignerWorkload` (src/hooks/useDesignerWorkload.ts)
      - State management: designers, metrics, pagination, loading, error
      - Functions: refetch, fetchPage(pageNumber)
      - Auto-refreshes on parameter changes (search, filter, sort)
    - **Backend Endpoints** (.NET 8 Web API):
      - `GET /api/designers/workload` - Paginated designer workload data
        - Query params: `page` (default: 1), `pageSize` (default: 5), `searchQuery`, `statusFilter`, `sortBy` (Name/Workload/Efficiency), `sortOrder` (asc/desc)
        - Response: `{ Designers: DesignerWorkloadDto[], Pagination: PaginationInfo }`
        - **PascalCase JSON**: Returns capital-case properties (backend uses default .NET serialization)
        - Database: Queries Users table filtered by DepartmentId = 3 (Design Department)
        - Business Logic: Calculates workload % (estimated hours / 160), efficiency % (completed / total tasks), available hours, status
      - `GET /api/designers/metrics` - Team-wide aggregate metrics
        - Response: `TeamMetricsDto` object
        - Aggregates: Total designers, active designers, average efficiency, total completed/in-progress tasks, average task completion time
    - **DTOs**:
      - **DesignerWorkloadDto** (C# backend, PascalCase):
        - `PrsId` (int): Personnel ID
        - `DesignerName` (string): Full name from Users table
        - `GradeName` (string): Military/organizational grade
        - `CurrentTasksCount` (int): Active tasks from TaskAssignments
        - `CompletedTasksCount` (int): Completed tasks count
        - `AverageTaskCompletionTime` (decimal): Avg hours to complete tasks
        - `Efficiency` (decimal): Percentage (completed / total * 100)
        - `WorkloadPercentage` (decimal): Percentage (estimated hours / 160 * 100)
        - `AvailableHours` (decimal): 160 - estimated hours
        - `Status` (string): "Available" | "Busy" | "Blocked" | "On Leave"
      - **TeamMetricsDto** (C# backend, PascalCase):
        - `TotalDesigners` (int)
        - `ActiveDesigners` (int)
        - `AverageEfficiency` (decimal)
        - `TotalTasksCompleted` (int)
        - `TotalTasksInProgress` (int)
        - `AverageTaskCompletionTime` (decimal)
      - **TypeScript Interfaces** (frontend, camelCase):
        - Service layer automatically maps PascalCase → camelCase
        - Interfaces defined in designerWorkloadService.ts
    - **JSON Serialization**: Backend uses .NET default (PascalCase), frontend service handles both cases for future-proofing
  - **Key Translations**:
    - `common.workload`, `common.efficiency`, `common.avgEfficiency`, `common.currentProjects`, `common.completed`, `common.filterByStatus`, `common.inProgress`
    - `status.available`, `status.busy`, `status.blocked`, `status.onLeave`
    - Uses existing: `designerDashboard.teamPerformance`, `designerDashboard.searchDesigners`, `designerDashboard.designer`, etc.
  - **Pagination**: GlobalPagination component with 5 items per page, calls `fetchPage()` from hook
  - **Loading States**: Skeleton rows while fetching data
  - **Empty State**: "No data" message when no designers match filters
  - **Department Filter**: Hardcoded to Department ID 3 (Design Department) for backend filtering
- **MyAssignedTasks**: Shows tasks assigned to current user (Team Members)
  - **Design Pattern**: Uses compact list design matching PendingRequirements component
  - **Features**: Compact card layout with divide-y separators, hover effects, ListTodo icon
  - **Layout**: Card with header (icon + title + count chip), divider, compact item list
  - **Item Structure**: Title + priority chip, status text, project + date metadata, View button
- **TaskCard (Members-Tasks Page)**: Individual task card for grid/list views
  - **Adhoc Task Quick Completion** (October 2025): Same as TeamKanbanBoard
    - **Hover Effect**: Smooth animation on hover (500ms ease-in-out)
      - Enhanced shadow (`shadow-2xl`)
      - Green border (`border-2 border-success`)
      - Subtle green glow ring (`ring-2 ring-success/20`)
    - **Completion Switch**: Green Switch appears next to status chip on hover
      - Positioned in card header next to "To Do" / status chip
      - Shows checkmark icon when toggled
      - Click handler prevents card click propagation
      - Calls `tasksService.updateTaskStatus(taskId, 5, comment, 100)`
      - Shows success/error toast notifications
      - Triggers page refresh via `onTaskComplete` callback
    - **Layout**: Title (left-aligned) + Status chip & Switch (right column)
    - **Only for adhoc tasks** (typeId === 3) that are not already completed
- **TeamQuickActions**: Quick status updates for assigned tasks (Team Members)
  - **Design Pattern**: Uses Accordion layout with CustomAlert components (matches QuickActions design)
  - **Features**: AnimatedCounter for task count, ScrollShadow for scrollable content
  - **Actions**: Start/Pause/Complete buttons based on task statusId
  - **Styling**: Colored left borders (primary/warning/danger), bordered buttons with shadow-small
- **Calendar**: Integrated calendar component (Team Members)
  - **Configuration**: Full-width display without sidebar (showSidebar={false})
  - **Purpose**: View meetings and deadlines without overview/upcoming events panel
- **MyNextDeadline**: Shows next upcoming task deadline (Team Members)
  - **Design Pattern**: Compact card design with progress bar and deadline countdown
  - **Features**: Task name, progress percentage, deadline date, days remaining chip
  - **Color Coding**: Progress bar (success/primary/warning/danger), deadline chip (green >7d, yellow ≤7d, red ≤3d/overdue)
  - **Layout**: Small component under MyAssignedTasks to complement calendar height
- **TeamKanbanBoard**: Drag-and-drop Kanban board for task management (Team Members)
  - **Design Pattern**: Full-width card with 5-column grid layout (responsive: 1/3/5 columns)
  - **Features**: Native HTML5 drag-and-drop, real-time status updates via API, role-based permissions, audit trail, adhoc task quick completion
  - **Columns**: Uses dynamic status lookup (statuses 1-5): To Do, In Progress, In Review, Rework, Completed
    - **Column Shading**: Each column has a subtle background color (`bg-{color}/5`) for visual distinction
    - **Status Names**: Fetched from lookup service (not hardcoded)
      - Status 1: "To Do" / "جديد" - Gray background
      - Status 2: "In Progress" / "جاري" - Blue background
      - Status 3: "In Review" / "تحت الإختبار" - Yellow background
      - Status 4: "Rework" / "إعادة" - Red background
      - Status 5: "Completed" / "مكتملة" - Green background
  - **Task Cards**: 
    - Title, task type chip (Timeline/Change Request/Adhoc), priority chip, project/requirement info, end date, progress %, overdue badge
    - **Task Type Display**: Shows task type with colored bordered chip (`getTaskTypeColor()` and `getTaskTypeText()`)
    - **Dark Mode**: Cards use `bg-content2` for better visibility in dark mode
    - **Progress Color Coding**: 
      - 100%: Green, bold
      - 70-99%: Green
      - 40-69%: Yellow
      - 1-39%: Red
      - 0%: Gray
    - **RTL Support**: Project/requirement text aligns right for Arabic (`text-right`)
  - **Adhoc Task Quick Completion** (October 2025):
    - **Hover Effect**: Adhoc tasks show smooth animation on hover (500ms ease-in-out transition)
      - Enhanced shadow (`shadow-2xl`)
      - Green border (`border-2 border-success`)
      - Subtle green glow ring (`ring-2 ring-success/20`)
      - Border space always reserved (`border-2 border-transparent` for non-adhoc) to prevent layout shift
    - **Completion Switch**: Green HeroUI Switch component appears on hover for adhoc tasks
      - Positioned next to task title
      - Shows checkmark icon when toggled
      - RTL Support: Uses `order-first` class in Arabic to position switch correctly
      - Click handler prevents card click propagation
      - Disabled state while completing
    - **One-Click Completion**: 
      - Calls `tasksService.updateTaskStatus(taskId, 5, comment, 100)` to mark as completed
      - Sets status to Completed (5) and progress to 100%
      - Shows success/error toast notifications
      - Only appears for adhoc tasks (typeId === 3) that are not already completed
      - Toast translations: `teamDashboard.kanban.markComplete`, `taskCompleted`, `taskCompleteFailed`
  - **Color Coding**: Column headers (default/primary/warning/danger/success), priority chips, task type chips
  - **Scrolling**: 500px height ScrollShadow for each column
  - **API Integration**: 
    - Data Fetching: Uses `useTaskStatusLookups()` hook and `membersTasksService.getTasks()`
    - Status Updates: Uses `tasksService.updateTaskStatus()` via TasksController PATCH endpoint
  - **Drag Behavior**: 
    - Calls `PATCH /api/Tasks/{id}` endpoint with `{ statusId: number, comment: string, progress: number }`
    - Automatically creates TaskStatusHistory record with old/new status, user, and comment
    - Progress auto-updated based on target status (To Do: 0%, In Progress: 25%, In Review: 75%, Rework: 50%, Completed: 100%)
    - Optimistic UI updates for seamless UX
    - No component remounting or refresh on drag-and-drop
  - **Audit Trail**: Every status change tracked in database with user attribution and timestamp
  - **Loading States**: Waits for both status lookups and tasks to load before rendering
  - **Null Safety**: Handles null project/requirement references gracefully
  - **Role-Based Permissions**: See detailed section below for role-specific workflows
- Each component uses proper API services and follows consistent design patterns

### Role-Based Access
- Use `usePermissions()` hook for role checking
- Implement proper access controls in routing
- Support multiple roles per user
- **Role IDs** (from `src/constants/roles.ts`):
  - Administrator: 1
  - Analyst Department Manager: 2
  - Analyst: 3
  - Development Manager: 4
  - Software Developer: 5
  - Quality Control Manager: 6
  - Quality Control Team Member: 7
  - Designer Manager: 8
  - Designer Team Member: 9

### Kanban Board Role-Based Permissions
**CRITICAL**: The TeamKanbanBoard component uses role-based drag-and-drop restrictions. Each role has specific allowed status transitions.

#### Configuration System (`src/utils/kanbanRoleConfig.ts`)
- Centralized role permission management
- Defines allowed statuses and transitions per role
- Provides utility functions: `getKanbanConfigForRoles()`, `isTransitionAllowed()`, `isDragAllowed()`
- Returns `ColumnRestrictionReason` enum for translation keys

#### Role-Specific Workflows
- **Software Developer (ID: 5)**:
  - Allowed Statuses: To Do (1), In Progress (2), In Review (3)
  - Can drag/drop between these three statuses only
  - Cannot access: Rework (4), Completed (5)

- **Quality Control Team Member (ID: 7)**:
  - Allowed Statuses: In Review (3), Rework (4), Completed (5)
  - From In Review → can move to Rework or Completed
  - From Rework → can move to In Review or Completed
  - Cannot access: To Do (1), In Progress (2)

- **Analyst (ID: 3)**:
  - **SPECIAL CASE**: Only sees and works with adhoc tasks (typeId = 3)
  - Allowed Statuses: To Do (1), In Progress (2), Completed (5)
  - Can drag/drop between To Do and In Progress
  - Completed status handled via hover switch (adhoc quick completion)
  - Cannot access: In Review (3), Rework (4)
  - Task filtering: TeamKanbanBoard filters to show only adhoc tasks for Analysts
  - Workflow: To Do → In Progress → Completed (via switch hover)

- **Designer Team Member (ID: 9)**:
  - Same as Software Developer workflow
  - Allowed Statuses: To Do (1), In Progress (2), In Review (3)

- **Managers & Administrators (IDs: 1, 2, 4, 6, 8)**:
  - Full access to all statuses (1-5)
  - Can move tasks between any statuses

#### Visual Indicators
- 🔒 Lock icon on restricted columns with translated tooltip
- Disabled cursor (`cursor-default`) on non-draggable tasks
- 50% opacity on invalid drop zones during drag
- Tooltips use translation keys: `teamDashboard.kanban.notAccessible`, `cannotModify`, `cannotDragFrom`, `cannotDropTo`

#### API Integration
- **Endpoint**: `PATCH /api/Tasks/{id}` (TasksController)
- **Request Body**: `{ statusId: number, comment?: string }`
- **Service**: `tasksService.updateTaskStatus(taskId, statusId, comment)`
- **Status History**: Automatically creates TaskStatusHistory record with:
  - `TaskId`: The task being updated
  - `OldStatus`: Previous status ID
  - `NewStatus`: New status ID
  - `ChangedByPrsId`: User who made the change (from UserContext)
  - `Comment`: Descriptive comment (e.g., "Status changed from To Do to In Progress via Kanban board")
  - `UpdatedAt`: Timestamp of change
- **Permission Checks**: Happen on frontend before API call
- **Error Handling**: Failed transitions logged to console, optimistic updates remain
- **Optimistic UI**: Component updates local state immediately, no refetching or remounting

#### Multi-Role Support
- Users with multiple roles get union of permissions
- Admin/Manager role grants full access regardless of other roles
- Example: Developer + QC role = access to all statuses 1-5

## Performance Considerations

- Use React.memo for expensive re-renders
- Implement proper loading states with Skeleton components
- Use React Query for API state management
- Optimize images and assets
- Lazy load non-critical components

## Error Handling Patterns

### Backend Error Handling (.NET API)
- **User Deletion Validation**: 
  - `UserService.DeleteUserAsync()` checks dependencies before deletion via `UserRepository.CheckUserDependenciesAsync()`
  - Validates references in: TaskAssignments, ProjectRequirements, DesignRequests, SubTasks, CalendarEvents, CalendarEventAssignments, Notifications, Teams
  - Throws `InvalidOperationException` with detailed dependency list if user has active references
  - Example error: "Cannot delete user 'username'. The user is referenced in: TaskAssignments (5), ProjectRequirements (3)"

- **Duplicate User Detection**:
  - `UserService.CreateUserAsync()` validates uniqueness before insert
  - Checks both `UserName` (via `GetByUserNameAsync()`) and `PrsId` (via `GetByPrsIdAsync()`)
  - Throws `InvalidOperationException` with specific message: "User with username '{username}' already exists" or "User with PRS ID {prsId} already exists"

- **Database Constraint Violations**:
  - `UsersController` catches `DbUpdateException` for constraint violations
  - Parses constraint names (IX_Users_UserName, PK_Users) to provide user-friendly messages
  - Returns structured `ApiResponse` with error message in `error` field

### Frontend Error Handling
- **ApiError Structure**: 
  - Error responses structured as `{ success: false, data: null, error: "message", pagination: null }`
  - Frontend extracts error from `error.data.error` property
  - Falls back to `error.message` if `error.data.error` is not available

- **Error Translation System**:
  - `utils/errorTranslation.ts` provides `translateBackendError()` function
  - Parses English error patterns and translates to current language (Arabic/English)
  - Patterns supported:
    * "Cannot delete user" → dependency list translation
    * "User with username '{0}' already exists" → username duplication
    * "User with PRS ID {0} already exists" → PrsId duplication
    * Constraint violations → user-friendly messages
  - Dependency type mapping: TaskAssignments → "task assignments", ProjectRequirements → "project requirements", etc.

- **Toast Notifications with Custom Messages**:
  - Updated `utils/toast.ts` functions to accept optional message parameter
  - `showDeleteError(message?)`, `showCreateError(message?)`, `showUpdateError(message?)`
  - Usage pattern:
    ```typescript
    import { translateBackendError } from "@/utils/errorTranslation";
    
    try {
      await userService.deleteUser(userId);
      showSuccessToast(t("users.deleteSuccess"));
    } catch (error) {
      const errorMessage = error.data?.error || error.message;
      const translatedError = translateBackendError(errorMessage, t);
      showDeleteError(translatedError);
    }
    ```

- **Bilingual Error Messages**:
  - All error translations added to `LanguageContext.tsx` under `users.error.*` namespace
  - English keys: `cannotDelete`, `usernameExists`, `prsIdExists`, `constraintViolation`, etc.
  - Arabic translations: "لا يمكن حذف المستخدم", "المستخدم باسم '{0}' موجود بالفعل", etc.
  - Dependency translations: "taskAssignments", "projectRequirements", "designRequests", etc.

### General Error Handling
- Use try-catch blocks for async operations
- Implement error boundaries for component errors
- Provide user-friendly error messages with translation
- Log errors appropriately for debugging
- Graceful fallbacks for failed API calls
- Always extract and display backend error messages from `ApiResponse.error` field

## Development Workflow

1. Always start with `npm run dev:all` for full functionality
2. Make changes in small, focused commits
3. Run `npm run lint` before committing
4. Test in both English and Arabic modes
5. Verify responsive behavior
6. Check TypeScript compilation with `tsc`
7. **DO NOT create test files** unless specifically requested by the user
8. **DO NOT create documentation files or readme files** unless told
9. dont run npm run dev since its always running by myself.

## File Creation Guidelines

- **Components**: Always add proper translations immediately
- **API Services**: Use existing service patterns, never direct fetch calls
- **Hooks**: Follow existing naming conventions and patterns
- **Test Files**: DO NOT create test files automatically - only when explicitly requested
- **Documentation**: DO NOT create markdown documentation files (.md) or guides unless specifically asked
- **AI Integration**: Application uses n8n workflow + Ollama (Llama 3.1 8B) for AI-powered form suggestions

## AI-Powered Features

### Local LLM Integration
- **Runtime**: Ollama (localhost:11434)
- **Model**: Llama 3.1 8B (optimized for Arabic and technical writing)
- **Orchestration**: n8n workflow (localhost:5678/webhook/ai-suggest)
- **Hardware**: Runs on RTX 3090 (24GB VRAM, ~16GB usage)
- **Performance**: ~700-900ms response time

### AI Service Architecture
- **Service**: `src/services/api/llmService.ts` - Handles n8n webhook calls with conversation history
- **Conversation Service**: `src/services/conversationHistoryService.ts` - Manages conversation history in localStorage
- **Hook**: `src/hooks/useFormSuggestion.ts` - React hook for AI suggestions with context
- **Configuration**: 
  - `VITE_LLM_ENABLED=true` - Enable/disable AI features
  - `VITE_LLM_USE_N8N=true` - Use n8n workflow (vs direct Ollama)
  - `VITE_LLM_N8N_WEBHOOK_URL=http://localhost:5678/webhook/ai-suggest`
- **Workflow**: `n8n-workflows/ai-form-suggestion-workflow.json`

### Conversation History System
- **Storage**: localStorage with 7-day expiration
- **Limits**: Last 10 exchanges (20 messages) per context
- **Context ID**: Unique identifier per conversation (e.g., "requirement-123")
- **Features**:
  - Persistent across browser sessions
  - Auto-cleanup of old conversations
  - Clear history functionality
  - Message timestamps
  - Role tracking (user/assistant)

### AI Implementation Pattern
When adding AI suggestions to forms:
1. Add Sparkles icon button with Tooltip
2. Create modal for user prompt input with conversation history display
3. Show context (form fields already filled)
4. Call n8n webhook with context + conversation history array
5. Display conversation in chat-like UI (user messages right, AI left)
6. Store messages in conversationHistory state
7. Support "Clear History" button
8. Populate field with AI response
9. Add translations for all AI-related UI text
10. Support Enter key to send message (Shift+Enter for newline)

### Example AI Integration (Requirements Page)
- **Location**: `src/pages/project-requirements.tsx`
- **Feature**: AI-powered requirement description generation with conversation memory
- **UI**: Sparkles icon next to "Description" field
- **Modal**: 
  - 2xl size with scrollable content
  - Conversation history display with chat bubbles
  - Prompt input with Enter key support
  - Clear history button in header
  - Context display (only shown when no history)
- **Handler**: `handleAIGenerate()` function:
  - Sends conversationHistory array to n8n webhook
  - Updates local conversation state with user + assistant messages
  - Clears input but keeps modal open for continued conversation
- **Response**: Inserts HTML-formatted text into ReactQuill editor
- **State Management**:
  - `conversationHistory`: Array of {role, content, timestamp} objects
  - `handleClearConversation()`: Resets conversation history
  - Modal doesn't clear history on close (only on explicit clear)

### AI Prompt Engineering
- **Role**: "Expert software requirements analyst"
- **Output**: 3-5 sentence technical descriptions
- **Language**: Auto-detects Arabic vs English
- **Context**: Uses requirement name, project name, user input, AND conversation history
- **Quality**: Technical terminology, standards (APIs, databases), performance criteria
- **Conversation Context**: 
  - n8n workflow receives `conversationHistory` array
  - Prompts include previous exchanges for context continuity
  - AI instructed to "use previous conversation as context but not repeat information"
  - Arabic: "استخدم المحادثة السابقة كسياق لتحسين الإجابة الحالية، لكن لا تكرر نفس المعلومات"
  - English: "Use the previous conversation as context to improve the current response, but do not repeat the same information"

## Common Issues & Solutions

### Build Issues
- **TypeScript errors**: Fix all type issues before building
- **Missing dependencies**: Run `npm install` in both root and `mock-api-server/`
- **Port conflicts**: Default ports are 5173 (frontend) and 3002 (API)

### Development Issues
- **API calls failing**: Ensure mock API server is running
- **SignalR connection issues**: Check server status and CORS configuration
- **Styling issues**: Verify Tailwind classes and HeroUI component usage
- **Language switching**: Ensure translations exist in LanguageContext

## Validation Steps

Before any code changes, agents should:
1. Run `npm run dev:all` to ensure full application functionality
2. Test basic navigation and core features
3. Verify both language modes work correctly
4. Check responsive design on different screen sizes
5. Validate TypeScript compilation with `tsc`
6. Run linting with `npm run lint`

## Trust These Instructions

These instructions are comprehensive and regularly updated. Trust the information provided here and only search for additional context if:
- Specific implementation details are missing
- New features require documentation updates
- Error messages indicate configuration issues not covered
- API endpoints or data structures have changed

When in doubt, refer to the existing codebase patterns and maintain consistency with established conventions. -->