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

    public DesignRequestService(
        IDesignRequestRepository designRequestRepository,
        IMappingService mappingService,
        IUserContextAccessor userContextAccessor)
    {
        _designRequestRepository = designRequestRepository;
        _mappingService = mappingService;
        _userContextAccessor = userContextAccessor;
    }

    public async Task<(IEnumerable<DesignRequestDto> DesignRequests, int TotalCount)> GetDesignRequestsAsync(int page, int limit, int? taskId = null, int? assignedToPrsId = null, int? status = null)
    {
        var (designRequests, totalCount) = await _designRequestRepository.GetDesignRequestsAsync(page, limit, taskId, assignedToPrsId, status);
        var designRequestDtos = designRequests.Select(_mappingService.MapToDesignRequestDto);
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