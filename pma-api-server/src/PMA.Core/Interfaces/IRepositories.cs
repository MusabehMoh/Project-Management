using PMA.Core.Entities;
using PMA.Core.DTOs;
using TaskEntity = PMA.Core.Entities.Task;
using System.Threading.Tasks;

namespace PMA.Core.Interfaces;

public interface IRepository<T> where T : class
{
    System.Threading.Tasks.Task<T?> GetByIdAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<T>> GetAllAsync();
    System.Threading.Tasks.Task<T> AddAsync(T entity);
    System.Threading.Tasks.Task UpdateAsync(T entity);
    System.Threading.Tasks.Task DeleteAsync(T entity);
    System.Threading.Tasks.Task<bool> ExistsAsync(int id);
}

public interface IProjectRepository : IRepository<Project>
{
    System.Threading.Tasks.Task<IEnumerable<Project>> GetProjectsWithPaginationAsync(int page, int limit, string? search = null, int? status = null, string? priority = null);
    System.Threading.Tasks.Task<int> GetTotalProjectsCountAsync(string? search = null, int? status = null, string? priority = null);
    System.Threading.Tasks.Task<(IEnumerable<Project> Projects, int TotalCount)> GetProjectsWithPaginationAndCountAsync(int page, int limit, string? search = null, int? status = null, string? priority = null);
    System.Threading.Tasks.Task<Project?> GetProjectWithDetailsAsync(int id);
    System.Threading.Tasks.Task<Project?> GetProjectAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20);
    System.Threading.Tasks.Task<(IEnumerable<AssignedProjectDto> AssignedProjects, int TotalCount)> GetAssignedProjectsAsync(string currentUserPrsId, int page, int limit, string? search = null, int? projectId = null, bool skipAnalystFilter = false);
    System.Threading.Tasks.Task<IEnumerable<Project>> GetProjectsWithTimelinesAsync();
    System.Threading.Tasks.Task<Project?> GetProjectWithTimelinesAsync(int projectId);
    System.Threading.Tasks.Task<List<string>> CheckProjectDependenciesAsync(int projectId);
}

public interface IUserRepository : IRepository<User>
{
    System.Threading.Tasks.Task<(IEnumerable<User> Users, int TotalCount)> GetUsersAsync(int page, int limit, string? search = null, bool? isActive = null, int? departmentId = null, int? roleId = null);
    System.Threading.Tasks.Task<User?> GetByUserNameAsync(string userName);
    System.Threading.Tasks.Task<User?> GetByPrsIdAsync(int prsId);
    System.Threading.Tasks.Task<User?> GetUserWithRolesAndActionsAsync(int id);
    System.Threading.Tasks.Task<User?> GetUserWithRolesByPrsIdAsync(int prsId);
    System.Threading.Tasks.Task<IEnumerable<User>> GetUsersByDepartmentAsync(int departmentId);
    System.Threading.Tasks.Task<List<string>> CheckUserDependenciesAsync(int userId);
}

public interface ITaskRepository : IRepository<TaskEntity>
{
    System.Threading.Tasks.Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null, int? priorityId = null, int? departmentId = null, string? search = null, int? typeId = null);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksBySprintAsync(int sprintId);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByAssigneeAsync(int assigneeId);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByProjectAsync(int projectId);
    System.Threading.Tasks.Task<TaskEntity?> GetTaskWithSubTasksAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> SearchTasksAsync(string query, int? timelineId = null, int limit = 25);
    
    // New methods for assignments and dependencies
    System.Threading.Tasks.Task UpdateTaskAssignmentsAsync(int taskId, IEnumerable<int> memberIds);
    System.Threading.Tasks.Task UpdateTaskDependenciesAsync(int taskId, IEnumerable<int> predecessorIds);
    System.Threading.Tasks.Task<IEnumerable<TaskAssignment>> GetTaskAssignmentsAsync(int taskId);
    System.Threading.Tasks.Task<IEnumerable<TaskDependency>> GetTaskDependenciesAsync(int taskId);
    System.Threading.Tasks.Task<IEnumerable<TaskDependency>> GetTaskPrerequisitesAsync(int taskId);

    System.Threading.Tasks.Task CleanupTaskDependenciesAsync(int taskId);
    System.Threading.Tasks.Task CleanupTaskAssignmentsAsync(int taskId);
    
    // Bulk fetch methods to reduce N+1 queries
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByIdsAsync(IEnumerable<int> taskIds);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetDependentTasksAsync(int taskId);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetPrerequisiteTasksAsync(int taskId);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByProjectRequirementIdAsync(int projectRequirementId);
    System.Threading.Tasks.Task<IEnumerable<(int RequirementId, int Status, bool IsCompleted)>> GetProjectRequirementsCompletionStatusAsync(int projectId);
    
    // Get tasks that have no other tasks depending on them
    System.Threading.Tasks.Task<IEnumerable<int>> GetTaskIdsWithNoDependentTasksAsync();
    
    // Team member access methods
    System.Threading.Tasks.Task<IEnumerable<User>> GetTeamMembersAsync(bool isAdministrator, bool isManager, int? currentUserDepartmentId);

    // Comments and history methods
    System.Threading.Tasks.Task<IEnumerable<TaskComment>> GetTaskCommentsAsync(int taskId);
    System.Threading.Tasks.Task<TaskComment> AddTaskCommentAsync(int taskId, string commentText, string createdBy);
    System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetTaskHistoryAsync(int taskId);

    // Attachment methods
    System.Threading.Tasks.Task<IEnumerable<TaskAttachment>> GetTaskAttachmentsAsync(int taskId);
    System.Threading.Tasks.Task<TaskAttachment?> GetTaskAttachmentByIdAsync(int attachmentId);
    System.Threading.Tasks.Task<TaskAttachment> AddTaskAttachmentAsync(TaskAttachment attachment);
    System.Threading.Tasks.Task DeleteTaskAttachmentAsync(int attachmentId);
}

public interface ITaskStatusHistoryRepository : IRepository<TaskStatusHistory>
{
    System.Threading.Tasks.Task<IEnumerable<TaskStatusHistory>> GetTaskStatusHistoryAsync(int taskId);
}

public interface IProjectRequirementStatusHistoryRepository : IRepository<ProjectRequirementStatusHistory>
{
    System.Threading.Tasks.Task<IEnumerable<ProjectRequirementStatusHistory>> GetRequirementStatusHistoryAsync(int requirementId);
}

public interface ISprintRepository : IRepository<Sprint>
{
    System.Threading.Tasks.Task<(IEnumerable<Sprint> Sprints, int TotalCount)> GetSprintsAsync(int page, int limit, int? projectId = null, int? status = null);
    System.Threading.Tasks.Task<IEnumerable<Sprint>> GetSprintsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<Sprint?> GetActiveSprintByProjectAsync(int projectId);
}

public interface IRequirementRepository : IRepository<Requirement>
{
    System.Threading.Tasks.Task<(IEnumerable<Requirement> Requirements, int TotalCount)> GetRequirementsAsync(int page, int limit, int? projectId = null, string? status = null, string? priority = null);
    System.Threading.Tasks.Task<IEnumerable<Requirement>> GetRequirementsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<Requirement>> GetRequirementsByAssigneeAsync(int assigneeId);
    System.Threading.Tasks.Task<Requirement?> GetRequirementWithCommentsAsync(int id);
}

public interface IProjectRequirementRepository : IRepository<ProjectRequirement>
{
    System.Threading.Tasks.Task<(IEnumerable<ProjectRequirement> ProjectRequirements, int TotalCount)> GetProjectRequirementsAsync(int page, int limit, int? projectId = null, int? status = null, string? priority = null, string? search = null, int[]? excludeStatuses = null);
    System.Threading.Tasks.Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByAnalystAsync(int analystId);
    System.Threading.Tasks.Task<ProjectRequirement?> GetProjectRequirementWithDetailsAsync(int id);
    System.Threading.Tasks.Task<ProjectRequirementStatsDto> GetProjectRequirementStatsAsync(int projectId);
    System.Threading.Tasks.Task<bool> DeleteAttachmentAsync(int requirementId, int attachmentId);
}

public interface IDepartmentRepository : IRepository<Department>
{
    System.Threading.Tasks.Task<(IEnumerable<(Department Department, int MemberCount)> Departments, int TotalCount)> GetDepartmentsAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<Department?> GetDepartmentByNameAsync(string name);
    System.Threading.Tasks.Task<List<string>> CheckMemberDependenciesAsync(int? prsId);
}

public interface ITeamRepository : IRepository<Team>
{
    System.Threading.Tasks.Task<(IEnumerable<Team> Teams, int TotalCount)> GetTeamsByDepartmentAsync(int departmentId, int page = 1, int limit = 10);
    System.Threading.Tasks.Task<Team?> GetTeamByIdAsync(int id);
    System.Threading.Tasks.Task<Team> AddTeamMemberAsync(Team team);
    System.Threading.Tasks.Task UpdateTeamMemberAsync(Team team);
    System.Threading.Tasks.Task<bool> RemoveTeamMemberAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Employee>> SearchEmployeesInTeamsAsync(string searchTerm);
    System.Threading.Tasks.Task<IEnumerable<Employee>> SearchEmployeesInDepartmentAsync(string searchTerm, int departmentId);
    System.Threading.Tasks.Task<IEnumerable<Team>> GetEmployeeOtherDepartmentsAsync(int prsId, int excludeDepartmentId);
}

public interface IUnitRepository : IRepository<Unit>
{
    System.Threading.Tasks.Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, string? search = null, int? parentId = null, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetActiveUnitsAsync();
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetRootUnitsAsync();
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetUnitChildrenAsync(int parentId);
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetUnitPathAsync(int unitId);
    System.Threading.Tasks.Task<IEnumerable<Unit>> SearchUnitsAsync(string searchTerm);
    System.Threading.Tasks.Task<UnitStatsDto> GetUnitStatsAsync();
}

public interface IRoleRepository : IRepository<Role>
{
    System.Threading.Tasks.Task<(IEnumerable<Role> Roles, int TotalCount)> GetRolesAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Role>> GetActiveRolesAsync();
    System.Threading.Tasks.Task<Role?> GetRoleWithActionsAsync(int id);
}

public interface IActionRepository : IRepository<Permission>
{
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsAsync(int page, int limit, string? category = null, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActiveActionsAsync();
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsByCategoryAsync(string category);
}

public interface INotificationRepository : IRepository<Notification>
{
    System.Threading.Tasks.Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsAsync(int page, int limit, int? userId = null, bool? isRead = null);
    System.Threading.Tasks.Task<IEnumerable<Notification>> GetNotificationsByUserAsync(int userId);
    System.Threading.Tasks.Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(int userId);
    System.Threading.Tasks.Task MarkAsReadAsync(int notificationId);
    System.Threading.Tasks.Task MarkAllAsReadAsync(int userId);
}

public interface IEmployeeRepository : IRepository<Employee>
{
    System.Threading.Tasks.Task<(IEnumerable<Employee> Employees, int TotalCount)> GetEmployeesAsync(int page, int limit, int? statusId = null);
    System.Threading.Tasks.Task<(IEnumerable<Employee> Employees, int TotalCount)> SearchEmployeesAsync(string query, int page = 1, int limit = 20);
    System.Threading.Tasks.Task<IEnumerable<Employee>> GetByIdsAsync(IEnumerable<int> ids);
}

public interface ILookupRepository : IRepository<Lookup>
{
    System.Threading.Tasks.Task<IEnumerable<Lookup>> GetLookupsAsync(string? code = null);
    System.Threading.Tasks.Task<IEnumerable<Lookup>> GetLookupsByCategoryAsync(string code);
}

public interface ITimelineRepository : IRepository<Timeline>
{
    System.Threading.Tasks.Task<(IEnumerable<Timeline> Timelines, int TotalCount)> GetTimelinesAsync(int page, int limit, int? projectId = null);
    System.Threading.Tasks.Task<IEnumerable<Timeline>> GetTimelinesByProjectAsync(int projectId);
}

public interface ICalendarEventRepository : IRepository<CalendarEvent>
{
    System.Threading.Tasks.Task<(IEnumerable<CalendarEvent> CalendarEvents, int TotalCount)> GetCalendarEventsAsync(int page, int limit, int? projectId = null, int? createdBy = null, DateTime? startDate = null, DateTime? endDate = null);
    System.Threading.Tasks.Task<IEnumerable<CalendarEvent>> GetCalendarEventsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<CalendarEvent>> GetCalendarEventsByCreatorAsync(int creatorId);
}

public interface IDesignRequestRepository : IRepository<DesignRequest>
{
    System.Threading.Tasks.Task<(IEnumerable<DesignRequest> DesignRequests, int TotalCount)> GetDesignRequestsAsync(int page, int limit, int? taskId = null, int? assignedToPrsId = null, int? status = null);
    System.Threading.Tasks.Task<DesignRequest?> GetDesignRequestByTaskIdAsync(int taskId);
    System.Threading.Tasks.Task<bool> HasDesignRequestForTaskAsync(int taskId);
    System.Threading.Tasks.Task<IEnumerable<int>> GetTaskIdsWithDesignRequestsAsync(IEnumerable<int> taskIds);
}



