using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Services;
using AutoMapper;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimelinesController : ApiBaseController
{
    private readonly ITimelineService _timelineService;
    private readonly ILogger<TimelinesController> _logger;
    private readonly IMapper _mapper;
    private readonly IMappingService _mappingService;

    public TimelinesController(ITimelineService timelineService, ILogger<TimelinesController> logger, IMapper mapper, IMappingService mappingService)
    {
        _timelineService = timelineService;
        _logger = logger;
        _mapper = mapper;
        _mappingService = mappingService;
    }

    /// <summary>
    /// Get all timelines with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<TimelineDto>), 200)]
    public async Task<IActionResult> GetTimelines(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null)
    {
        try
        {
            var (timelines, totalCount) = await _timelineService.GetTimelinesAsync(page, limit, projectId);

            var timelineDtos = timelines.Select(t => _mappingService.MapToTimelineDto(t));

            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
            return Success(timelineDtos, pagination, "Timelines retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving timelines. Page: {Page}, Limit: {Limit}, ProjectId: {ProjectId}. StackTrace: {StackTrace}",
                page, limit, projectId, ex.StackTrace);
            return Error<IEnumerable<TimelineDto>>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get timeline by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TimelineDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> GetTimelineById(int id)
    {
        try
        {
            var timeline = await _timelineService.GetTimelineByIdAsync(id);

            if (timeline == null)
            {
                return Error<object>("Timeline not found", status: 404);
            }

            var timelineDto = _mappingService.MapToTimelineDto(timeline);

            return Success(timelineDto, message: "Timeline retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving timeline by ID. TimelineId: {TimelineId}", id);

            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get timelines by project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TimelineDto>>), 200)]
    public async Task<IActionResult> GetTimelinesByProject(int projectId)
    {
        try
        {
            var timelines = await _timelineService.GetTimelinesByProjectAsync(projectId);

            var timelineDtos = timelines.Select(t => _mappingService.MapToTimelineDto(t));

            return Success(timelineDtos, message: "Project timelines retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving timelines by project. ProjectId: {ProjectId}", projectId);

            return Error<IEnumerable<TimelineDto>>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Create a new timeline
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TimelineDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> CreateTimeline([FromBody] CreateTimelineDto createTimelineDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Map DTO to entity
            var timeline = _mappingService.MapToTimeline(createTimelineDto);

            // Create the timeline
            var createdTimeline = await _timelineService.CreateTimelineAsync(timeline);

            // Map back to DTO for response
            var timelineDto = _mappingService.MapToTimelineDto(createdTimeline);

            return Created(timelineDto, nameof(GetTimelineById), new { id = createdTimeline.Id }, "Timeline created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating timeline. Name: {Name}", createTimelineDto.Name);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Update an existing timeline
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TimelineDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> UpdateTimeline(int id, [FromBody] UpdateTimelineDto updateTimelineDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            var existingTimeline = await _timelineService.GetTimelineByIdAsync(id);
            if (existingTimeline == null)
            {
                return Error<object>("Timeline not found", status: 404);
            }

            // Update the timeline using the mapping service
            _mappingService.UpdateTimelineFromDto(existingTimeline, updateTimelineDto);

            // Update the timeline
            await _timelineService.UpdateTimelineAsync(existingTimeline);

            // Get the updated timeline and map to DTO
            var updatedTimeline = await _timelineService.GetTimelineByIdAsync(id);
            if (updatedTimeline == null)
            {
                return Error<object>("Timeline not found after update", status: 404);
            }
            var timelineDto = _mappingService.MapToTimelineDto(updatedTimeline);

            return Success(timelineDto, message: "Timeline updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating timeline. TimelineId: {TimelineId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Delete a timeline
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 204)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> DeleteTimeline(int id)
    {
        try
        {
            var existingTimeline = await _timelineService.GetTimelineByIdAsync(id);
            if (existingTimeline == null)
            {
                return Error<object>("Timeline not found", status: 404);
            }

            await _timelineService.DeleteTimelineAsync(id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting timeline. TimelineId: {TimelineId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }
}