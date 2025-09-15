using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SprintsController : ApiBaseController
{
    private readonly ISprintService _sprintService;

    public SprintsController(ISprintService sprintService)
    {
        _sprintService = sprintService;
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
    [ProducesResponseType(typeof(Sprint), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetSprintById(int id)
    {
        try
        {
            var sprint = await _sprintService.GetSprintByIdAsync(id);
            if (sprint == null)
            {
                return Error<Sprint>("Sprint not found");
            }
            return Success(sprint);
        }
        catch (Exception ex)
        {
            return Error<Sprint>("An error occurred while retrieving the sprint", ex.Message);
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
    [ProducesResponseType(typeof(Sprint), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateSprint([FromBody] Sprint sprint)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<Sprint>("Validation failed", string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            }

            var createdSprint = await _sprintService.CreateSprintAsync(sprint);
            var response = new ApiResponse<Sprint>
            {
                Success = true,
                Data = createdSprint,
                Message = "Sprint created successfully"
            };
            return CreatedAtAction(nameof(GetSprintById), new { id = createdSprint.Id }, response);
        }
        catch (Exception ex)
        {
            return Error<Sprint>("An error occurred while creating the sprint", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing sprint
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Sprint), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateSprint(int id, [FromBody] Sprint sprint)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<Sprint>("Validation failed", string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            }

            if (id != sprint.Id)
            {
                return Error<Sprint>("ID mismatch");
            }

            var updatedSprint = await _sprintService.UpdateSprintAsync(sprint);
            if (updatedSprint == null)
            {
                return Error<Sprint>("Sprint not found");
            }
            var response = new ApiResponse<Sprint>
            {
                Success = true,
                Data = updatedSprint,
                Message = "Sprint updated successfully"
            };
            return Ok(response);
        }
        catch (Exception ex)
        {
            return Error<Sprint>("An error occurred while updating the sprint", ex.Message);
        }
    }

    /// <summary>
    /// Delete a sprint
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteSprint(int id)
    {
        try
        {
            var result = await _sprintService.DeleteSprintAsync(id);
            if (!result)
            {
                return Error<object>("Sprint not found");
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while deleting the sprint", ex.Message);
        }
    }
}