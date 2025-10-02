using PMA.Core.Entities;
using PMA.Core.DTOs;
using TaskEntity = PMA.Core.Entities.Task;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace PMA.Core.Interfaces;

public interface IProjectService
{
        System.Threading.Tasks.Task<(IEnumerable<Project> Projects, int TotalCount)> GetProjectsAsync(int page, int limit, string? search = null, int? status = null, string? priority = null);
    System.Threading.Tasks.Task<Project?> GetProjectByIdAsync(int id);
    System.Threading.Tasks.Task<Project> CreateProjectAsync(Project project);
    System.Threading.Tasks.Task UpdateProjectAsync(Project project);
    System.Threading.Tasks.Task DeleteProjectAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20);
    System.Threading.Tasks.Task<object> GetProjectStatsAsync();
    System.Threading.Tasks.Task<Project> SendProjectAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<Project>> GetProjectsWithTimelinesAsync();
    System.Threading.Tasks.Task<Project?> GetProjectWithTimelinesAsync(int projectId);
}

public interface IUserService
{
    System.Threading.Tasks.Task<(IEnumerable<UserDto> Users, int TotalCount)> GetUsersAsync(int page, int limit, bool? isVisible = null, int? departmentId = null);
    System.Threading.Tasks.Task<User?> GetUserByIdAsync(int id);
    System.Threading.Tasks.Task<User?> GetUserByUserNameAsync(string userName);
    System.Threading.Tasks.Task<User> CreateUserAsync(User user);
    System.Threading.Tasks.Task<User> UpdateUserAsync(User user);
    System.Threading.Tasks.Task<bool> DeleteUserAsync(int id);
    System.Threading.Tasks.Task<User?> GetUserWithRolesAndActionsAsync(int id);
    System.Threading.Tasks.Task<CurrentUserDto?> GetCurrentUserAsync();
    System.Threading.Tasks.Task AssignRolesToUserAsync(int userId, List<int> roleIds);
    System.Threading.Tasks.Task AssignActionsToUserAsync(int userId, List<int> actionIds);
    System.Threading.Tasks.Task RemoveUserRolesAsync(int userId, List<int> roleIds);
    System.Threading.Tasks.Task RemoveUserActionsAsync(int userId, List<int> actionIds);
}

public interface ITaskService
{
    System.Threading.Tasks.Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null);
    System.Threading.Tasks.Task<TaskEntity?> GetTaskByIdAsync(int id);
    System.Threading.Tasks.Task<TaskEntity> CreateTaskAsync(TaskEntity task);
    System.Threading.Tasks.Task<TaskEntity> UpdateTaskAsync(TaskEntity task);
    System.Threading.Tasks.Task<bool> DeleteTaskAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksBySprintAsync(int sprintId);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByAssigneeAsync(int assigneeId);
    System.Threading.Tasks.Task<TaskEntity?> GetTaskWithSubTasksAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> SearchTasksAsync(string query, int? timelineId = null, int limit = 25);
    
    // New methods for assignments and dependencies
    System.Threading.Tasks.Task UpdateTaskAssignmentsAsync(int taskId, IEnumerable<int> memberIds);
    System.Threading.Tasks.Task UpdateTaskDependenciesAsync(int taskId, IEnumerable<int> predecessorIds);
    System.Threading.Tasks.Task<IEnumerable<TaskAssignment>> GetTaskAssignmentsAsync(int taskId);
    System.Threading.Tasks.Task<IEnumerable<TaskDependency>> GetTaskDependenciesAsync(int taskId);
}

public interface ISprintService
{
    System.Threading.Tasks.Task<(IEnumerable<Sprint> Sprints, int TotalCount)> GetSprintsAsync(int page, int limit, int? projectId = null, int? status = null);
    System.Threading.Tasks.Task<Sprint?> GetSprintByIdAsync(int id);
    System.Threading.Tasks.Task<Sprint> CreateSprintAsync(Sprint sprint);
    System.Threading.Tasks.Task<Sprint> UpdateSprintAsync(Sprint sprint);
    System.Threading.Tasks.Task<bool> DeleteSprintAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Sprint>> GetSprintsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<Sprint?> GetActiveSprintByProjectAsync(int projectId);
}

public interface IRequirementService
{
    System.Threading.Tasks.Task<(IEnumerable<Requirement> Requirements, int TotalCount)> GetRequirementsAsync(int page, int limit, int? projectId = null, string? status = null, string? priority = null);
    System.Threading.Tasks.Task<Requirement?> GetRequirementByIdAsync(int id);
    System.Threading.Tasks.Task<Requirement> CreateRequirementAsync(Requirement requirement);
    System.Threading.Tasks.Task<Requirement> UpdateRequirementAsync(Requirement requirement);
    System.Threading.Tasks.Task<bool> DeleteRequirementAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Requirement>> GetRequirementsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<Requirement?> GetRequirementWithCommentsAsync(int id);
}

public interface IDepartmentService
{
    System.Threading.Tasks.Task<(IEnumerable<(Department Department, int MemberCount)> Departments, int TotalCount)> GetDepartmentsAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<Department?> GetDepartmentByIdAsync(int id);
    System.Threading.Tasks.Task<Department> CreateDepartmentAsync(Department department);
    System.Threading.Tasks.Task<Department> UpdateDepartmentAsync(Department department);
    System.Threading.Tasks.Task<bool> DeleteDepartmentAsync(int id);
    System.Threading.Tasks.Task<(IEnumerable<TeamMemberDto> Members, int TotalCount)> GetDepartmentMembersAsync(int departmentId, int page = 1, int limit = 10);
    System.Threading.Tasks.Task<TeamMemberDto> AddDepartmentMemberAsync(int departmentId, int userId, string role);
    System.Threading.Tasks.Task<TeamMemberDto> UpdateDepartmentMemberAsync(int departmentId, int memberId, string? role, bool? isActive);
    System.Threading.Tasks.Task<bool> RemoveMemberByIdAsync(int memberId);
    System.Threading.Tasks.Task<IEnumerable<EmployeeDto>> SearchUsersInTeamsAsync(string searchTerm);
}

public interface IUnitService
{
    System.Threading.Tasks.Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, string? search = null, int? parentId = null, bool? isActive = null);
    System.Threading.Tasks.Task<Unit?> GetUnitByIdAsync(int id);
    System.Threading.Tasks.Task<Unit> CreateUnitAsync(Unit unit);
    System.Threading.Tasks.Task<Unit> UpdateUnitAsync(Unit unit);
    System.Threading.Tasks.Task<bool> DeleteUnitAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetActiveUnitsAsync();
    System.Threading.Tasks.Task<IEnumerable<UnitTreeDto>> GetUnitsTreeAsync();
    System.Threading.Tasks.Task<IEnumerable<UnitTreeDto>> GetRootUnitsTreeAsync();
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetRootUnitsAsync();
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetUnitChildrenAsync(int parentId);
    System.Threading.Tasks.Task<IEnumerable<UnitTreeDto>> GetUnitChildrenTreeAsync(int parentId);
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetUnitPathAsync(int unitId);
    System.Threading.Tasks.Task<IEnumerable<Unit>> SearchUnitsAsync(string searchTerm);
    System.Threading.Tasks.Task<UnitStatsDto> GetUnitStatsAsync();
}

public interface IRoleService
{
    System.Threading.Tasks.Task<(IEnumerable<RoleDto> Roles, int TotalCount)> GetRolesAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<RoleDto?> GetRoleByIdAsync(int id);
    System.Threading.Tasks.Task<RoleDto> CreateRoleAsync(RoleCreateDto roleDto);
    System.Threading.Tasks.Task<RoleDto> UpdateRoleAsync(RoleUpdateDto roleDto);
    System.Threading.Tasks.Task<bool> DeleteRoleAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<RoleDto>> GetActiveRolesAsync();
    System.Threading.Tasks.Task<RoleDto?> GetRoleWithActionsAsync(int id);
}

public interface IActionService
{
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsAsync(int page, int limit, string? category = null, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetAllActionsAsync();
    System.Threading.Tasks.Task<Permission?> GetActionByIdAsync(int id);
    System.Threading.Tasks.Task<Permission> CreateActionAsync(Permission action);
    System.Threading.Tasks.Task<Permission> UpdateActionAsync(Permission action);
    System.Threading.Tasks.Task<bool> DeleteActionAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActiveActionsAsync();
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsByCategoryAsync(string category);
}

public interface INotificationService
{
    System.Threading.Tasks.Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsAsync(int page, int limit, int? userId = null, bool? isRead = null);
    System.Threading.Tasks.Task<Notification?> GetNotificationByIdAsync(int id);
    System.Threading.Tasks.Task<Notification> CreateNotificationAsync(Notification notification);
    System.Threading.Tasks.Task<Notification> UpdateNotificationAsync(Notification notification);
    System.Threading.Tasks.Task<bool> DeleteNotificationAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Notification>> GetNotificationsByUserAsync(int userId);
    System.Threading.Tasks.Task<bool> MarkAsReadAsync(int notificationId);
    System.Threading.Tasks.Task MarkAllAsReadAsync(int userId);
}

public interface ICalendarEventService
{
    System.Threading.Tasks.Task<(IEnumerable<CalendarEvent> CalendarEvents, int TotalCount)> GetCalendarEventsAsync(int page, int limit, int? projectId = null, int? createdBy = null, DateTime? startDate = null, DateTime? endDate = null);
    System.Threading.Tasks.Task<CalendarEvent?> GetCalendarEventByIdAsync(int id);
    System.Threading.Tasks.Task<CalendarEvent> CreateCalendarEventAsync(CalendarEvent calendarEvent);
    System.Threading.Tasks.Task<CalendarEvent> UpdateCalendarEventAsync(CalendarEvent calendarEvent);
    System.Threading.Tasks.Task<bool> DeleteCalendarEventAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<CalendarEvent>> GetCalendarEventsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<CalendarEvent>> GetCalendarEventsByCreatorAsync(int creatorId);
}

public interface IEmployeeService
{
    System.Threading.Tasks.Task<(IEnumerable<EmployeeDto> Employees, int TotalCount)> GetEmployeesAsync(int page, int limit, int? statusId = null);
    System.Threading.Tasks.Task<EmployeeDto?> GetEmployeeByIdAsync(int id);
    System.Threading.Tasks.Task<EmployeeDto> CreateEmployeeAsync(Employee employee);
    System.Threading.Tasks.Task<EmployeeDto> UpdateEmployeeAsync(Employee employee);
    System.Threading.Tasks.Task<bool> DeleteEmployeeAsync(int id);
    System.Threading.Tasks.Task<(IEnumerable<EmployeeDto> Employees, int TotalCount)> SearchEmployeesAsync(string query, int page = 1, int limit = 20);
}

public interface ILookupService
{
    System.Threading.Tasks.Task<IEnumerable<LookupDto>> GetLookupsAsync(string? code = null);
    System.Threading.Tasks.Task<LookupDto?> GetLookupByIdAsync(int id);
    System.Threading.Tasks.Task<LookupDto> CreateLookupAsync(Lookup lookup);
    System.Threading.Tasks.Task<LookupDto> UpdateLookupAsync(Lookup lookup);
    System.Threading.Tasks.Task<bool> DeleteLookupAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<LookupDto>> GetLookupsByCategoryAsync(string code);
}

public interface IMemberTaskService
{
    System.Threading.Tasks.Task<(IEnumerable<MemberTaskDto> MemberTasks, int TotalCount)> GetMemberTasksAsync(int page, int limit, int? projectId = null, int? primaryAssigneeId = null, int? status = null, int? priority = null);
    System.Threading.Tasks.Task<MemberTaskDto?> GetMemberTaskByIdAsync(int id);
    System.Threading.Tasks.Task<MemberTaskDto> CreateMemberTaskAsync(MemberTaskDto memberTask);
    System.Threading.Tasks.Task<MemberTaskDto> UpdateMemberTaskAsync(MemberTaskDto memberTask);
    System.Threading.Tasks.Task<bool> DeleteMemberTaskAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<MemberTaskDto>> GetMemberTasksByProjectAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<MemberTaskDto>> GetMemberTasksByAssigneeAsync(int assigneeId);
}


public interface IProjectRequirementService
{
    System.Threading.Tasks.Task<(IEnumerable<ProjectRequirement> ProjectRequirements, int TotalCount)> GetProjectRequirementsAsync(int page, int limit, int? projectId = null, int? status = null, string? priority = null, string? search = null);
    System.Threading.Tasks.Task<ProjectRequirement?> GetProjectRequirementByIdAsync(int id);
    System.Threading.Tasks.Task<ProjectRequirement> CreateProjectRequirementAsync(ProjectRequirement projectRequirement);
    System.Threading.Tasks.Task<ProjectRequirement> UpdateProjectRequirementAsync(ProjectRequirement projectRequirement);
    System.Threading.Tasks.Task<bool> DeleteProjectRequirementAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<(IEnumerable<AssignedProjectDto> AssignedProjects, int TotalCount)> GetAssignedProjectsAsync(int? userId, int page, int limit, string? search = null, int? projectId = null);
    System.Threading.Tasks.Task<ProjectRequirementStatsDto> GetProjectRequirementStatsAsync(int projectId);
    System.Threading.Tasks.Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetDevelopmentRequirementsAsync(int page, int limit);
    System.Threading.Tasks.Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetDraftRequirementsAsync(int page, int limit);
    System.Threading.Tasks.Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetApprovedRequirementsAsync(int page, int limit, int? projectId = null, string? priority = null, string? search = null);
    System.Threading.Tasks.Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetPendingApprovalRequirementsAsync(int page, int limit, int? status = null, string? priority = null, string? search = null);
    System.Threading.Tasks.Task<bool> SendRequirementAsync(int id);
    System.Threading.Tasks.Task<bool> ApproveRequirementAsync(int id);
    System.Threading.Tasks.Task<RequirementTask?> CreateRequirementTaskAsync(int requirementId, CreateRequirementTaskDto taskDto);
    System.Threading.Tasks.Task<ProjectRequirementAttachment?> UploadAttachmentAsync(int requirementId, object file);
    // New bulk upload (does not remove existing attachments)
    System.Threading.Tasks.Task<IReadOnlyList<ProjectRequirementAttachment>> UploadAttachmentsAsync(int requirementId, IEnumerable<IFormFile> files);
    System.Threading.Tasks.Task<bool> DeleteAttachmentAsync(int requirementId, int attachmentId);
    System.Threading.Tasks.Task<DTOs.FileDownloadResult?> DownloadAttachmentAsync(int requirementId, int attachmentId);
    // Bulk sync: add new files & remove specified attachment IDs in one operation
    System.Threading.Tasks.Task<IReadOnlyList<ProjectRequirementAttachment>?> SyncAttachmentsAsync(int requirementId, IEnumerable<IFormFile> newFiles, IEnumerable<int> removeIds);
}

public interface ISubTaskService
{
    System.Threading.Tasks.Task<(IEnumerable<SubTask> SubTasks, int TotalCount)> GetSubTasksAsync(int page, int limit, int? taskId = null, int? assigneeId = null, int? statusId = null);
    System.Threading.Tasks.Task<SubTask?> GetSubTaskByIdAsync(int id);
    System.Threading.Tasks.Task<SubTask> CreateSubTaskAsync(SubTask subTask);
    System.Threading.Tasks.Task<SubTask> UpdateSubTaskAsync(SubTask subTask);
    System.Threading.Tasks.Task<bool> DeleteSubTaskAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<SubTask>> GetSubTasksByTaskAsync(int taskId);
    System.Threading.Tasks.Task<IEnumerable<SubTask>> GetSubTasksByAssigneeAsync(int assigneeId);
}

public interface ITimelineService
{
    System.Threading.Tasks.Task<(IEnumerable<Timeline> Timelines, int TotalCount)> GetTimelinesAsync(int page, int limit, int? projectId = null);
    System.Threading.Tasks.Task<Timeline?> GetTimelineByIdAsync(int id);
    System.Threading.Tasks.Task<Timeline> CreateTimelineAsync(Timeline timeline);
    System.Threading.Tasks.Task<Timeline> UpdateTimelineAsync(Timeline timeline);
    System.Threading.Tasks.Task<bool> DeleteTimelineAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Timeline>> GetTimelinesByProjectAsync(int projectId);
}

 
public interface ICacheInvalidationService
{
    void InvalidateCurrentUserCache(string username);
    System.Threading.Tasks.Task InvalidateCurrentUserCacheByIdAsync(int userId, IUserRepository userRepository);
    void InvalidateAllUserCaches();
}

public class CreateRequirementTaskDto
{
    public int? DeveloperId { get; set; }
    public int? QcId { get; set; }
    public int? DesignerId { get; set; }
    public string? Description { get; set; }
    
    // Developer dates
    public DateTime? DeveloperStartDate { get; set; }
    public DateTime? DeveloperEndDate { get; set; }

    // QC dates
    public DateTime? QcStartDate { get; set; }
    public DateTime? QcEndDate { get; set; }

    // Designer dates
    public DateTime? DesignerStartDate { get; set; }
    public DateTime? DesignerEndDate { get; set; }
}

