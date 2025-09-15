using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ApiBaseController
{
    private readonly IProjectService _projectService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(IProjectService projectService, ILogger<ProjectsController> logger)
    {
        _projectService = projectService;
        _logger = logger;
    }

    /// <summary>
    /// Get all projects with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ProjectDto>), 200)]
    public async Task<IActionResult> GetProjects(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? status = null,
        [FromQuery] string? priority = null)
    {
        try
        {
            var (projects, totalCount) = await _projectService.GetProjectsAsync(page, limit, search, status, priority);

            var projectDtos = projects.Select(p => new ProjectDto
            {
                Id = p.Id,
                ApplicationName = p.ApplicationName,
                ProjectOwner = p.ProjectOwner,
                AlternativeOwner = p.AlternativeOwner,
                OwningUnit = p.OwningUnit,
                ProjectOwnerId = p.ProjectOwnerId,
                AlternativeOwnerId = p.AlternativeOwnerId,
                OwningUnitId = p.OwningUnitId,
                Analysts = p.Analysts,
                AnalystIds = p.AnalystIds,
                StartDate = p.StartDate,
                ExpectedCompletionDate = p.ExpectedCompletionDate,
                Description = p.Description,
                Remarks = p.Remarks,
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Priority = p.Priority,
                Budget = p.Budget,
                Progress = p.Progress
            });

            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
            return Success(projectDtos, pagination);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving projects. Page: {Page}, Limit: {Limit}, Search: {Search}, Status: {Status}, Priority: {Priority}",
                page, limit, search, status, priority);
            return Error<IEnumerable<ProjectDto>>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get project by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> GetProject(int id)
    {
        try
        {
            var project = await _projectService.GetProjectByIdAsync(id);

            if (project == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Project not found"
                });
            }

            var projectDto = new ProjectDto
            {
                Id = project.Id,
                ApplicationName = project.ApplicationName,
                ProjectOwner = project.ProjectOwner,
                AlternativeOwner = project.AlternativeOwner,
                OwningUnit = project.OwningUnit,
                ProjectOwnerId = project.ProjectOwnerId,
                AlternativeOwnerId = project.AlternativeOwnerId,
                OwningUnitId = project.OwningUnitId,
                Analysts = project.Analysts,
                AnalystIds = project.AnalystIds,
                StartDate = project.StartDate,
                ExpectedCompletionDate = project.ExpectedCompletionDate,
                Description = project.Description,
                Remarks = project.Remarks,
                Status = project.Status,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                Priority = project.Priority,
                Budget = project.Budget,
                Progress = project.Progress
            };

            return Ok(new ApiResponse<ProjectDto>
            {
                Success = true,
                Data = projectDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving project by ID. ProjectId: {ProjectId}", id);

            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get project statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    public async Task<IActionResult> GetProjectStats()
    {
        try
        {
            var stats = await _projectService.GetProjectStatsAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = stats
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Search projects
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProjectDto>>), 200)]
    public async Task<IActionResult> SearchProjects(
        [FromQuery] string q,
        [FromQuery] int? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        try
        {
            if (string.IsNullOrEmpty(q))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Search query is required"
                });
            }

            var projects = await _projectService.SearchProjectsAsync(q, status, priority, page, limit);

            var projectDtos = projects.Select(p => new ProjectDto
            {
                Id = p.Id,
                ApplicationName = p.ApplicationName,
                ProjectOwner = p.ProjectOwner,
                AlternativeOwner = p.AlternativeOwner,
                OwningUnit = p.OwningUnit,
                ProjectOwnerId = p.ProjectOwnerId,
                AlternativeOwnerId = p.AlternativeOwnerId,
                OwningUnitId = p.OwningUnitId,
                Analysts = p.Analysts,
                AnalystIds = p.AnalystIds,
                StartDate = p.StartDate,
                ExpectedCompletionDate = p.ExpectedCompletionDate,
                Description = p.Description,
                Remarks = p.Remarks,
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Priority = p.Priority,
                Budget = p.Budget,
                Progress = p.Progress
            });

            return Ok(new ApiResponse<IEnumerable<ProjectDto>>
            {
                Success = true,
                Data = projectDtos
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Create a new project
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 201)]
    public async Task<IActionResult> CreateProject([FromBody] Project project)
    {
        try
        {
            var createdProject = await _projectService.CreateProjectAsync(project);

            var projectDto = new ProjectDto
            {
                Id = createdProject.Id,
                ApplicationName = createdProject.ApplicationName,
                ProjectOwner = createdProject.ProjectOwner,
                AlternativeOwner = createdProject.AlternativeOwner,
                OwningUnit = createdProject.OwningUnit,
                ProjectOwnerId = createdProject.ProjectOwnerId,
                AlternativeOwnerId = createdProject.AlternativeOwnerId,
                OwningUnitId = createdProject.OwningUnitId,
                Analysts = createdProject.Analysts,
                AnalystIds = createdProject.AnalystIds,
                StartDate = createdProject.StartDate,
                ExpectedCompletionDate = createdProject.ExpectedCompletionDate,
                Description = createdProject.Description,
                Remarks = createdProject.Remarks,
                Status = createdProject.Status,
                CreatedAt = createdProject.CreatedAt,
                UpdatedAt = createdProject.UpdatedAt,
                Priority = createdProject.Priority,
                Budget = createdProject.Budget,
                Progress = createdProject.Progress
            };

            return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, new ApiResponse<ProjectDto>
            {
                Success = true,
                Data = projectDto
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Update an existing project
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 204)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] Project project)
    {
        try
        {
            var existingProject = await _projectService.GetProjectByIdAsync(id);
            if (existingProject == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Project not found"
                });
            }

            project.Id = id;
            await _projectService.UpdateProjectAsync(project);

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }

    /// <summary>
    /// Delete a project
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 204)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> DeleteProject(int id)
    {
        try
        {
            var existingProject = await _projectService.GetProjectByIdAsync(id);
            if (existingProject == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Project not found"
                });
            }

            await _projectService.DeleteProjectAsync(id);

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Error = ex.Message
            });
        }
    }
}


