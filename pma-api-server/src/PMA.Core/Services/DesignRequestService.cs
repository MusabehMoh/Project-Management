using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.DTOs.Tasks;
using Task = System.Threading.Tasks.Task;

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
}