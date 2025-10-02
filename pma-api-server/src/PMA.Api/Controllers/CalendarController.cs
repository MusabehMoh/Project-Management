using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CalendarController : ApiBaseController
{
    private readonly ICalendarEventService _calendarEventService;

    public CalendarController(ICalendarEventService calendarEventService)
    {
        _calendarEventService = calendarEventService;
    }

    /// <summary>
    /// Get all calendar events with pagination and filtering
    /// </summary>
    [HttpGet]
    [HttpGet("events")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetCalendarEvents(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] int? createdBy = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var (calendarEvents, totalCount) = await _calendarEventService.GetCalendarEventsAsync(page, limit, projectId, createdBy, startDate, endDate);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(calendarEvents, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<CalendarEvent>>("An error occurred while retrieving calendar events", ex.Message);
        }
    }

    /// <summary>
    /// Get calendar event by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCalendarEventById(int id)
    {
        try
        {
            var calendarEvent = await _calendarEventService.GetCalendarEventByIdAsync(id);
            if (calendarEvent == null)
            {
                var notFoundResponse = new ApiResponse<CalendarEvent>
                {
                    Success = false,
                    Message = "Calendar event not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<CalendarEvent>
            {
                Success = true,
                Data = calendarEvent
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<CalendarEvent>
            {
                Success = false,
                Message = "An error occurred while retrieving the calendar event",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get calendar events by project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetCalendarEventsByProject(int projectId)
    {
        try
        {
            var calendarEvents = await _calendarEventService.GetCalendarEventsByProjectAsync(projectId);
            var response = new ApiResponse<IEnumerable<CalendarEvent>>
            {
                Success = true,
                Data = calendarEvents
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<CalendarEvent>>
            {
                Success = false,
                Message = "An error occurred while retrieving project calendar events",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get calendar events by creator
    /// </summary>
    [HttpGet("creator/{creatorId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetCalendarEventsByCreator(int creatorId)
    {
        try
        {
            var calendarEvents = await _calendarEventService.GetCalendarEventsByCreatorAsync(creatorId);
            var response = new ApiResponse<IEnumerable<CalendarEvent>>
            {
                Success = true,
                Data = calendarEvents
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<CalendarEvent>>
            {
                Success = false,
                Message = "An error occurred while retrieving creator calendar events",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Create a new calendar event
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateCalendarEvent([FromBody] CalendarEvent calendarEvent)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<CalendarEvent>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            var createdCalendarEvent = await _calendarEventService.CreateCalendarEventAsync(calendarEvent);
            var response = new ApiResponse<CalendarEvent>
            {
                Success = true,
                Data = createdCalendarEvent,
                Message = "Calendar event created successfully"
            };
            
            return CreatedAtAction(nameof(GetCalendarEventById), new { id = createdCalendarEvent.Id }, response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<CalendarEvent>
            {
                Success = false,
                Message = "An error occurred while creating the calendar event",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Update an existing calendar event
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateCalendarEvent(int id, [FromBody] CalendarEvent calendarEvent)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<CalendarEvent>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != calendarEvent.Id)
            {
                var mismatchResponse = new ApiResponse<CalendarEvent>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedCalendarEvent = await _calendarEventService.UpdateCalendarEventAsync(calendarEvent);
            if (updatedCalendarEvent == null)
            {
                var notFoundResponse = new ApiResponse<CalendarEvent>
                {
                    Success = false,
                    Message = "Calendar event not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<CalendarEvent>
            {
                Success = true,
                Data = updatedCalendarEvent,
                Message = "Calendar event updated successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<CalendarEvent>
            {
                Success = false,
                Message = "An error occurred while updating the calendar event",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Delete a calendar event
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteCalendarEvent(int id)
    {
        try
        {
            var result = await _calendarEventService.DeleteCalendarEventAsync(id);
            if (!result)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Calendar event not found"
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
                Message = "An error occurred while deleting the calendar event",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get calendar statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetCalendarStats()
    {
        try
        {
            var stats = await _calendarEventService.GetCalendarStatsAsync();
            var response = new ApiResponse<object>
            {
                Success = true,
                Data = stats,
                Message = "Calendar statistics retrieved successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while retrieving calendar statistics",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }
}