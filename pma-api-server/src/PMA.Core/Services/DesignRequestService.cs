using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.DTOs.Tasks;
using PMA.Core.Enums;
using Task = System.Threading.Tasks.Task;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.Services;

public class DesignRequestService : IDesignRequestService
{
    private readonly IDesignRequestRepository _designRequestRepository;
    private readonly IMappingService _mappingService;
    private readonly IUserContextAccessor _userContextAccessor;
    private readonly ITaskService _taskService;
    private readonly IProjectRequirementService _requirementService;

    public DesignRequestService(
        IDesignRequestRepository designRequestRepository,
        IMappingService mappingService,
        IUserContextAccessor userContextAccessor,
        ITaskService taskService,
        IProjectRequirementService requirementService)
    {
        _designRequestRepository = designRequestRepository;
        _mappingService = mappingService;
        _userContextAccessor = userContextAccessor;
        _taskService = taskService;
        _requirementService = requirementService;
    }

    public async Task<(IEnumerable<DesignRequestDto> DesignRequests, int TotalCount)> GetDesignRequestsAsync(int page, int limit, int? taskId = null, int? assignedToPrsId = null, int? status = null, bool includeTaskDetails = false, bool includeRequirementDetails = false)
    {
        var (designRequests, totalCount) = await _designRequestRepository.GetDesignRequestsAsync(page, limit, taskId, assignedToPrsId, status);
        var designRequestDtos = new List<DesignRequestDto>();

        foreach (var dr in designRequests)
        {
            var dto = _mappingService.MapToDesignRequestDto(dr);
            
            // Optionally load task and requirement details
            if (includeTaskDetails && dr.TaskId.HasValue)
            {
                // Load task details if not already included
                if (dto.Task == null)
                {
                    var taskEntity = await _taskService.GetTaskByIdAsync(dr.TaskId.Value);
                    if (taskEntity != null)
                    {
                        // Convert Task entity to TaskDto
                        dto.Task = _mappingService.MapToTaskDto(taskEntity);
                    }
                }
            }
            
            // Load requirement details if requested and if we have a task with a requirement ID
            if (includeRequirementDetails && dto.Task?.ProjectRequirementId.HasValue == true)
            {
                var requirement = await _requirementService.GetProjectRequirementByIdAsync(dto.Task.ProjectRequirementId.Value);
                if (requirement != null)
                {
                    dto.RequirementDetails = _mappingService.MapToProjectRequirementDto(requirement);
                }
            }
            
            designRequestDtos.Add(dto);
        }
        
        return (designRequestDtos, totalCount);
    }

    public async Task<DesignRequestDto?> GetDesignRequestByIdAsync(int id)
    {
        var designRequest = await _designRequestRepository.GetByIdAsync(id);
        return designRequest == null ? null : _mappingService.MapToDesignRequestDto(designRequest);
    }

    public async Task<DesignRequestDto> CreateDesignRequestAsync(CreateDesignRequestDto createDesignRequestDto)
    {
        // Check if a design request already exists for this task
        var existingRequest = await _designRequestRepository.GetDesignRequestByTaskIdAsync(createDesignRequestDto.TaskId);
        if (existingRequest != null)
        {
            throw new InvalidOperationException("A design request already exists for this task");
        }

        var designRequest = _mappingService.MapToDesignRequest(createDesignRequestDto);
        var createdDesignRequest = await _designRequestRepository.AddAsync(designRequest);
        return _mappingService.MapToDesignRequestDto(createdDesignRequest);
    }

    public async Task<DesignRequestDto> UpdateDesignRequestAsync(DesignRequestDto designRequestDto)
    {
        var existingDesignRequest = await _designRequestRepository.GetByIdAsync(designRequestDto.Id);
        if (existingDesignRequest == null)
        {
            throw new KeyNotFoundException("Design request not found");
        }

        // Update properties
        existingDesignRequest.Notes = designRequestDto.Notes;
        existingDesignRequest.AssignedToPrsId = designRequestDto.AssignedToPrsId;
        existingDesignRequest.Status = designRequestDto.Status;
        existingDesignRequest.DueDate = designRequestDto.DueDate;
        existingDesignRequest.UpdatedAt = DateTime.UtcNow;

        await _designRequestRepository.UpdateAsync(existingDesignRequest);
        return _mappingService.MapToDesignRequestDto(existingDesignRequest);
    }

    public async Task<bool> DeleteDesignRequestAsync(int id)
    {
        var designRequest = await _designRequestRepository.GetByIdAsync(id);
        if (designRequest == null)
        {
            return false;
        }

        await _designRequestRepository.DeleteAsync(designRequest);
        return true;
    }

    public async Task<bool> HasDesignRequestForTaskAsync(int taskId)
    {
        return await _designRequestRepository.HasDesignRequestForTaskAsync(taskId);
    }

    public async Task<DesignRequestDto?> GetDesignRequestByTaskIdAsync(int taskId)
    {
        var designRequest = await _designRequestRepository.GetDesignRequestByTaskIdAsync(taskId);
        return designRequest == null ? null : _mappingService.MapToDesignRequestDto(designRequest);
    }

    public async Task<DesignRequestDto?> AssignDesignRequestAsync(int designRequestId, int assignedToPrsId, string? comment)
    {
        var designRequest = await _designRequestRepository.GetByIdAsync(designRequestId);
        if (designRequest == null)
        {
            return null;
        }

        designRequest.AssignedToPrsId = assignedToPrsId;
        designRequest.UpdatedAt = DateTime.UtcNow;
        designRequest.Status = (int)DesignRequestsStatus.Assigned;
        await _designRequestRepository.UpdateAsync(designRequest);

        // Create a design task for the assigned designer
        if (designRequest.TaskId.HasValue)
        {
            await CreateDesignTaskForAssigneeAsync(designRequest.TaskId.Value, assignedToPrsId, comment);
        }

        return _mappingService.MapToDesignRequestDto(designRequest);
    }

    private async Task<bool> CreateDesignTaskForAssigneeAsync(int originalTaskId, int assignedToPrsId, string? comment)
    {
        try
        {
            // Get the original task to copy metadata
            var originalTask = await _taskService.GetTaskByIdAsync(originalTaskId);
            if (originalTask == null)
            {
                return false;
            }

            // Create the design task DTO with metadata from the original task
            var createTaskDto = new CreateTaskDto
            {
                Name = $"Design Task: {originalTask.Name}",
                Description = $"Design task created from: {originalTask.Description}\n\nAssignment Comment: {comment ?? "No comment provided"}",
                StartDate = DateTime.UtcNow.Date, // Start today
                EndDate = DateTime.UtcNow.Date.AddDays(7), // Default 7 days duration
                TypeId = originalTask.TypeId, // Assuming Design task type exists
                StatusId = TaskStatusEnum.ToDo,
                PriorityId = originalTask.PriorityId,
                DepartmentId = originalTask.DepartmentId,
                TimelineId = originalTask.TimelineId,
                ProjectRequirementId = originalTask.ProjectRequirementId,
                SprintId = originalTask.SprintId,
                EstimatedHours = originalTask.EstimatedHours,
                Progress = 0,
                Notes = $"Created from original task ID: {originalTaskId}",
                MemberIds = new List<int> { assignedToPrsId }
            };

            // Map DTO to entity using the mapping service
            var taskEntity = _mappingService.MapToTask(createTaskDto);

            // Create the task
            var createdTask = await _taskService.CreateTaskAsync(taskEntity);

            // Update task assignments
            if (createTaskDto.MemberIds != null && createTaskDto.MemberIds.Any())
            {
                await _taskService.UpdateTaskAssignmentsAsync(createdTask.Id, createTaskDto.MemberIds);
            }

            return true;
        }
        catch (Exception)
        {
            // Log error but don't fail the assignment process
            return false;
        }
    }
}