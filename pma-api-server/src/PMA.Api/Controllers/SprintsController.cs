using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Services;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SprintsController : ApiBaseController
{
    private readonly ISprintService _sprintService;
    private readonly IMappingService _mappingService;

    public SprintsController(ISprintService sprintService, IMappingService mappingService)
    {
        _sprintService = sprintService;
        _mappingService = mappingService;
    }

    /// <summary>
    /// Get all sprints with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetSprints(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] int? status = null)
    {
        try
        {
            var (sprints, totalCount) = await _sprintService.GetSprintsAsync(page, limit, projectId, status);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(sprints, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Sprint>>("An error occurred while retrieving sprints", ex.Message);
        }
    }

    /// <summary>
    /// Get sprint by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<SprintDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> GetSprintById(int id)
    {
        try
        {
            var sprint = await _sprintService.GetSprintByIdAsync(id);
            if (sprint == null)
            {
                return Error<object>("Sprint not found", status: 404);
            }

            var sprintDto = _mappingService.MapToSprintDto(sprint);
            return Success(sprintDto, message: "Sprint retrieved successfully");
        }
        catch (Exception ex)
        {
            return Error<SprintDto>("An error occurred while retrieving the sprint", ex.Message);
        }
    }

    /// <summary>
    /// Get sprints by project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(typeof(IEnumerable<Sprint>), 200)]
    public async Task<IActionResult> GetSprintsByProject(int projectId)
    {
        try
        {
            var sprints = await _sprintService.GetSprintsByProjectAsync(projectId);
            return Success(sprints);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Sprint>>("An error occurred while retrieving project sprints", ex.Message);
        }
    }

    /// <summary>
    /// Create a new sprint
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<SprintDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> CreateSprint([FromBody] CreateSprintDto createSprintDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Map DTO to entity
            var sprint = _mappingService.MapToSprint(createSprintDto);

            // Create the sprint
            var createdSprint = await _sprintService.CreateSprintAsync(sprint);

            // Map back to DTO for response
            var sprintDto = _mappingService.MapToSprintDto(createdSprint);

            return Created(sprintDto, nameof(GetSprintById), new { id = createdSprint.Id }, "Sprint created successfully");
        }
        catch (Exception ex)
        {
            return Error<SprintDto>("An error occurred while creating the sprint", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing sprint
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<SprintDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> UpdateSprint(int id, [FromBody] UpdateSprintDto updateSprintDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Get existing sprint
            var existingSprint = await _sprintService.GetSprintByIdAsync(id);
            if (existingSprint == null)
            {
                return Error<object>("Sprint not found", status: 404);
            }

            // Update the sprint using the mapping service
            _mappingService.UpdateSprintFromDto(existingSprint, updateSprintDto);

            // Update the sprint
            var updatedSprint = await _sprintService.UpdateSprintAsync(existingSprint);

            // Map back to DTO for response
            var sprintDto = _mappingService.MapToSprintDto(updatedSprint);

            return Success(sprintDto, message: "Sprint updated successfully");
        }
        catch (Exception ex)
        {
            return Error<SprintDto>("An error occurred while updating the sprint", ex.Message);
        }
    }

    /// <summary>
    /// Delete a sprint
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 204)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> DeleteSprint(int id)
    {
        try
        {
            // Check if sprint exists
            var existingSprint = await _sprintService.GetSprintByIdAsync(id);
            if (existingSprint == null)
            {
                return Error<object>("Sprint not found", status: 404);
            }

            var result = await _sprintService.DeleteSprintAsync(id);
            if (!result)
            {
                return Error<object>("Failed to delete sprint", status: 500);
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while deleting the sprint", ex.Message);
        }
    }
}