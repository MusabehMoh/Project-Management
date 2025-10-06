using Microsoft.AspNetCore.Mvc;
using PMA.Api.Services;
using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.Enums;
using Microsoft.Extensions.Options;
using PMA.Api.Config;
using PMA.Core.Services;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;
namespace PMA.Api.Controllers;

[ApiController]
[Route("api/project-requirements")]
public class ProjectRequirementsController : ApiBaseController
{
    private readonly IProjectRequirementService _projectRequirementService;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<ProjectRequirementsController> _logger;
    private readonly AttachmentSettings _attachmentSettings;
    private readonly IMappingService _mappingService; 
    private readonly IRequirementTaskManagementService _requirementTaskManagementService;

    public ProjectRequirementsController(
        IProjectRequirementService projectRequirementService, 
        ICurrentUserService currentUser,
        ILogger<ProjectRequirementsController> logger,
        IOptions<AttachmentSettings> attachmentSettings,
        IMappingService mappingService,
        IRequirementTaskManagementService requirementTaskManagementService)
    {
        _projectRequirementService = projectRequirementService;
        _currentUser = currentUser;
        _logger = logger;
        _attachmentSettings = attachmentSettings.Value;
        _mappingService = mappingService;
        _requirementTaskManagementService = requirementTaskManagementService;
    }

    #region Private Helpers

    /// <summary>
    /// Validates an uploaded attachment file for size and extension constraints.
    /// </summary>
    private (bool IsValid, string? Error) ValidateAttachment(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return (false, "No file uploaded");
        if (file.Length > _attachmentSettings.MaxFileSize)
            return (false, $"File size exceeds {_attachmentSettings.MaxFileSize / (1024 * 1024)}MB limit");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_attachmentSettings.AllowedExtensions.Contains(ext))
            return (false, "File type not allowed");
        return (true, null);
    }

    /// <summary>
    /// Consolidated model state validation returning a formatted error list.
    /// </summary>
    private IActionResult? ValidateModelState()
    {
        if (ModelState.IsValid) return null;
        var errors = string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
        return Error<object>("Validation failed", errors, 400);
    }

    #endregion

    /// <summary>
    /// Get all project requirements with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ProjectRequirement>), 200)]
    public async Task<IActionResult> GetProjectRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] int? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var (projectRequirements, totalCount) = await _projectRequirementService
                .GetProjectRequirementsAsync(page, limit, projectId, status, priority, search);
            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
            return Success(projectRequirements, pagination, "Project requirements retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving project requirements. Page: {Page}, Limit: {Limit}, ProjectId: {ProjectId}, Status: {Status}, Priority: {Priority}, Search: {Search}", 
                page, limit, projectId, status, priority, search);
            return Error<IEnumerable<ProjectRequirement>>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get project requirement by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ProjectRequirement>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> GetProjectRequirementById(int id)
    {
        try
        {
            var projectRequirement = await _projectRequirementService.GetProjectRequirementByIdAsync(id);
            if (projectRequirement == null)
            {
                _logger.LogWarning("Project requirement with ID {RequirementId} not found", id);
                return Error<object>("Project requirement not found", status: 404);
            }
            return Success(projectRequirement, message: "Project requirement retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving project requirement. RequirementId: {RequirementId}", id);
            return Error<object>("Internal server error", ex.Message, 500);
        }
    }

    /// <summary>
    /// Get draft/pending project requirements for PendingRequirements component
    /// </summary>
    [HttpGet("draft-requirements")]
    [ProducesResponseType(typeof(PaginatedResponse<ProjectRequirement>), 200)]
    public async Task<IActionResult> GetDraftRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        try
        {
            // Get requirements with Draft or Pending status
            var (draftRequirements, totalCount) = await _projectRequirementService
                .GetProjectRequirementsAsync(page, limit, null, null, null, null);
            
            // Filter for Draft and Pending status
            var filteredRequirements = draftRequirements
                .Where(r => r.Status == RequirementStatusEnum.New || r.Status == RequirementStatusEnum.ManagerReview)
                .ToList();
            
            var actualTotal = filteredRequirements.Count;
            var pagination = new PaginationInfo(page, limit, actualTotal, (int)Math.Ceiling((double)actualTotal / limit));
            
            return Success(filteredRequirements, pagination, "Draft requirements retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving draft requirements. Page: {Page}, Limit: {Limit}", page, limit);
            return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving draft requirements", ex.Message);
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
            var (assignedProjects, totalCount) = await _projectRequirementService
                .GetAssignedProjectsAsync(userId, page, limit, search, projectId);
            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
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
            return Success(projectRequirements, message: "Project requirements retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving project requirements by project. ProjectId: {ProjectId}", projectId);
            return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving project requirements by project", ex.Message, 500);
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
            var (projectRequirements, totalCount) = await _projectRequirementService
                .GetProjectRequirementsAsync(page, limit, projectId, null, null);
            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
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
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> CreateProjectRequirement([FromBody] CreateProjectRequirementDto createDto)
    {
        try
        {
            var invalid = ValidateModelState();
            if (invalid != null) return invalid;

            var projectRequirement = _mappingService.MapToProjectRequirement(createDto);
            var createdProjectRequirement = await _projectRequirementService
                .CreateProjectRequirementAsync(projectRequirement);
            return Success(createdProjectRequirement, message: "Project requirement created successfully");
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirement>("An error occurred while creating the project requirement", ex.Message);
        }
    }

    /// <summary>
    /// Create a new project requirement for a specific project
    /// </summary>
    [HttpPost("projects/{projectId}/requirements")]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateProjectRequirementForProject(int projectId, [FromBody] CreateProjectRequirementDto createDto)
    {
        try
        {
            var invalid = ValidateModelState();
            if (invalid != null) return invalid;

            // Ensure the projectId from route overrides body
            createDto.ProjectId = projectId;
            var projectRequirement = _mappingService.MapToProjectRequirement(createDto);
            var createdProjectRequirement = await _projectRequirementService
                .CreateProjectRequirementAsync(projectRequirement);
            return Success(createdProjectRequirement, message: "Project requirement created successfully");
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
    public async Task<IActionResult> UpdateProjectRequirement(int id, [FromBody] CreateProjectRequirementDto updateDto)
    {
        try
        {
            var invalid = ValidateModelState();
            if (invalid != null) return invalid;

            var existingRequirement = await _projectRequirementService
                .GetProjectRequirementByIdAsync(id);
            if (existingRequirement == null)
                return Error<ProjectRequirement>("Project requirement not found", null, 404);

            existingRequirement = _mappingService.MapToProjectRequirement(updateDto, existingRequirement);
            var updatedProjectRequirement = await _projectRequirementService
                .UpdateProjectRequirementAsync(existingRequirement);
            return Success(updatedProjectRequirement);
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirement>("An error occurred while updating the project requirement", ex.Message);
        }
    }

    /// <summary>
    /// Update project requirement status
    /// </summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateProjectRequirementStatus(int id, [FromBody] UpdateRequirementStatusDto statusDto)
    {
        try
        {
            var invalid = ValidateModelState();
            if (invalid != null) return invalid;

            var existingRequirement = await _projectRequirementService
                .GetProjectRequirementByIdAsync(id);
            if (existingRequirement == null)
                return Error<ProjectRequirement>("Project requirement not found", null, 404);

            existingRequirement.Status = statusDto.Status;
            existingRequirement.UpdatedAt = DateTime.UtcNow;

            var updatedProjectRequirement = await _projectRequirementService
                .UpdateProjectRequirementAsync(existingRequirement);
            return Success(updatedProjectRequirement);
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirement>("An error occurred while updating the project requirement status", ex.Message);
        }
    }

    /// <summary>
    /// Delete a project requirement
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 204)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> DeleteProjectRequirement(int id)
    {
        try
        {
            _logger.LogInformation("DELETE request received for project requirement with ID: {RequirementId}", id);
            var result = await _projectRequirementService.DeleteProjectRequirementAsync(id);
            if (!result)
            {
                _logger.LogWarning("Project requirement with ID {RequirementId} not found", id);
                return Error<object>("Project requirement not found", status: 404);
            }
            _logger.LogInformation("Project requirement with ID {RequirementId} deleted successfully", id);
          return NoContent();  
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting project requirement. RequirementId: {RequirementId}", id);
            return Error<object>("Internal server error", ex.Message, 500);
        }
    }

    /// <summary>
    /// Get project requirement statistics for a specific project
    /// </summary>
    [HttpGet("projects/{projectId}/stats")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetProjectRequirementStats(int projectId)
    {
        try
        {
            var stats = await _projectRequirementService.GetProjectRequirementStatsAsync(projectId);
            return Success(stats);
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirementStatsDto>("An error occurred while retrieving project requirement statistics", ex.Message);
        }
    }

    /// <summary>
    /// Get development requirements (requirements ready for development)
    /// </summary>
    [HttpGet("development-requirements")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetDevelopmentRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        try
        {
            var (requirements, totalCount) = await _projectRequirementService
                .GetDevelopmentRequirementsAsync(page, limit);
            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
            return Success(requirements, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving development requirements", ex.Message);
        }
    }

    /// <summary>
    /// Get draft requirements (requirements in draft status)
    ///// </summary>
    //[HttpGet("draft-requirements")]
    //[ProducesResponseType(200)]
    //public async Task<IActionResult> GetDraftRequirements(
    //    [FromQuery] int page = 1,
    //    [FromQuery] int limit = 20)
    //{
    //    try
    //    {
    //        var (requirements, totalCount) = await _projectRequirementService
    //            .GetDraftRequirementsAsync(page, limit);
    //        var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
    //        return Success(requirements, pagination);
    //    }
    //    catch (Exception ex)
    //    {
    //        return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving draft requirements", ex.Message);
    //    }
    //}

    /// <summary>
    /// Get approved requirements (requirements that have been approved)
    /// </summary>
    [HttpGet("approved-requirements")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetApprovedRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var (requirements, totalCount) = await _projectRequirementService.GetApprovedRequirementsAsync(page, limit, projectId, priority, search);
            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
            return Success(requirements, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving approved requirements", ex.Message);
        }
    }

    /// <summary>
    /// Get pending approval requirements (requirements waiting for approval)
    /// </summary>
    [HttpGet("pending-approval-requirements")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetPendingApprovalRequirements(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var (requirements, totalCount) = await _projectRequirementService.GetPendingApprovalRequirementsAsync(page, limit, status, priority, search);
            var pagination = new PaginationInfo(page, limit, totalCount, (int)Math.Ceiling((double)totalCount / limit));
            return Success(requirements, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<ProjectRequirement>>("An error occurred while retrieving pending approval requirements", ex.Message);
        }
    }

    /// <summary>
    /// Approve a requirement and change its status to approved
    /// </summary>
    [HttpPost("requirements/{id}/approve")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ApproveRequirement(int id)
    {
        try
        {
            var result = await _projectRequirementService.ApproveRequirementAsync(id);
            if (!result)
                return Error<ProjectRequirement>("Project requirement not found", null, 404);
            return Success("Requirement approved successfully");
        }
        catch (Exception ex)
        {
            return Error<string>("An error occurred while approving the requirement", ex.Message);
        }
    }

    /// <summary>
    /// Send requirement for approval or processing
    /// </summary>
    [HttpPost("requirements/{id}/send")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> SendRequirement(int id)
    {
        try
        {
            var result = await _projectRequirementService.SendRequirementAsync(id);
            if (!result)
                return Error<ProjectRequirement>("Project requirement not found", null, 404);
            return Success("Requirement sent successfully");
        }
        catch (Exception ex)
        {
            return Error<string>("An error occurred while sending the requirement", ex.Message);
        }
    }

    /// <summary>
    /// Create or update a task for a specific requirement
    /// If a task already exists for the requirement, it will be updated; otherwise, a new task will be created.
    /// </summary>
    [HttpPost("requirements/{id}/tasks")]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateRequirementTask(int id, [FromBody] CreateRequirementTaskDto taskDto)
    {
        try
        {
            var validationResult = ValidateModelState();
            if (validationResult != null) 
                return validationResult;

            var result = await _requirementTaskManagementService.CreateOrUpdateRequirementTaskAsync(id, taskDto);
            
            if (!result.Success)
            {
                return Error<RequirementTask>(result.ErrorMessage ?? "An error occurred", null, 404);
            }

            return CreatedAtAction(nameof(GetProjectRequirementById), new { id = id }, Success(new
            {
                RequirementTask = result.RequirementTask,
                CreatedTasks = result.CreatedTasks
            }));
        }
        catch (ArgumentException ex)
        {
            return Error<RequirementTask>("Validation failed", ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating requirement tasks for requirement {RequirementId}", id);
            return Error<RequirementTask>("An error occurred while creating the requirement tasks", ex.Message);
        }
    }

    /// <summary>
    /// Upload one or multiple attachments for a specific requirement (multipart/form-data).
    /// Accepts either a single field named 'file' or multiple using 'files'.
    /// </summary>
    [HttpPost("requirements/{id}/attachments")]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UploadAttachments(int id, [FromForm] List<IFormFile>? files, [FromForm] IFormFile? file)
    {
        try
        {
            // Normalize to a list: support legacy single file param name
            var incoming = new List<IFormFile>();
            if (files != null && files.Count > 0) incoming.AddRange(files);
            if (file != null) incoming.Add(file);
            if (incoming.Count == 0)
                return Error<object>("No files uploaded", status: 400);

            // Validate each file; collect first error only for simplicity
            foreach (var f in incoming)
            {
                var (isValid, error) = ValidateAttachment(f);
                if (!isValid)
                    return Error<object>(error!, null, 400);
            }

            // Use bulk service method (falls back to single additions internally)
            var result = await _projectRequirementService.UploadAttachmentsAsync(id, incoming);
            if (result == null || result.Count == 0)
                return Error<object>("Project requirement not found or no files processed", null, 404);

            return Success(result, message: "Attachment(s) uploaded successfully");
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while uploading the attachment(s)", ex.Message);
        }
    }

    /// <summary>
    /// Delete attachment from a specific requirement
    /// </summary>
    [HttpDelete("requirements/{id}/attachments/{attachmentId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteAttachment(int id, int attachmentId)
    {
        try
        {
            var result = await _projectRequirementService.DeleteAttachmentAsync(id, attachmentId);
            if (!result)
                return Error<ProjectRequirementAttachment>("Attachment not found", null, 404);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<ProjectRequirementAttachment>("An error occurred while deleting the attachment", ex.Message);
        }
    }

    /// <summary>
    /// Download attachment from a specific requirement
    /// </summary>
    [HttpGet("requirements/{id}/attachments/{attachmentId}/download")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DownloadAttachment(int id, int attachmentId)
    {
        try
        {
            var fileResult = await _projectRequirementService.DownloadAttachmentAsync(id, attachmentId);
            if (fileResult == null)
                return Error<byte[]>("Attachment not found", null, 404);
            // Prefer PhysicalFile if we have a concrete path (range support & automatic headers)
            if (!string.IsNullOrWhiteSpace(fileResult.FilePath) && System.IO.File.Exists(fileResult.FilePath))
            {
                return PhysicalFile(fileResult.FilePath, fileResult.ContentType, fileResult.FileName, enableRangeProcessing: true);
            }
            // Reset stream position defensively
            if (fileResult.FileStream.CanSeek)
                fileResult.FileStream.Position = 0;
            Response.ContentLength = fileResult.FileSize;
            return File(fileResult.FileStream, fileResult.ContentType, fileResult.FileName, enableRangeProcessing: true);
        }
        catch (Exception ex)
        {
            return Error<byte[]>("An error occurred while downloading the attachment", ex.Message);
        }
    }

    /// <summary>
    /// Bulk synchronize attachments for a requirement (add new files, remove specified attachment IDs) in a single request.
    /// Multipart/form-data: files[] for new files, removeIds (comma separated) or JSON body part named 'removeIds'.
    /// </summary>
    [HttpPost("requirements/{id}/attachments/sync")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> SyncAttachments(int id, [FromForm] List<IFormFile>? files, [FromForm] string? removeIds)
    {
        try
        {
            var newFiles = files ?? new List<IFormFile>();
            // Parse removeIds (comma separated integers)
            var removeList = new List<int>();
            if (!string.IsNullOrWhiteSpace(removeIds))
            {
                foreach (var part in removeIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    if (int.TryParse(part, out var rid)) removeList.Add(rid);
                }
            }

            // Validate each new file
            foreach (var f in newFiles)
            {
                var (isValid, error) = ValidateAttachment(f);
                if (!isValid)
                    return Error<object>(error!, null, 400);
            }

            var updated = await _projectRequirementService.SyncAttachmentsAsync(id, newFiles, removeList);
            if (updated == null)
                return Error<object>("Project requirement not found", null, 404);

            return Success(updated, message: "Attachments synchronized successfully");
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while synchronizing attachments", ex.Message);
        }
    }

    /// <summary>
    /// Get team workload performance - Redirect to TeamWorkloadController
    /// This endpoint exists for backward compatibility with frontend services
    /// </summary>
    [HttpGet("team-workload-performance")]
    [ProducesResponseType(200)]
    public IActionResult GetTeamWorkloadPerformance(
        [FromQuery] int? departmentId = null,
        [FromQuery] string? busyStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        // Redirect to the proper TeamWorkloadController endpoint
        var queryParams = new List<string>();
        if (departmentId.HasValue) queryParams.Add($"departmentId={departmentId}");
        if (!string.IsNullOrEmpty(busyStatus)) queryParams.Add($"busyStatus={busyStatus}");
        queryParams.Add($"page={page}");
        queryParams.Add($"limit={limit}");
        
        var redirectUrl = $"/api/team-workload/performance?{string.Join("&", queryParams)}";
        return Redirect(redirectUrl);
    }
}