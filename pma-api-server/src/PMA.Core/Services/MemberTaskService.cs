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
    private readonly IDesignRequestRepository _designRequestRepository;

    public MemberTaskService(
        ITaskRepository taskRepository, 
        IUserContextAccessor userContextAccessor, 
        IUserService userService, 
        IDepartmentService departmentService,
        IDesignRequestRepository designRequestRepository)
    {
        _taskRepository = taskRepository;
        _userContextAccessor = userContextAccessor;
        _userService = userService;
        _departmentService = departmentService;
        _designRequestRepository = designRequestRepository;
    }

    public async Task<(IEnumerable<TaskDto> MemberTasks, int TotalCount)> GetMemberTasksAsync(int page, int limit, int? projectId = null, int? primaryAssigneeId = null, int? status = null, int? priority = null, int? departmentId = null, string? search = null, int? typeId = null)
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
            assigneeId = primaryAssigneeId; // Allow filtering by any assignee
            deptId = null;
        }
        else if (isManager)
        {
            // Managers see all tasks for their department, but can filter by specific assignee
            // The repository will ensure department-level security
            assigneeId = primaryAssigneeId; // Allow assignee filtering for managers
            if (currentUser.Roles != null && currentUser.Roles.Count > 0 && currentUser.Roles[0]?.Department?.Id != null)
            {
                deptId = currentUser.Roles[0].Department?.Id;
            }
        }
        else
        {
            // Regular users see only their assigned tasks
            int currentUserId = 0;
            if (int.TryParse(userContext.PrsId, out currentUserId))
            {
                if (!primaryAssigneeId.HasValue)
                {
                    assigneeId = currentUserId;
                }
                // If primaryAssigneeId is provided for regular users, only allow their own ID
                else if (primaryAssigneeId.Value == currentUserId)
                {
                    assigneeId = primaryAssigneeId;
                }
                else
                {
                    assigneeId = currentUserId; // Fallback to their own tasks
                }
            }
        }

        // Use TaskRepository to get tasks with assignee filter
        int? statusId = status;
        int? priorityId = priority;

        var (tasks, totalCount) = await _taskRepository.GetTasksAsync(page, limit, null, projectId, assigneeId, statusId, priorityId, deptId, search, typeId);

        // Get design request information for all tasks
        var taskIds = tasks.Select(t => t.Id).ToList();
        var designRequestTaskIds = await _designRequestRepository.GetTaskIdsWithDesignRequestsAsync(taskIds);
        var designRequestTaskIdSet = new HashSet<int>(designRequestTaskIds);

        var memberTasks = tasks.Select(task => MapTaskEntityToTaskDto(task, designRequestTaskIdSet));

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

    private TaskDto MapTaskEntityToTaskDto(TaskEntity task, HashSet<int> designRequestTaskIds)
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
            TypeId = task.TypeId,
            Description = task.Description ?? "",
            StartDate = task.StartDate,
            EndDate = task.EndDate,
            StatusId = task.StatusId,
            PriorityId = task.PriorityId,
            Progress = task.Progress,  
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            AssignedMembers = assignedMembers,
            MemberIds = assignedMembers.Select(a => a.Id).ToList(),
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
                AnalystIds = new List<int>(), // You might need to populate this
                StartDate = task.ProjectRequirement.Project.StartDate,
                ExpectedCompletionDate = task.ProjectRequirement.Project.ExpectedCompletionDate,
                Description = task.ProjectRequirement.Project.Description,
                Remarks = task.ProjectRequirement.Project.Remarks,
                Status = task.ProjectRequirement.Project.Status,
                CreatedAt = task.ProjectRequirement.Project.CreatedAt,
                UpdatedAt = task.ProjectRequirement.Project.UpdatedAt,
                Priority = task.ProjectRequirement.Project.Priority, 
                Progress = task.ProjectRequirement.Project.Progress
            } : null,
            Requirement = task.ProjectRequirement != null ? new RequirementBasicDto
            {
                Id = task.ProjectRequirement.Id.ToString(),
                Name = task.ProjectRequirement.Name
            } : null,
            HasDesignRequest = designRequestTaskIds.Contains(task.Id)
            //PrimaryAssignee = primaryAssignee
        };
    }
 
 

    public async Task<TaskDto?> GetMemberTaskByIdAsync(int id)
    {
        var task = await _taskRepository.GetByIdAsync(id);
        if (task == null) return null;

        // Check if this task has a design request
        var hasDesignRequest = await _designRequestRepository.HasDesignRequestForTaskAsync(id);
        var designRequestTaskIds = new HashSet<int>();
        if (hasDesignRequest)
        {
            designRequestTaskIds.Add(id);
        }

        return MapTaskEntityToTaskDto(task, designRequestTaskIds);
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

        // Update only the fields that should be updated (status, progress, dates, etc.)
        existingTask.StatusId = memberTask.StatusId;
        existingTask.Progress = memberTask.Progress;
        existingTask.StartDate = memberTask.StartDate;
        existingTask.EndDate = memberTask.EndDate;
        existingTask.UpdatedAt = DateTime.UtcNow;

        // Save the changes (UpdateAsync returns Task, not Task<T>)
        await _taskRepository.UpdateAsync(existingTask);
        
        // Check if this task has a design request
        var hasDesignRequest = await _designRequestRepository.HasDesignRequestForTaskAsync(existingTask.Id);
        var designRequestTaskIds = new HashSet<int>();
        if (hasDesignRequest)
        {
            designRequestTaskIds.Add(existingTask.Id);
        }
        
        return MapTaskEntityToTaskDto(existingTask, designRequestTaskIds);
    }

    public async Task<bool> DeleteMemberTaskAsync(int id)
    {
        // Similar to create/update, this should probably be handled differently
        throw new NotImplementedException("Deleting member tasks should be done through TaskService");
    }

    public async Task<IEnumerable<TaskDto>> GetMemberTasksByProjectAsync(int projectId)
    {
        var tasks = await _taskRepository.GetTasksByProjectAsync(projectId);
        
        // Get design request information for all tasks
        var taskIds = tasks.Select(t => t.Id).ToList();
        var designRequestTaskIds = await _designRequestRepository.GetTaskIdsWithDesignRequestsAsync(taskIds);
        var designRequestTaskIdSet = new HashSet<int>(designRequestTaskIds);
        
        return tasks.Select(task => MapTaskEntityToTaskDto(task, designRequestTaskIdSet));
    }

    public async Task<IEnumerable<TaskDto>> GetMemberTasksByAssigneeAsync(int assigneeId)
    {
        var tasks = await _taskRepository.GetTasksByAssigneeAsync(assigneeId);
        
        // Get design request information for all tasks
        var taskIds = tasks.Select(t => t.Id).ToList();
        var designRequestTaskIds = await _designRequestRepository.GetTaskIdsWithDesignRequestsAsync(taskIds);
        var designRequestTaskIdSet = new HashSet<int>(designRequestTaskIds);
        
        return tasks.Select(task => MapTaskEntityToTaskDto(task, designRequestTaskIdSet));
    }

    public async Task<IEnumerable<MemberSearchResultDto>> GetTeamMembersAsync()
    {
        // Get current user context
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated || string.IsNullOrWhiteSpace(userContext.PrsId))
        {
            return Enumerable.Empty<MemberSearchResultDto>();
        }

        // Get current user with roles to determine access level
        var currentUser = await _userService.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return Enumerable.Empty<MemberSearchResultDto>();
        }

        bool isAdministrator = currentUser.Roles?.Any(r => IsRoleCode(r.Code, RoleCodes.Administrator)) ?? false;
        bool isManager = currentUser.Roles?.Any(r => IsManagerRole(r.Code)) ?? false;

        // Get team members based on role
        var teamMembers = await _taskRepository.GetTeamMembersAsync(
            isAdministrator: isAdministrator,
            isManager: isManager,
            currentUserDepartmentId: currentUser.Roles?.FirstOrDefault()?.Department?.Id
        );

        return teamMembers.Select(member => new MemberSearchResultDto
        {
            Id = member.PrsId, // Use PrsId as the Id for member search
            UserName = member.UserName ?? "",
            MilitaryNumber = member.MilitaryNumber ?? "",
            FullName = member.FullName ?? "",
            GradeName = member.GradeName ?? "",
            StatusId = member.Employee?.StatusId ?? 1, // Default to active if no employee record
            Department = member.Department?.Name ?? ""
        });
    }

    public async Task<bool> ChangeTaskAssigneesAsync(int taskId, IEnumerable<int> assigneeIds, string? notes = null)
    { 
        // Get the task to ensure it exists
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null)
        {
            throw new InvalidOperationException($"Task with ID {taskId} not found");
        }

        // Update task assignments directly using the repository
        await _taskRepository.UpdateTaskAssignmentsAsync(taskId, assigneeIds);

        // Note: Audit trail for assignee changes could be added here in the future
        // if a TaskAssigneeHistory table is created

        return true;
    }
}

