# Dashboard API Endpoints Summary

This document lists all the new API endpoints created for the Analyst Manager Dashboard components.

## Controllers Created

### 1. DashboardStatsController
**Base URL:** `/api/dashboard-stats`

Provides statistics for the ModernQuickStats component.

**Endpoints:**
- `GET /api/dashboard-stats` - Get basic dashboard statistics
  - Returns: active projects, total tasks, in-progress tasks, overdue tasks
  
- `GET /api/dashboard-stats/detailed` - Get detailed dashboard statistics
  - Returns: projects by status, tasks by status/priority, upcoming deadlines, requirements stats

---

### 2. QuickActionsController
**Base URL:** `/api/quick-actions`

Provides data for the QuickActions component.

**Endpoints:**
- `GET /api/quick-actions/data` - Get all quick actions data
  - Returns: unassigned projects, projects without requirements, available members, stats
  
- `GET /api/quick-actions/unassigned-projects` - Get only unassigned projects
  
- `GET /api/quick-actions/projects-without-requirements` - Get projects without requirements
  
- `GET /api/quick-actions/available-analysts` - Get available analysts for assignment
  
- `GET /api/quick-actions/stats` - Get quick action statistics

---

### 3. ProjectRequirementsController (Enhanced)
**Base URL:** `/api/project-requirements`

Added new endpoints for PendingRequirements component and team workload.

**New Endpoints:**
- `GET /api/project-requirements/draft-requirements` - Get draft/pending requirements
  - Query params: `page`, `limit`
  
- `GET /api/project-requirements/team-workload-performance` - Redirect to TeamWorkloadController
  - For backward compatibility with frontend services

---

### 4. TeamWorkloadController
**Base URL:** `/api/team-workload`

Provides data for the TeamWorkloadPerformance component.

**Endpoints:**
- `GET /api/team-workload/performance` - Get team workload performance metrics
  - Query params: `departmentId`, `busyStatus`, `page`, `limit`
  - Returns: team member metrics with workload, busy status, performance scores
  
- `GET /api/team-workload/summary` - Get workload summary statistics
  
- `GET /api/team-workload/member/{userId}` - Get individual member workload details

---

### 5. PipelineController
**Base URL:** `/api/pipeline`

Provides data for the ProjectPipeline component.

**Endpoints:**
- `GET /api/pipeline/projects` - Get projects grouped by pipeline stages
  - Returns: planning, in-progress, and completed projects with requirements data
  
- `GET /api/pipeline/summary` - Get pipeline summary statistics
  
- `GET /api/pipeline/by-unit/{unitId}` - Get pipeline filtered by organizational unit

---

### 6. RequirementCompletionController
**Base URL:** `/api/requirement-completion`

Provides data for the RequirementCompletionTracker component.

**Endpoints:**
- `GET /api/requirement-completion/analytics` - Get completion analytics
  - Query params: `analystId`, `projectId`
  - Returns: overdue items, at-risk items, completion statistics
  
- `GET /api/requirement-completion/metrics` - Get completion metrics over time
  - Query params: `period` (week/month/quarter/year), `analystId`, `projectId`
  
- `GET /api/requirement-completion/analyst-performance` - Get analyst performance data
  - Query params: `analystId`, `top`

---

### 7. NotificationsController (Enhanced)
**Base URL:** `/api/notifications`

Added urgent notifications endpoint for the UrgentNotifications component.

**New Endpoint:**
- `GET /api/notifications/urgent` - Get urgent/high-priority notifications
  - Query params: `userId`, `limit`
  - Returns: notifications marked as urgent, critical, overdue, or high priority

---

### 8. RequirementOverviewController
**Base URL:** `/api/requirement-overview`

Provides data for the RequirementOverview component.

**Endpoints:**
- `GET /api/requirement-overview/stats` - Get requirement overview statistics
  - Query params: `analystId`, `projectId`, `period`
  - Returns: new requirements, ongoing requirements, active requirements, pending approvals
  
- `GET /api/requirement-overview/status-breakdown` - Get requirements grouped by status
  - Query params: `analystId`, `projectId`
  
- `GET /api/requirement-overview/priority-breakdown` - Get requirements grouped by priority
  - Query params: `analystId`, `projectId`, `status`

---

## Frontend Service Mappings

### Component → API Endpoint Mapping

1. **ModernQuickStats** → `GET /api/dashboard-stats`
2. **QuickActions** → `GET /api/quick-actions/data`
3. **PendingRequirements** → `GET /api/project-requirements/draft-requirements`
4. **TeamWorkloadPerformance** → `GET /api/team-workload/performance`
5. **ProjectPipeline** → `GET /api/pipeline/projects`
6. **RequirementCompletionTracker** → `GET /api/requirement-completion/analytics`
7. **UrgentNotifications** → `GET /api/notifications/urgent`
8. **RequirementOverview** → `GET /api/requirement-overview/stats`

---

## Database Relationships Used

All controllers properly use Entity Framework Core relationships:

- **Projects** ↔ **ProjectAnalysts** (many-to-many via ProjectAnalysts table)
- **Projects** ↔ **ProjectRequirements** (one-to-many)
- **Projects** ↔ **Units** (many-to-one)
- **Users** ↔ **Departments** (many-to-one)
- **Users** ↔ **UserRoles** ↔ **Roles** (many-to-many)
- **Tasks** ↔ **TaskAssignments** ↔ **Users** (many-to-many via TaskAssignments)
- **Requirements** ↔ **Users** (AssignedTo relationship)
- **Notifications** ↔ **Users** (many-to-one)

---

## Response Format

All endpoints follow the standard API response format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## Notes

1. All controllers inherit from `ApiBaseController` for consistent response formatting
2. Proper error handling with try-catch blocks and logging
3. Support for filtering by analyst, project, department where applicable
4. Pagination support for list endpoints
5. Proper use of Entity Framework Core for database queries
6. Performance optimized with selective includes and projections
7. Code-First approach respecting existing database schema
