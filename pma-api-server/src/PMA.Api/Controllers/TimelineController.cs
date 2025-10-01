using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Services;
using AutoMapper;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimelinesController : ApiBaseController
{
    private readonly ITimelineService _timelineService;
    private readonly ISprintService _sprintService;
    private readonly ITaskService _taskService;
    private readonly ILogger<TimelinesController> _logger;
    private readonly IMapper _mapper;
    private readonly IMappingService _mappingService;

    public TimelinesController(ITimelineService timelineService, ISprintService sprintService, ITaskService taskService, ILogger<TimelinesController> logger, IMapper mapper, IMappingService mappingService)
    {
        _timelineService = timelineService;
        _sprintService = sprintService;
        _taskService = taskService;
        _logger = logger;
        _mapper = mapper;
        _mappingService = mappingService;
    }

    /// <summary>
    /// Get all timelines with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<TimelineWithSprintsDto>), 200)]
    public async Task<IActionResult> GetTimelines(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null)
    {
        try
        {
            var (timelines, totalCount) = await _timelineService.GetTimelinesAsync(page, limit, projectId);

            var timelineDtos = timelines.Select(t => _mappingService.MapToTimelineWithSprintsDto(t));

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
    [ProducesResponseType(typeof(ApiResponse<TimelineWithSprintsDto>), 200)]
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

            var timelineDto = _mappingService.MapToTimelineWithSprintsDto(timeline);

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
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TimelineWithSprintsDto>>), 200)]
    public async Task<IActionResult> GetTimelinesByProject(int projectId)
    {
        try
        {
            var timelines = await _timelineService.GetTimelinesByProjectAsync(projectId);

            var timelineDtos = timelines.Select(t => _mappingService.MapToTimelineWithSprintsDto(t));

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
    [ProducesResponseType(typeof(ApiResponse<TimelineWithSprintsDto>), 201)]
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
            var timelineDto = _mappingService.MapToTimelineWithSprintsDto(createdTimeline);

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
    [ProducesResponseType(typeof(ApiResponse<TimelineWithSprintsDto>), 200)]
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
            var timelineDto = _mappingService.MapToTimelineWithSprintsDto(updatedTimeline);

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

    /// <summary>
    /// Get sprints by timeline ID
    /// </summary>
    [HttpGet("{timelineId}/sprints")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<Sprint>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> GetSprintsByTimeline(int timelineId)
    {
        try
        {
            // First check if the timeline exists
            var timeline = await _timelineService.GetTimelineByIdAsync(timelineId);
            if (timeline == null)
            {
                return Error<object>("Timeline not found", status: 404);
            }

            // Get sprints by project ID (assuming sprints are project-based)
            var sprints = await _sprintService.GetSprintsByProjectAsync(timeline.ProjectId);
            
            // Filter sprints by timeline ID
            var timelineSprints = sprints.Where(s => s.TimelineId == timelineId);

            return Success(timelineSprints, message: "Timeline sprints retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving sprints by timeline. TimelineId: {TimelineId}", timelineId);

            return Error<IEnumerable<Sprint>>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Create a new sprint for a timeline
    /// </summary>
    [HttpPost("{timelineId}/sprints")]
    [ProducesResponseType(typeof(ApiResponse<SprintDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> CreateSprintForTimeline(int timelineId, [FromBody] CreateSprintDto createSprintDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // First check if the timeline exists
            var timeline = await _timelineService.GetTimelineByIdAsync(timelineId);
            if (timeline == null)
            {
                return Error<object>("Timeline not found", status: 404);
            }

            // Map DTO to entity and set the timeline ID
            var sprint = _mappingService.MapToSprint(createSprintDto);
            sprint.TimelineId = timelineId;
            sprint.ProjectId = timeline.ProjectId; // Set project ID from timeline

            // Create the sprint
            var createdSprint = await _sprintService.CreateSprintAsync(sprint);

            // Map back to DTO for response
            var sprintDto = _mappingService.MapToSprintDto(createdSprint);

            return Created(sprintDto, nameof(GetSprintsByTimeline), new { timelineId = timelineId }, "Sprint created successfully for timeline");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating sprint for timeline. TimelineId: {TimelineId}, SprintName: {SprintName}", timelineId, createSprintDto.Name);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get tasks by sprint ID
    /// </summary>
    [HttpGet("sprints/{sprintId}/tasks")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TaskEntity>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> GetTasksBySprint(int sprintId)
    {
        try
        {
            // First check if the sprint exists
            var sprint = await _sprintService.GetSprintByIdAsync(sprintId);
            if (sprint == null)
            {
                return Error<object>("Sprint not found", status: 404);
            }

            // Get tasks by sprint ID
            var tasks = await _taskService.GetTasksBySprintAsync(sprintId);

            return Success(tasks, message: "Sprint tasks retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving tasks by sprint. SprintId: {SprintId}", sprintId);

            return Error<IEnumerable<TaskEntity>>("Internal server error", ex.Message);
        }
    }
}