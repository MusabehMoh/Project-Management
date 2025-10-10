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
- `src/PMA.Infrastructure/` - Data access and infrastructure
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

2. **Avoid These Props** (they cause dropdown close issues):
   - ❌ `isRequired` - Triggers HTML5 validation that conflicts with custom validation
   - ❌ `disallowEmptySelection` - Prevents dropdown from closing when clicking selected item
   - ❌ `validationBehavior="aria"` - Not needed for basic functionality
   - ❌ `selectionMode="single"` - Redundant, single is default

3. **Use Custom Validation**:
   - Implement validation in a `validateForm()` function
   - Don't rely on HeroUI's built-in validation props
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
  - **Layout**: Vertical stack - ModernQuickStats → TeamKanbanBoard (full-width) → Grid layout (70/30 split)
  - **Left Column (70%)**: TeamQuickActions stacked with Calendar
  - **Right Column (30%)**: MyAssignedTasks stacked with MyNextDeadline
  - **Simplified Design**: No additional stats cards, calendar without sidebar
  - **Focus**: Task management, Kanban board, quick status updates, and deadline tracking
  - **Refresh Strategy**: 
    - Kanban board: No refresh on drag-and-drop (optimistic updates only)
    - Other components (TeamQuickActions, MyAssignedTasks, MyNextDeadline): Refresh only when updates come from TeamQuickActions
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
  - **Modern Minimalist Stats**: Horizontal pill-style layout with 4 metrics
    - Average Efficiency: success-50 background, displays team average efficiency percentage
    - Tasks Completed: primary-50 background, shows total completed tasks count
    - Average Task Time: warning-50 background, displays avg completion time in hours
    - Tasks In Progress: secondary-50 background, shows currently active tasks count
    - **Pattern**: `flex gap-3`, `flex-1`, `rounded-lg px-3 py-2`, `text-2xl font-semibold` for numbers, `text-xs` for labels
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
    - Service: `designerWorkloadService` (src/services/api/designerWorkloadService.ts)
    - Hook: `useDesignerWorkload` (src/hooks/useDesignerWorkload.ts) with pagination, search, filters, sorting
    - Backend Endpoints:
      - `GET /api/designers/workload` - Returns paginated designer workload data
        - Query params: `page`, `pageSize`, `searchQuery`, `statusFilter`, `sortBy`, `sortOrder`
        - Response: `{ designers: DesignerWorkloadDto[], pagination: { currentPage, pageSize, totalItems, totalPages } }`
      - `GET /api/designers/metrics` - Returns team-wide metrics
        - Response: `TeamMetricsDto` object
    - DTOs:
      - **DesignerWorkloadDto**: `prsId` (number), `designerName` (string), `gradeName` (string), `currentTasksCount` (number), `completedTasksCount` (number), `averageTaskCompletionTime` (number), `efficiency` (number), `workloadPercentage` (number), `availableHours` (number), `status` (string: "Available" | "Busy" | "Blocked" | "On Leave")
      - **TeamMetricsDto**: `totalDesigners` (number), `activeDesigners` (number), `averageEfficiency` (number), `totalTasksCompleted` (number), `totalTasksInProgress` (number), `averageTaskCompletionTime` (number)
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
  - **Features**: Native HTML5 drag-and-drop, real-time status updates via API, role-based permissions, audit trail
  - **Columns**: Uses dynamic status lookup (statuses 1-5): To Do, In Progress, In Review, Rework, Completed
  - **Status Names**: Fetched from lookup service (not hardcoded)
    - Status 1: "To Do" / "جديد"
    - Status 2: "In Progress" / "جاري"  
    - Status 3: "In Review" / "تحت الإختبار"
    - Status 4: "Rework" / "إعادة"
    - Status 5: "Completed" / "مكتملة"
  - **Task Cards**: Title, priority chip, project/requirement info, end date, progress %, overdue badge
  - **Color Coding**: Column headers (default/primary/warning/danger/success), priority chips
  - **Scrolling**: 500px height ScrollShadow for each column
  - **API Integration**: 
    - Data Fetching: Uses `useTaskStatusLookups()` hook and `membersTasksService.getTasks()`
    - Status Updates: Uses `tasksService.updateTaskStatus()` via TasksController PATCH endpoint
  - **Drag Behavior**: 
    - Calls `PATCH /api/Tasks/{id}` endpoint with `{ statusId: number, comment: string }`
    - Automatically creates TaskStatusHistory record with old/new status, user, and comment
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

- **Analyst (ID: 3)** & **Designer Team Member (ID: 9)**:
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

- Use try-catch blocks for async operations
- Implement error boundaries for component errors
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Graceful fallbacks for failed API calls

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
- **Documentation**: DO NOT create documentation files unless specifically asked

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