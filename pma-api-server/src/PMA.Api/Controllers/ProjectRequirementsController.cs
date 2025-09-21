using Microsoft.AspNetCore.Mvc;
using PMA.Api.Services;
using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/project-requirements")]
public class ProjectRequirementsController : ApiBaseController
{
    private readonly IProjectRequirementService _projectRequirementService;
    private readonly ICurrentUserService _currentUser;

    public ProjectRequirementsController(IProjectRequirementService projectRequirementService, ICurrentUserService currentUser)
    {
        _projectRequirementService = projectRequirementService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Get all project requirements with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetProjectRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null)
    {
        try
        {
            var (projectRequirements, totalCount) = await _projectRequirementService.GetProjectRequirementsAsync(page, limit, projectId, status, priority);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(projectRequirements, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving project requirements", ex.Message);
        }
    }

    /// <summary>
    /// Get project requirement by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetProjectRequirementById(int id)
    {
        try
        {
            var projectRequirement = await _projectRequirementService.GetProjectRequirementByIdAsync(id);
            if (projectRequirement == null)
                return NotFound(Error<ProjectRequirement>("Project requirement not found", null, 404));
            return Success(projectRequirement);
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirement>("An error occurred while retrieving the project requirement", ex.Message);
        }
    }

    /// <summary>
    /// Get projects assigned to current analyst
    /// </summary>
    [HttpGet("assigned-projects")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetAssignedProjects(
        [FromQuery] int? userId = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? projectId = null)
    {
        try
        {
           
            var (assignedProjects, totalCount) = await _projectRequirementService.GetAssignedProjectsAsync(userId, page, limit, search, projectId);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(assignedProjects, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<AssignedProjectDto>>("An error occurred while retrieving assigned projects", ex.Message);
        }
    }

    /// <summary>
    /// Get project requirements by project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetProjectRequirementsByProject(int projectId)
    {
        try
        {
            var projectRequirements = await _projectRequirementService.GetProjectRequirementsByProjectAsync(projectId);
            var response = new ApiResponse<IEnumerable<ProjectRequirement>>
            {
                Success = true,
                Data = projectRequirements
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<ProjectRequirement>>
            {
                Success = false,
                Message = "An error occurred while retrieving project requirements by project",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get project requirements by project with pagination
    /// </summary>
    [HttpGet("projects/{projectId}/requirements")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetProjectRequirementsByProjectWithPagination(
        int projectId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        try
        {
            var (projectRequirements, totalCount) = await _projectRequirementService.GetProjectRequirementsAsync(page, limit, projectId, null, null);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(projectRequirements, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving project requirements", ex.Message);
        }
    }

    /// <summary>
    /// Create a new project requirement
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateProjectRequirement([FromBody] ProjectRequirement projectRequirement)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var createdProjectRequirement = await _projectRequirementService.CreateProjectRequirementAsync(projectRequirement);
            return CreatedAtAction(nameof(GetProjectRequirementById), new { id = createdProjectRequirement.Id }, createdProjectRequirement);
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirement>("An error occurred while creating the project requirement", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing project requirement
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateProjectRequirement(int id, [FromBody] ProjectRequirement projectRequirement)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != projectRequirement.Id)
                return BadRequest(Error<ProjectRequirement>("ID mismatch", null, 400));
            var updatedProjectRequirement = await _projectRequirementService.UpdateProjectRequirementAsync(projectRequirement);
            if (updatedProjectRequirement == null)
                return NotFound(Error<ProjectRequirement>("Project requirement not found", null, 404));
            return Success(updatedProjectRequirement);
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirement>("An error occurred while updating the project requirement", ex.Message);
        }
    }

    /// <summary>
    /// Delete a project requirement
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteProjectRequirement(int id)
    {
        try
        {
            var result = await _projectRequirementService.DeleteProjectRequirementAsync(id);
            if (!result)
                return NotFound(Error<ProjectRequirement>("Project requirement not found", null, 404));
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirement>("An error occurred while deleting the project requirement", ex.Message);
        }
    }
}