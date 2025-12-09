using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.DTOs.Tasks;
using TaskEntity = PMA.Core.Entities.Task;
using Task = System.Threading.Tasks.Task;
using PMA.Core.Enums;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

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

    public async Task<(IEnumerable<TaskDto> MemberTasks, int TotalCount)> GetMemberTasksAsync(int page, int limit, int? projectId = null, int? primaryAssigneeId = null, int? status = null, int? priority = null, int? departmentId = null, string? search = null, int? typeId = null, DateTime? startDate = null, DateTime? endDate = null)
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

        // Check if current user is QC Manager to include additional developer tasks
        bool isQCManager = currentUser.Roles?.Any(r => IsRoleCode(r.Code, RoleCodes.QCManager)) ?? false;
        List<TaskEntity> additionalTasks = new List<TaskEntity>();
        
        //if (isQCManager)
        //{
        //    // Get task IDs that have no dependent tasks
        //    var noDependentTaskIds = await _taskRepository.GetTaskIdsWithNoDependentTasksAsync();
        //    var noDependentTaskIdsSet = new HashSet<int>(noDependentTaskIds);
            
        //    // Get developer tasks that have no dependent tasks
        //    var developerTasksWithNoDependents = await _taskRepository.GetTasksAsync(1, 1000, null, null, null, null, null, null, null, null);
        //    var filteredDeveloperTasks = developerTasksWithNoDependents.Tasks
        //        .Where(t => t.RoleType == "Developer" && noDependentTaskIdsSet.Contains(t.Id))
        //        .ToList();
            
        //    additionalTasks.AddRange(filteredDeveloperTasks);
        //}

        // Combine regular tasks with additional tasks for analyst manager
        var allTasks = tasks.Concat(additionalTasks).DistinctBy(t => t.Id).ToList();
        var allTotalCount = totalCount + additionalTasks.Count;

        // Get design request information for all tasks
        var taskIds = allTasks.Select(t => t.Id).ToList();
        var designRequestTaskIds = await _designRequestRepository.GetTaskIdsWithDesignRequestsAsync(taskIds);
        var designRequestTaskIdSet = new HashSet<int>(designRequestTaskIds);

        // Get task IDs with no dependent tasks for the HasNoDependentTasks property
        var taskIdsWithNoDependents = await _taskRepository.GetTaskIdsWithNoDependentTasksAsync();
        var taskIdsWithNoDependentsSet = new HashSet<int>(taskIdsWithNoDependents);

        var memberTasksList = new List<TaskDto>();
        foreach (var task in allTasks)
        {
            var taskDto = await MapTaskEntityToTaskDto(task, designRequestTaskIdSet, taskIdsWithNoDependentsSet);
            memberTasksList.Add(taskDto);
        }

        return (memberTasksList, allTotalCount);
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

    private async Task<TaskDto> MapTaskEntityToTaskDto(TaskEntity task, HashSet<int> designRequestTaskIds, HashSet<int>? taskIdsWithNoDependents = null)
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

        // Get assigned designer from design request
        var designRequest = task.DesignRequests?.FirstOrDefault();
        var assignedDesigner = designRequest?.AssignedToEmployee;
        MemberSearchResultDto? designerDto = null;
        TaskEntity? designerTask = null;
        
        if (assignedDesigner != null)
        {
            designerDto = new MemberSearchResultDto
            {
                Id = assignedDesigner.Id,
                UserName = assignedDesigner.UserName ?? "",
                MilitaryNumber = assignedDesigner.MilitaryNumber ?? "",
                FullName = assignedDesigner.FullName ?? "",
                GradeName = assignedDesigner.GradeName ?? "",
                StatusId = assignedDesigner.StatusId,
                Department = "" // Employee doesn't have direct department property
            };
            
            // Get designer task if DesignerTaskId exists
            if (designRequest?.DesignerTaskId.HasValue == true)
            {
                designerTask = await _taskRepository.GetByIdAsync(designRequest.DesignerTaskId.Value);
            }
        }

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
            RoleType=task.RoleType ?? "",
            AssignedMembers = assignedMembers,
            AssignedDesigner = designerDto,
            MemberIds = assignedMembers.Select(a => a.Id).ToList(),
            DepartmentId = task.DepartmentId,
            SprintId=task.SprintId,
            TimelineId=task.TimelineId,
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
                ProjectOwnerEmployee = task.ProjectRequirement.Project.ProjectOwnerEmployee != null ? new EmployeeDto
                {
                    Id = task.ProjectRequirement.Project.ProjectOwnerEmployee.Id,
                    UserName = task.ProjectRequirement.Project.ProjectOwnerEmployee.UserName,
                    MilitaryNumber = task.ProjectRequirement.Project.ProjectOwnerEmployee.MilitaryNumber,
                    GradeName = task.ProjectRequirement.Project.ProjectOwnerEmployee.GradeName,
                    FullName = task.ProjectRequirement.Project.ProjectOwnerEmployee.FullName,
                    StatusId = task.ProjectRequirement.Project.ProjectOwnerEmployee.StatusId
                } : null,
                AlternativeOwnerEmployee = task.ProjectRequirement.Project.AlternativeOwnerEmployee != null ? new EmployeeDto
                {
                    Id = task.ProjectRequirement.Project.AlternativeOwnerEmployee.Id,
                    UserName = task.ProjectRequirement.Project.AlternativeOwnerEmployee.UserName,
                    MilitaryNumber = task.ProjectRequirement.Project.AlternativeOwnerEmployee.MilitaryNumber,
                    GradeName = task.ProjectRequirement.Project.AlternativeOwnerEmployee.GradeName,
                    FullName = task.ProjectRequirement.Project.AlternativeOwnerEmployee.FullName,
                    StatusId = task.ProjectRequirement.Project.AlternativeOwnerEmployee.StatusId
                } : null,
                OwningUnit = task.ProjectRequirement.Project.OwningUnitEntity.Name??"",
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
            HasDesignRequest = designRequestTaskIds.Contains(task.Id),
            HasNoDependentTasks = taskIdsWithNoDependents?.Contains(task.Id) ?? false,
            CompletedFromDeveloper = task.CompletedFromDeveloper,
            DesignerTaskId = designerTask?.Id,
            DesignerTaskStatus = designerTask?.StatusId
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

        return await MapTaskEntityToTaskDto(task, designRequestTaskIds);
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
        existingTask.UpdatedAt = DateTime.Now;

        // Save the changes (UpdateAsync returns Task, not Task<T>)
        await _taskRepository.UpdateAsync(existingTask);
        
        // Check if this task has a design request
        var hasDesignRequest = await _designRequestRepository.HasDesignRequestForTaskAsync(existingTask.Id);
        var designRequestTaskIds = new HashSet<int>();
        if (hasDesignRequest)
        {
            designRequestTaskIds.Add(existingTask.Id);
        }
        
        return await MapTaskEntityToTaskDto(existingTask, designRequestTaskIds);
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
        
        var taskDtos = new List<TaskDto>();
        foreach (var task in tasks)
        {
            var taskDto = await MapTaskEntityToTaskDto(task, designRequestTaskIdSet);
            taskDtos.Add(taskDto);
        }
        
        return taskDtos;
    }

    public async Task<IEnumerable<TaskDto>> GetMemberTasksByAssigneeAsync(int assigneeId)
    {
        var tasks = await _taskRepository.GetTasksByAssigneeAsync(assigneeId);
        
        // Get design request information for all tasks
        var taskIds = tasks.Select(t => t.Id).ToList();
        var designRequestTaskIds = await _designRequestRepository.GetTaskIdsWithDesignRequestsAsync(taskIds);
        var designRequestTaskIdSet = new HashSet<int>(designRequestTaskIds);
        
        var taskDtos = new List<TaskDto>();
        foreach (var task in tasks)
        {
            var taskDto = await MapTaskEntityToTaskDto(task, designRequestTaskIdSet);
            taskDtos.Add(taskDto);
        }
        
        return taskDtos;
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

    public async Task<IEnumerable<TaskCommentDto>> GetTaskCommentsAsync(int taskId)
    {
        // Get current user context
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated)
        {
            return Enumerable.Empty<TaskCommentDto>();
        }

        var comments = await _taskRepository.GetTaskCommentsAsync(taskId);

        // Map to DTOs and include user names
        var commentDtos = new List<TaskCommentDto>();
        foreach (var comment in comments)
        {
            var user = await _userService.GetUserByUserNameAsync((comment.CreatedBy));
            var commentDto = new TaskCommentDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                CommentText = comment.CommentText,
                CreatedAt = comment.CreatedAt,
                CreatedBy = comment.CreatedBy,
                CreatedByName = user?.FullName ?? comment.CreatedBy
            };
            commentDtos.Add(commentDto);
        }

        return commentDtos.OrderByDescending(c => c.CreatedAt);
    }

    public async Task<TaskCommentDto> AddTaskCommentAsync(int taskId, string commentText)
    {
        // Get current user context
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated || string.IsNullOrWhiteSpace(userContext.PrsId))
        {
            throw new UnauthorizedAccessException("User not authenticated");
        }

        // Verify task exists
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null)
        {
            throw new InvalidOperationException($"Task with ID {taskId} not found");
        }

        var comment = await _taskRepository.AddTaskCommentAsync(taskId, commentText, userContext.UserName);

        // Get user name for the response
        var user = await _userService.GetUserByUserNameAsync(comment.CreatedBy);

        return new TaskCommentDto
        {
            Id = comment.Id,
            TaskId = comment.TaskId,
            CommentText = comment.CommentText,
            CreatedAt = comment.CreatedAt,
            CreatedBy = comment.CreatedBy,
            CreatedByName = user?.FullName ?? comment.CreatedBy
        };
    }

    public async Task<IEnumerable<TaskHistoryDto>> GetTaskHistoryAsync(int taskId)
    {
        // Get current user context
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated)
        {
            return Enumerable.Empty<TaskHistoryDto>();
        }

        var history = await _taskRepository.GetTaskHistoryAsync(taskId);

        // Map to DTOs and include user names
        var historyDtos = new List<TaskHistoryDto>();
        foreach (var changeGroup in history)
        {
            var user = await _userService.GetUserByUserNameAsync(changeGroup.ChangedBy);
            var historyDto = new TaskHistoryDto
            {
                Id = changeGroup.Id,
                EntityType = changeGroup.EntityType,
                EntityId = changeGroup.EntityId,
                ChangedBy = changeGroup.ChangedBy,
                ChangedByName = user?.FullName ?? changeGroup.ChangedBy,
                ChangedAt = changeGroup.ChangedAt,
                Items = changeGroup.Items.Select(item => new TaskHistoryItemDto
                {
                    Id = item.Id,
                    FieldName = item.FieldName,
                    OldValue = item.OldValue,
                    NewValue = item.NewValue
                }).ToList()
            };
            historyDtos.Add(historyDto);
        }

        return historyDtos.OrderByDescending(h => h.ChangedAt);
    }

    // Attachment methods
    public async Task<IEnumerable<TaskAttachmentDto>> GetTaskAttachmentsAsync(int taskId)
    {
        var attachments = await _taskRepository.GetTaskAttachmentsAsync(taskId);

        // Map to DTOs and include user names
        var attachmentDtos = new List<TaskAttachmentDto>();
        foreach (var attachment in attachments)
        {
            var user = await _userService.GetUserByUserNameAsync(attachment.CreatedBy ?? string.Empty);
            var attachmentDto = new TaskAttachmentDto
            {
                Id = attachment.Id,
                TaskId = attachment.TaskId,
                FileName = attachment.FileName,
                OriginalName = attachment.OriginalName,
                FileSize = attachment.FileSize,
                ContentType = attachment.ContentType,
                UploadedAt = attachment.UploadedAt,
                CreatedBy = attachment.CreatedBy,
                CreatedByName = user?.FullName ?? attachment.CreatedBy
            };
            attachmentDtos.Add(attachmentDto);
        }

        return attachmentDtos.OrderByDescending(a => a.UploadedAt);
    }

    public async Task<TaskAttachmentDto> AddTaskAttachmentAsync(int taskId, IFormFile file)
    {
        // Get current user context
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated || string.IsNullOrWhiteSpace(userContext.UserName))
        {
            throw new UnauthorizedAccessException("User not authenticated");
        }

        // Verify task exists
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null)
        {
            throw new InvalidOperationException("Task not found");
        }

        // Read file to byte array
        byte[] fileData;
        using (var memoryStream = new MemoryStream())
        {
            await file.CopyToAsync(memoryStream);
            fileData = memoryStream.ToArray();
        }

        // Create attachment entity with FileData (not FilePath)
        var attachment = new TaskAttachment
        {
            TaskId = taskId,
            FileName = Path.GetFileName(file.FileName),
            OriginalName = file.FileName,
            FileData = fileData,
            FileSize = file.Length,
            ContentType = file.ContentType,
            CreatedBy = userContext.UserName
        };

        var savedAttachment = await _taskRepository.AddTaskAttachmentAsync(attachment);

        // Get user info for DTO
        var user = await _userService.GetUserByUserNameAsync(userContext.UserName);

        return new TaskAttachmentDto
        {
            Id = savedAttachment.Id,
            TaskId = savedAttachment.TaskId,
            FileName = savedAttachment.FileName,
            OriginalName = savedAttachment.OriginalName,
            FileSize = savedAttachment.FileSize,
            ContentType = savedAttachment.ContentType,
            UploadedAt = savedAttachment.UploadedAt,
            CreatedBy = savedAttachment.CreatedBy,
            CreatedByName = user?.FullName ?? savedAttachment.CreatedBy
        };
    }

    public async Task<(Stream? FileStream, string? FileName, string? ContentType)> DownloadTaskAttachmentAsync(int attachmentId)
    {
        // Load attachment with FileData from database
        var attachment = await _taskRepository.GetAttachmentWithFileDataAsync(attachmentId);
        if (attachment == null || attachment.FileData == null || attachment.FileData.Length == 0)
        {
            return (null, null, null);
        }

        // Create memory stream from FileData byte array
        var memoryStream = new MemoryStream(attachment.FileData);
        return (memoryStream, attachment.OriginalName, attachment.ContentType ?? "application/octet-stream");
    }

    public async Task<bool> DeleteTaskAttachmentAsync(int attachmentId)
    {
        var attachment = await _taskRepository.GetTaskAttachmentByIdAsync(attachmentId);
        if (attachment == null)
        {
            return false;
        }

        // Delete from database only (FileData is stored in database, no file system cleanup needed)
        await _taskRepository.DeleteTaskAttachmentAsync(attachmentId);
        return true;
    }
}

