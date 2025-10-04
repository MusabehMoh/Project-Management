//using PMA.Core.Entities;
//using PMA.Core.Interfaces;
//using PMA.Core.DTOs;
//using TaskEntity = PMA.Core.Entities.Task;
//using Task = System.Threading.Tasks.Task;
//using PMA.Core.Enums;

//namespace PMA.Core.Services;

//public class MemberTaskService : IMemberTaskService
//{
//    private readonly ITaskRepository _taskRepository;

//    public MemberTaskService(ITaskRepository taskRepository)
//    {
//        _taskRepository = taskRepository;
//    }

//    public async Task<(IEnumerable<TaskDto> MemberTasks, int TotalCount)> GetMemberTasksAsync(int page, int limit, int? projectId = null, int? primaryAssigneeId = null, int? status = null, int? priority = null)
//    {
//        // Use TaskRepository to get tasks with assignee filter
//        int? statusId = status;
//        int? priorityId = priority;

//        var (tasks, totalCount) = await _taskRepository.GetTasksAsync(page, limit, null, projectId, primaryAssigneeId, statusId, priorityId);

//        var memberTasks = tasks.Select(MapTaskEntityToTaskDto);

//        return (memberTasks, totalCount);
//    }

//    private TaskDto MapTaskEntityToTaskDto(TaskEntity task)
//    {
//        // Get all assigned members
//        var assignedMembers = task.Assignments?.Select(a => new MemberSearchResultDto
//        {
//            Id = a.Employee?.Id ?? 0,
//            UserName = a.Employee?.UserName ?? "",
//            MilitaryNumber = a.Employee?.MilitaryNumber ?? "",
//            FullName = a.Employee?.FullName ?? "",
//            GradeName = a.Employee?.GradeName ?? "",
//            StatusId = a.Employee?.StatusId ?? 0,
//            Department = "" // Employee doesn't have direct department property
//        }).ToList() ?? new List<MemberSearchResultDto>();

//        // Get primary assignee (first assignee or null)
//        var primaryAssignee = assignedMembers.FirstOrDefault();

//        return new TaskDto
//        {
//            Id = task.Id.ToString(),
//            Name = task.Name ?? "",
//            Description = task.Description ?? "",
//            StartDate = task.StartDate.ToString("yyyy-MM-dd"),
//            EndDate = task.EndDate.ToString("yyyy-MM-dd"),
//            Progress = task.Progress,
//            Status = GetStatusDto((Enums.TaskStatus)task.StatusId),
//            Priority = GetPriorityDto(task.PriorityId),
//            Department = new TaskDepartmentDto
//            {
//                Id = task.Department?.Id.ToString() ?? "",
//                Name = task.Department?.Name ?? "",
//                Color = "#3b82f6" // Default color, you may want to get this from department
//            },
//            AssignedMembers = assignedMembers,
//            PrimaryAssignee = primaryAssignee,
//            MemberIds = assignedMembers.Select(m => m.Id).ToList(),
//            Project = new ProjectBasicDto
//            {
//                Id = task.Sprint?.Project?.Id.ToString() ?? "",
//                Name = task.Sprint?.Project?.ApplicationName ?? ""
//            },
//            Requirement = new RequirementBasicDto
//            {
//                Id = task.ProjectRequirement?.Id.ToString() ?? "",
//                Name = task.ProjectRequirement?.Name ?? ""
//            },
//            CanRequestDesign = true, // You may want to implement logic for this
//            TimeSpent = (int)Math.Round(task.ActualHours ?? 0),
//            EstimatedTime = (int)Math.Round(task.EstimatedHours ?? 0),
//            Tags = new List<string>(), // You may want to implement tags
//            IsOverdue = task.EndDate < DateTime.Now && task.StatusId != Enums.TaskStatus.Completed,
//            CreatedAt = task.CreatedAt.ToString("yyyy-MM-dd"),
//            UpdatedAt = task.UpdatedAt.ToString("yyyy-MM-dd")
//        };
//    }

//    private TaskStatusDto GetStatusDto(Enums.TaskStatus status)
//    {
//        return status switch
//        {
//            Enums.TaskStatus.ToDo => new TaskStatusDto { Id = 1, Label = "To Do", Color = "default" },
//            Enums.TaskStatus.InProgress => new TaskStatusDto { Id = 2, Label = "In Progress", Color = "primary" },
//            Enums.TaskStatus.InReview => new TaskStatusDto { Id = 3, Label = "In Review", Color = "secondary" },
//            Enums.TaskStatus.Rework => new TaskStatusDto { Id = 4, Label = "Rework", Color = "warning" },
//            Enums.TaskStatus.Completed => new TaskStatusDto { Id = 5, Label = "Completed", Color = "success" },
//            Enums.TaskStatus.OnHold => new TaskStatusDto { Id = 6, Label = "On Hold", Color = "default" },
//            _ => new TaskStatusDto { Id = 0, Label = "Unknown", Color = "default" }
//        };
//    }

//    private TaskPriorityDto GetPriorityDto(Priority priority)
//    {
//        return priority switch
//        {
//            Priority.Low => new TaskPriorityDto { Id = 1, Label = "Low", Color = "default" },
//            Priority.Medium => new TaskPriorityDto { Id = 2, Label = "Medium", Color = "primary" },
//            Priority.High => new TaskPriorityDto { Id = 3, Label = "High", Color = "warning" },
//            Priority.Critical => new TaskPriorityDto { Id = 4, Label = "Critical", Color = "danger" },
//            _ => new TaskPriorityDto { Id = 0, Label = "Unknown", Color = "default" }
//        };
//    }

//    public async Task<TaskDto?> GetMemberTaskByIdAsync(int id)
//    {
//        var task = await _taskRepository.GetByIdAsync(id);
//        return task == null ? null : MapTaskEntityToTaskDto(task);
//    }

//    public async Task<TaskDto> CreateMemberTaskAsync(TaskDto memberTask)
//    {
//        // This method would need significant changes to work with TaskEntity
//        // For now, let's throw a NotImplementedException since this should probably
//        // be handled through a different service or updated interface
//        throw new NotImplementedException("Creating member tasks should be done through TaskService");
//    }

//    public async Task<TaskDto> UpdateMemberTaskAsync(TaskDto memberTask)
//    {
//        // Similar to create, this should probably be handled differently
//        throw new NotImplementedException("Updating member tasks should be done through TaskService");
//    }

//    public async Task<bool> DeleteMemberTaskAsync(int id)
//    {
//        // Similar to create/update, this should probably be handled differently
//        throw new NotImplementedException("Deleting member tasks should be done through TaskService");
//    }

//    public async Task<IEnumerable<TaskDto>> GetMemberTasksByProjectAsync(int projectId)
//    {
//        var tasks = await _taskRepository.GetTasksByProjectAsync(projectId);
//        return tasks.Select(MapTaskEntityToTaskDto);
//    }

//    public async Task<IEnumerable<TaskDto>> GetMemberTasksByAssigneeAsync(int assigneeId)
//    {
//        var tasks = await _taskRepository.GetTasksByAssigneeAsync(assigneeId);
//        return tasks.Select(MapTaskEntityToTaskDto);
//    }
//}