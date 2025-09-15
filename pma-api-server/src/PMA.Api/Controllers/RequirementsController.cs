using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequirementsController : ApiBaseController
{
    private readonly IRequirementService _requirementService;

    public RequirementsController(IRequirementService requirementService)
    {
        _requirementService = requirementService;
    }

    /// <summary>
    /// Get all requirements with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null)
    {
        try
        {
            var (requirements, totalCount) = await _requirementService.GetRequirementsAsync(page, limit, projectId, status, priority);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(requirements, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Requirement>>("An error occurred while retrieving requirements", ex.Message);
        }
    }

    /// <summary>
    /// Get requirement by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Requirement), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetRequirementById(int id)
    {
        try
        {
            var requirement = await _requirementService.GetRequirementByIdAsync(id);
            if (requirement == null)
                return NotFound(Error<Requirement>("Requirement not found", null, 404));
            return Success(requirement);
        }
        catch (Exception ex)
        {
            return Error<Requirement>("An error occurred while retrieving the requirement", ex.Message);
        }
    }

    /// <summary>
    /// Get requirements by project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(typeof(IEnumerable<Requirement>), 200)]
    public async Task<IActionResult> GetRequirementsByProject(int projectId)
    {
        try
        {
            var requirements = await _requirementService.GetRequirementsByProjectAsync(projectId);
            return Success(requirements);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Requirement>>("An error occurred while retrieving project requirements", ex.Message);
        }
    }

    /// <summary>
    /// Create a new requirement
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Requirement), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateRequirement([FromBody] Requirement requirement)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var createdRequirement = await _requirementService.CreateRequirementAsync(requirement);
            return CreatedAtAction(nameof(GetRequirementById), new { id = createdRequirement.Id }, createdRequirement);
        }
        catch (Exception ex)
        {
            return Error<Requirement>("An error occurred while creating the requirement", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing requirement
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Requirement), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateRequirement(int id, [FromBody] Requirement requirement)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != requirement.Id)
                return BadRequest(Error<Requirement>("ID mismatch", null, 400));
            var updatedRequirement = await _requirementService.UpdateRequirementAsync(requirement);
            if (updatedRequirement == null)
                return NotFound(Error<Requirement>("Requirement not found", null, 404));
            return Success(updatedRequirement);
        }
        catch (Exception ex)
        {
            return Error<Requirement>("An error occurred while updating the requirement", ex.Message);
        }
    }

    /// <summary>
    /// Delete a requirement
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteRequirement(int id)
    {
        try
        {
            var result = await _requirementService.DeleteRequirementAsync(id);
            if (!result)
                return NotFound(Error<Requirement>("Requirement not found", null, 404));
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<Requirement>("An error occurred while deleting the requirement", ex.Message);
        }
    }
}