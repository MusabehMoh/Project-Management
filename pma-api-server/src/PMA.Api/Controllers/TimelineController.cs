using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimelineController : ApiBaseController
{
    private readonly ITimelineService _timelineService;

    public TimelineController(ITimelineService timelineService)
    {
        _timelineService = timelineService;
    }

    /// <summary>
    /// Get all timelines with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetTimelines(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null)
    {
        try
        {
            var (timelines, totalCount) = await _timelineService.GetTimelinesAsync(page, limit, projectId);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(timelines, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Timeline>>("An error occurred while retrieving timelines", ex.Message);
        }
    }

    /// <summary>
    /// Get timeline by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetTimelineById(int id)
    {
        try
        {
            var timeline = await _timelineService.GetTimelineByIdAsync(id);
            if (timeline == null)
                return NotFound(Error<Timeline>("Timeline not found", null, 404));
            return Success(timeline);
        }
        catch (Exception ex)
        {
            return Error<Timeline>("An error occurred while retrieving the timeline", ex.Message);
        }
    }

    /// <summary>
    /// Get timelines by project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetTimelinesByProject(int projectId)
    {
        try
        {
            var timelines = await _timelineService.GetTimelinesByProjectAsync(projectId);
            return Success(timelines);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Timeline>>("An error occurred while retrieving project timelines", ex.Message);
        }
    }

    /// <summary>
    /// Create a new timeline
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateTimeline([FromBody] Timeline timeline)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var createdTimeline = await _timelineService.CreateTimelineAsync(timeline);
            return CreatedAtAction(nameof(GetTimelineById), new { id = createdTimeline.Id }, createdTimeline);
        }
        catch (Exception ex)
        {
            return Error<Timeline>("An error occurred while creating the timeline", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing timeline
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateTimeline(int id, [FromBody] Timeline timeline)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != timeline.Id)
                return BadRequest(Error<Timeline>("ID mismatch", null, 400));
            var updatedTimeline = await _timelineService.UpdateTimelineAsync(timeline);
            if (updatedTimeline == null)
                return NotFound(Error<Timeline>("Timeline not found", null, 404));
            return Success(updatedTimeline);
        }
        catch (Exception ex)
        {
            return Error<Timeline>("An error occurred while updating the timeline", ex.Message);
        }
    }

    /// <summary>
    /// Delete a timeline
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteTimeline(int id)
    {
        try
        {
            var result = await _timelineService.DeleteTimelineAsync(id);
            if (!result)
                return NotFound(Error<Timeline>("Timeline not found", null, 404));
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<Timeline>("An error occurred while deleting the timeline", ex.Message);
        }
    }
}