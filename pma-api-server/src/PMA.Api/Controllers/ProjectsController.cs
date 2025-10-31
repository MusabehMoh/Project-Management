using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.Services;
using PMA.Api.Services;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ApiBaseController
{
    private readonly IProjectService _projectService;
    private readonly ILogger<ProjectsController> _logger;
    private readonly IMapper _mapper;
    private readonly IMappingService _mappingService;
    private readonly IHubContext<PMA.Api.Hubs.NotificationHub> _hubContext;
    private readonly IUserContextAccessor _userContextAccessor;
    public ProjectsController(IProjectService projectService, ILogger<ProjectsController> logger, IMapper mapper, IMappingService mappingService, IHubContext<PMA.Api.Hubs.NotificationHub> hubContext, IUserContextAccessor userContextAccessor)
    {
        _projectService = projectService;
        _logger = logger;
        _mapper = mapper;
        _mappingService = mappingService;
        _hubContext = hubContext;
        _userContextAccessor = userContextAccessor;
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

            var projectDtos = projects.Select(p => _mappingService.MapToProjectDto(p));
        

            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
            
            return Success(projectDtos, pagination, "Projects retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving projects. Page: {Page}, Limit: {Limit}, Search: {Search}, Status: {Status}, Priority: {Priority}. StackTrace: {StackTrace}",
                page, limit, search, status, priority, ex.StackTrace);
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
                return Error<object>("Project not found", status: 404);
            }

            var projectDto = _mappingService.MapToProjectDto(project);

            return Success(projectDto, message: "Project retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving project by ID. ProjectId: {ProjectId}", id);

            return Error<object>("Internal server error", ex.Message);
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

            return Success(stats, message: "Project statistics retrieved successfully");
        }
        catch (Exception ex)
        {
            return Error<object>("Internal server error", ex.Message);
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
                return Error<object>("Search query is required", status: 400);
            }

            var projects = await _projectService.SearchProjectsAsync(q, status, priority, page, limit);

            var projectDtos = projects.Select(p => _mappingService.MapToProjectDto(p));

            return Success(projectDtos, message: "Projects search completed successfully");
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
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto createProjectDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }       
            // Map DTO to entity using the mapping service
            var project = await _mappingService.MapToProjectAsync(createProjectDto);
            
            // Create ProjectAnalyst entities if analysts are specified
            if (createProjectDto.Analysts != null && createProjectDto.Analysts.Length > 0)
            {
                _mappingService.CreateProjectAnalysts(project, createProjectDto.Analysts);
            }
            
            // Populate navigation properties (names from IDs)
            await _mappingService.PopulateProjectNavigationPropertiesAsync(project);

            // Create the project
            var createdProject = await _projectService.CreateProjectAsync(project);
             ;

            return Created(new ProjectDto(), nameof(GetProject), new { id = createdProject.Id }, "Project created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating project. ApplicationName: {ApplicationName}", createProjectDto.ApplicationName);
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
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectDto updateProjectDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            var existingProject = await _projectService.GetProjectByIdAsync(id);
            if (existingProject == null)
            {
                return Error<object>("Project not found", status: 404);
            }

            // Update the project using the mapping service
            await _mappingService.UpdateProjectFromDtoAsync(existingProject, updateProjectDto);

            // Update the project
            await _projectService.UpdateProjectAsync(existingProject);

            // Get the updated project and map to DTO
            var updatedProject = await _projectService.GetProjectByIdAsync(id);
            if (updatedProject == null)
            {
                return Error<object>("Project not found after update", status: 404);
            }
            var projectDto = _mappingService.MapToProjectDto(updatedProject);

            return Success(projectDto, message: "Project updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating project. ProjectId: {ProjectId}", id);
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
                return Error<object>("Project not found", status: 404);
            }

            await _projectService.DeleteProjectAsync(id);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot delete project due to dependencies. ProjectId: {ProjectId}", id);
            return Error<object>("Cannot delete project", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting project. ProjectId: {ProjectId}", id);
            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Send project for review
    /// </summary>
    [HttpPost("{id}/send")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> SendProject(int id)
    {
        try
        {
            var project = await _projectService.SendProjectAsync(id);

            var projectDto = _mappingService.MapToProjectDto(project);

            return Success(projectDto, message: "Project sent for review successfully");
        }
        catch (KeyNotFoundException)
        {
            return Error<object>("Project not found", status: 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while sending project for review. ProjectId: {ProjectId}", id);

            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get all projects with their timelines, sprints, and tasks
    /// </summary>
    [HttpGet("with-timelines")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProjectWithTimelinesDto>>), 200)]
    public async Task<IActionResult> GetProjectsWithTimelines()
    {
        try
        {
            var projects = await _projectService.GetProjectsWithTimelinesAsync();

            var projectWithTimelinesDtos = projects.Select(p => _mappingService.MapToProjectWithTimelinesDto(p));

            return Success(projectWithTimelinesDtos, message: "Projects with timelines retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving projects with timelines. StackTrace: {StackTrace}", ex.StackTrace);
            return Error<IEnumerable<ProjectWithTimelinesDto>>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get timelines for a specific project
    /// </summary>
    [HttpGet("{projectId}/timelines")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TimelineWithSprintsDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> GetProjectTimelines(int projectId)
    {
        try
        {
            var projectWithTimelines = await _projectService.GetProjectWithTimelinesAsync(projectId);

            if (projectWithTimelines == null)
            {
                return Error<object>("Project not found", status: 404);
            }

            var timelinesDtos = projectWithTimelines.Timelines?.Select(t => _mappingService.MapToTimelineWithSprintsDto(t)) ?? new List<TimelineWithSprintsDto>();

            return Success(timelinesDtos, message: "Project timelines retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving project timelines. ProjectId: {ProjectId}. StackTrace: {StackTrace}", projectId, ex.StackTrace);
            return Error<IEnumerable<TimelineWithSprintsDto>>("Internal server error", ex.Message);
        }
    }
}


