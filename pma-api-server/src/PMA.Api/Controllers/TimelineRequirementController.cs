using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimelineRequirementController : ControllerBase
{
    private readonly ITimelineRequirementService _timelineRequirementService;

    public TimelineRequirementController(ITimelineRequirementService timelineRequirementService)
    {
        _timelineRequirementService = timelineRequirementService;
    }

    /// <summary>
    /// Get all timeline requirements with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetTimelineRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? timelineId = null,
        [FromQuery] int? statusId = null)
    {
        try
        {
            var (timelineRequirements, totalCount) = await _timelineRequirementService.GetTimelineRequirementsAsync(page, limit, timelineId, statusId);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            var response = new ApiResponse<IEnumerable<TimelineRequirement>>
            {
                Success = true,
                Data = timelineRequirements,
                Pagination = pagination
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<TimelineRequirement>>
            {
                Success = false,
                Message = "An error occurred while retrieving timeline requirements",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get timeline requirement by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetTimelineRequirementById(int id)
    {
        try
        {
            var timelineRequirement = await _timelineRequirementService.GetTimelineRequirementByIdAsync(id);
            if (timelineRequirement == null)
            {
                var notFoundResponse = new ApiResponse<TimelineRequirement>
                {
                    Success = false,
                    Message = "Timeline requirement not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<TimelineRequirement>
            {
                Success = true,
                Data = timelineRequirement
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<TimelineRequirement>
            {
                Success = false,
                Message = "An error occurred while retrieving the timeline requirement",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get timeline requirements by timeline
    /// </summary>
    [HttpGet("timeline/{timelineId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetTimelineRequirementsByTimeline(int timelineId)
    {
        try
        {
            var timelineRequirements = await _timelineRequirementService.GetTimelineRequirementsByTimelineAsync(timelineId);
            var response = new ApiResponse<IEnumerable<TimelineRequirement>>
            {
                Success = true,
                Data = timelineRequirements
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<TimelineRequirement>>
            {
                Success = false,
                Message = "An error occurred while retrieving timeline requirements by timeline",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Create a new timeline requirement
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateTimelineRequirement([FromBody] TimelineRequirement timelineRequirement)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<TimelineRequirement>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            var createdTimelineRequirement = await _timelineRequirementService.CreateTimelineRequirementAsync(timelineRequirement);
            var response = new ApiResponse<TimelineRequirement>
            {
                Success = true,
                Data = createdTimelineRequirement,
                Message = "Timeline requirement created successfully"
            };
            
            return CreatedAtAction(nameof(GetTimelineRequirementById), new { id = createdTimelineRequirement.Id }, response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<TimelineRequirement>
            {
                Success = false,
                Message = "An error occurred while creating the timeline requirement",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Update an existing timeline requirement
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateTimelineRequirement(int id, [FromBody] TimelineRequirement timelineRequirement)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<TimelineRequirement>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != timelineRequirement.Id)
            {
                var mismatchResponse = new ApiResponse<TimelineRequirement>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedTimelineRequirement = await _timelineRequirementService.UpdateTimelineRequirementAsync(timelineRequirement);
            if (updatedTimelineRequirement == null)
            {
                var notFoundResponse = new ApiResponse<TimelineRequirement>
                {
                    Success = false,
                    Message = "Timeline requirement not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<TimelineRequirement>
            {
                Success = true,
                Data = updatedTimelineRequirement,
                Message = "Timeline requirement updated successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<TimelineRequirement>
            {
                Success = false,
                Message = "An error occurred while updating the timeline requirement",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Delete a timeline requirement
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteTimelineRequirement(int id)
    {
        try
        {
            var result = await _timelineRequirementService.DeleteTimelineRequirementAsync(id);
            if (!result)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Timeline requirement not found"
                };
                return NotFound(notFoundResponse);
            }
            
            return NoContent();
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the timeline requirement",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }
}