using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.DTOs.Tasks;
using TaskEntity = PMA.Core.Entities.Task;
using Task = System.Threading.Tasks.Task;
using PMA.Core.Enums;

namespace PMA.Core.Services;

public class MemberTaskService : IMemberTaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IUserContextAccessor _userContextAccessor;
    private readonly IUserService _userService;
    private readonly IDepartmentService _departmentService;

    public MemberTaskService(
        ITaskRepository taskRepository, 
        IUserContextAccessor userContextAccessor, 
        IUserService userService, 
        IDepartmentService departmentService)
    {
        _taskRepository = taskRepository;
        _userContextAccessor = userContextAccessor;
        _userService = userService;
        _departmentService = departmentService;
    }

    public async Task<(IEnumerable<TaskDto> MemberTasks, int TotalCount)> GetMemberTasksAsync(int page, int limit, int? projectId = null, int? primaryAssigneeId = null, int? status = null, int? priority = null, int? departmentId = null)
    {
        // Get current user context for filtering logic (similar to ProjectRequirementService pattern)
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated || string.IsNullOrWhiteSpace(userContext.PrsId))
        {
            return (Enumerable.Empty<TaskDto>(), 0);
        }

        // Get current user with roles to determine access level
        var currentUser = await _userService.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return (Enumerable.Empty<TaskDto>(), 0);
        }

        // Determine filtering based on user role
        int? assigneeId = primaryAssigneeId;
        int? deptId = departmentId;

        bool isAdministrator = currentUser.Roles?.Any(r => IsRoleCode(r.Code, RoleCodes.Administrator)) ?? false;
        bool isManager = currentUser.Roles?.Any(r => IsManagerRole(r.Code)) ?? false;

        if (isAdministrator)
        {
            // Administrator sees all tasks - no filtering needed
            assigneeId = null;
            deptId = null;
        }
        else if (isManager)
        {
            // Managers see all tasks for their department
            assigneeId = null;
            if (currentUser.Roles != null && currentUser.Roles.Count > 0 && currentUser.Roles[0]?.Department?.Id != null)
            {
                deptId = currentUser.Roles[0].Department?.Id;
            }
        }
        else
        {
            // Regular users see only their assigned tasks
            if (!assigneeId.HasValue && int.TryParse(userContext.PrsId, out int currentUserId))
            {
                assigneeId = currentUserId;
            }
        }

        // Use TaskRepository to get tasks with assignee filter
        int? statusId = status;
        int? priorityId = priority;

        var (tasks, totalCount) = await _taskRepository.GetTasksAsync(page, limit, null, projectId, assigneeId, statusId, priorityId, deptId);

        var memberTasks = tasks.Select(MapTaskEntityToTaskDto);

        return (memberTasks, totalCount);
    }

    private bool IsRoleCode(string? roleCode, RoleCodes targetRole)
    {
        if (string.IsNullOrEmpty(roleCode))
            return false;

        return Enum.TryParse(roleCode, true, out RoleCodes parsedRole) && parsedRole == targetRole;
    }

    private bool IsManagerRole(string? roleCode)
    {
        if (string.IsNullOrEmpty(roleCode))
            return false;

        return Enum.TryParse(roleCode, true, out RoleCodes parsedRole) &&
               (parsedRole == RoleCodes.AnalystManager ||
                parsedRole == RoleCodes.DevelopmentManager ||
                parsedRole == RoleCodes.QCManager ||
                parsedRole == RoleCodes.DesignerManager);
    }

    private TaskDto MapTaskEntityToTaskDto(TaskEntity task)
    {
        // Get all assigned members
        var assignedMembers = task.Assignments?.Select(a => new MemberSearchResultDto
        {
            Id = a.Employee?.Id ?? 0,
            UserName = a.Employee?.UserName ?? "",
            MilitaryNumber = a.Employee?.MilitaryNumber ?? "",
            FullName = a.Employee?.FullName ?? "",
            GradeName = a.Employee?.GradeName ?? "",
            StatusId = a.Employee?.StatusId ?? 0,
            Department = "" // Employee doesn't have direct department property
        }).ToList() ?? new List<MemberSearchResultDto>();

        // Get primary assignee (first assignee or null)
        //var primaryAssignee = assignedMembers.FirstOrDefault();

        return new TaskDto
        {
            Id = task.Id,
            Name = task.Name ?? "",
            Description = task.Description ?? "",
            StartDate = task.StartDate,
            EndDate = task.EndDate,
            StatusId = task.StatusId,
            PriorityId = task.PriorityId,
            Progress = task.Progress,  
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            AssignedMembers = assignedMembers,
            DepartmentId = task.DepartmentId,
            DepartmentName = task.Department?.Name ?? "",
            Department = task.Department != null ? new DepartmentDto
            {
                Id = task.Department.Id,
                Name = task.Department.Name,
                IsActive = task.Department.IsActive,
                MemberCount = 0 // You might need to calculate this
            } : null,
            ProjectName = task.ProjectRequirement?.Project?.ApplicationName ?? "",
            Project = task.ProjectRequirement?.Project != null ? new ProjectDto
            {
                Id = task.ProjectRequirement.Project.Id,
                ApplicationName = task.ProjectRequirement.Project.ApplicationName,
                ProjectOwner = task.ProjectRequirement.Project.ProjectOwner,
                AlternativeOwner = task.ProjectRequirement.Project.AlternativeOwner,
                OwningUnit = task.ProjectRequirement.Project.OwningUnit,
                ProjectOwnerId = task.ProjectRequirement.Project.ProjectOwnerId,
                AlternativeOwnerId = task.ProjectRequirement.Project.AlternativeOwnerId,
                OwningUnitId = task.ProjectRequirement.Project.OwningUnitId,
                Analysts = task.ProjectRequirement.Project.Analysts,
                AnalystIds = new List<int>(), // You might need to populate this
                StartDate = task.ProjectRequirement.Project.StartDate,
                ExpectedCompletionDate = task.ProjectRequirement.Project.ExpectedCompletionDate,
                Description = task.ProjectRequirement.Project.Description,
                Remarks = task.ProjectRequirement.Project.Remarks,
                Status = task.ProjectRequirement.Project.Status,
                CreatedAt = task.ProjectRequirement.Project.CreatedAt,
                UpdatedAt = task.ProjectRequirement.Project.UpdatedAt,
                Priority = task.ProjectRequirement.Project.Priority,
                Budget = task.ProjectRequirement.Project.Budget,
                Progress = task.ProjectRequirement.Project.Progress
            } : null,
            Requirement = task.ProjectRequirement != null ? new RequirementBasicDto
            {
                Id = task.ProjectRequirement.Id.ToString(),
                Name = task.ProjectRequirement.Name
            } : null,
            //PrimaryAssignee = primaryAssignee
        };
    }
 
 

    public async Task<TaskDto?> GetMemberTaskByIdAsync(int id)
    {
        var task = await _taskRepository.GetByIdAsync(id);
        return task == null ? null : MapTaskEntityToTaskDto(task);
    }

    public async Task<TaskDto> CreateMemberTaskAsync(TaskDto memberTask)
    {
        // This method would need significant changes to work with TaskEntity
        // For now, let's throw a NotImplementedException since this should probably
        // be handled through a different service or updated interface
        throw new NotImplementedException("Creating member tasks should be done through TaskService");
    }

    public async Task<TaskDto> UpdateMemberTaskAsync(TaskDto memberTask)
    {
        // Get the existing task entity
        var existingTask = await _taskRepository.GetByIdAsync(memberTask.Id);
        if (existingTask == null)
        {
            throw new InvalidOperationException($"Task with ID {memberTask.Id} not found");
        }

        // Update only the fields that should be updated (status, progress, etc.)
        existingTask.StatusId = memberTask.StatusId;
        existingTask.Progress = memberTask.Progress;
        existingTask.UpdatedAt = DateTime.UtcNow;

        // Save the changes (UpdateAsync returns Task, not Task<T>)
        await _taskRepository.UpdateAsync(existingTask);
        
        return MapTaskEntityToTaskDto(existingTask);
    }

    public async Task<bool> DeleteMemberTaskAsync(int id)
    {
        // Similar to create/update, this should probably be handled differently
        throw new NotImplementedException("Deleting member tasks should be done through TaskService");
    }

    public async Task<IEnumerable<TaskDto>> GetMemberTasksByProjectAsync(int projectId)
    {
        var tasks = await _taskRepository.GetTasksByProjectAsync(projectId);
        return tasks.Select(MapTaskEntityToTaskDto);
    }

    public async Task<IEnumerable<TaskDto>> GetMemberTasksByAssigneeAsync(int assigneeId)
    {
        var tasks = await _taskRepository.GetTasksByAssigneeAsync(assigneeId);
        return tasks.Select(MapTaskEntityToTaskDto);
    }
}

