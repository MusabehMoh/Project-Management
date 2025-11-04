using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.Enums;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class ProjectRequirementService : IProjectRequirementService
{
    private readonly IProjectRequirementRepository _projectRequirementRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUserContextAccessor _userContextAccessor;
    private readonly IUserService _userService;
    private readonly IProjectRequirementStatusHistoryRepository _statusHistoryRepository;

    public ProjectRequirementService(
        IProjectRequirementRepository projectRequirementRepository, 
        IProjectRepository projectRepository,
        IEmployeeRepository employeeRepository,
        IUserContextAccessor userContextAccessor,
        IUserService userService,
        IProjectRequirementStatusHistoryRepository statusHistoryRepository)
    {
        _projectRequirementRepository = projectRequirementRepository;
        _projectRepository = projectRepository;
        _employeeRepository = employeeRepository;
        _userContextAccessor = userContextAccessor;
        _userService = userService;
        _statusHistoryRepository = statusHistoryRepository;
    }

    public async Task<(IEnumerable<ProjectRequirement> ProjectRequirements, int TotalCount)> GetProjectRequirementsAsync(int page, int limit, int? projectId = null, int? status = null, string? priority = null, string? search = null)
    {
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, projectId, status, priority, search);
    }

    public async Task<ProjectRequirement?> GetProjectRequirementByIdAsync(int id)
    {
        // Use GetProjectRequirementWithDetailsAsync to include attachments
        return await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(id);
    }

    public async Task<ProjectRequirement?> GetByIdAsync(int id)
    {
        // Use GetProjectRequirementWithDetailsAsync to include attachments
        return await _projectRequirementRepository.GetByIdAsync(id);
    }
    public async Task<ProjectRequirement> CreateProjectRequirementAsync(ProjectRequirement projectRequirement)
    {
        projectRequirement.CreatedAt = DateTime.Now;
        projectRequirement.UpdatedAt = DateTime.Now;
        return await _projectRequirementRepository.AddAsync(projectRequirement);
    }

    public async Task<ProjectRequirement> UpdateProjectRequirementAsync(ProjectRequirement projectRequirement)
    {
        projectRequirement.UpdatedAt = DateTime.Now;
        await _projectRequirementRepository.UpdateAsync(projectRequirement);
        return projectRequirement;
    }

    public async Task<bool> DeleteProjectRequirementAsync(int id)
    {
        try
        {
            // Get the requirement with all its details including attachments
            var projectRequirement = await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(id);
            if (projectRequirement == null)
                return false;

            // Delete all associated attachments (only database records, files are stored in DB)
            if (projectRequirement.Attachments != null && projectRequirement.Attachments.Any())
            {
                foreach (var attachment in projectRequirement.Attachments.ToList())
                {
                    try
                    {
                        // Delete attachment from database (no file system cleanup needed)
                        await _projectRequirementRepository.DeleteAttachmentAsync(id, attachment.Id);
                    }
                    catch
                    {
                        // Continue with other attachments even if one fails
                    }
                }
            }

            // Delete the project requirement itself
            await _projectRequirementRepository.DeleteAsync(projectRequirement);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByProjectAsync(int projectId)
    {
        return await _projectRequirementRepository.GetProjectRequirementsByProjectAsync(projectId);
    }

    public async Task<(IEnumerable<AssignedProjectDto> AssignedProjects, int TotalCount)> GetAssignedProjectsAsync(int? userId, int page, int limit, string? search = null, int? projectId = null, bool skipAnalystFilter = false)
    {
        // Get current user context for filtering assigned projects
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated || string.IsNullOrWhiteSpace(userContext.PrsId))
        {
            return (Enumerable.Empty<AssignedProjectDto>(), 0);
        }

        // Get current user with roles to determine access level
        var currentUser = await _userService.GetCurrentUserAsync();
        if (currentUser == null)
        {
            return (Enumerable.Empty<AssignedProjectDto>(), 0);
        }

        // Determine filtering based on user role (similar to MemberTaskService pattern)
        bool shouldSkipAnalystFilter = skipAnalystFilter;

        if (!shouldSkipAnalystFilter)
        {
            bool isAdministrator = currentUser.Roles?.Any(r => IsRoleCode(r.Code, RoleCodes.Administrator)) ?? false;
            bool isManager = currentUser.Roles?.Any(r => IsManagerRole(r.Code)) ?? false;

            if (isAdministrator || isManager)
            {
                // Administrators and managers see all projects - skip analyst filtering
                shouldSkipAnalystFilter = true;
            }
        }

        // Call repository with appropriate filtering
        return await _projectRepository.GetAssignedProjectsAsync(userContext.PrsId, page, limit, search, projectId, shouldSkipAnalystFilter);
    }

    public async Task<ProjectRequirementStatsDto> GetProjectRequirementStatsAsync(int projectId)
    {
        return await _projectRequirementRepository.GetProjectRequirementStatsAsync(projectId);
    }

    public async Task<RequirementOverviewDto> GetRequirementOverviewAsync()
    {
        return await _projectRequirementRepository.GetRequirementOverviewAsync();
    }

    public async Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetDevelopmentRequirementsAsync(int page, int limit)
    {
        // Get requirements with status "Under Development" (assuming status 3)
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, null, (int)RequirementStatusEnum.UnderDevelopment, null);
    }

    public async Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetDraftRequirementsAsync(int page, int limit)
    {
        // Get requirements with status "New" or "Draft" (assuming status 1)
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, null, (int)RequirementStatusEnum.New, null);
    }

    public async Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetRedyForDevelopmentRequirementsAsync(int page, int limit, int? projectId = null, int? status = null, string? priority = null, string? search = null)
    {
        // Get requirements with status NOT in "New" (1) or "ManagerReview" (2)
        // This returns all requirements that are approved or further in the process
        // Apply additional filters on top of the status filtering
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, projectId, status, priority, search, new[] { 1, 2,7 });
    }
    public async Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetApprovedRequirementsAsync(int page, int limit, int? projectId = null, string? priority = null, string? search = null)
    {
        // Get requirements with status NOT in "New" (1) or "ManagerReview" (2)
        // This returns all requirements that are approved or further in the process
        // Apply additional filters on top of the status filtering
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, projectId, (int)RequirementStatusEnum.Approved, priority, search,null);
    }

    public async Task<bool> SendRequirementAsync(int id)
    {
        // Logic to send requirement for approval or processing
        var requirement = await _projectRequirementRepository.GetByIdAsync(id);
        if (requirement == null)
            return false;

        // Update status to "Under Study" (assuming status 2)
        requirement.Status = (RequirementStatusEnum)2;
        requirement.UpdatedAt = DateTime.Now;
        await _projectRequirementRepository.UpdateAsync(requirement);
        return true;
    }

    public async Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetPendingApprovalRequirementsAsync(int page, int limit, int? status = null, string? priority = null, string? search = null)
    {
        // Get requirements with status "ManagerReview" (2) - waiting for manager approval
        // But allow overriding with the status parameter if provided
        var filterStatus = status ?? (int)RequirementStatusEnum.ManagerReview;
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, null, filterStatus, priority, search);
    }

    public async Task<bool> ApproveRequirementAsync(int id)
    {
        var requirement = await _projectRequirementRepository.GetByIdAsync(id);
        if (requirement == null)
            return false;

        // Update status to "Approved" (assuming status 3)
        requirement.Status = RequirementStatusEnum.Approved;
        requirement.UpdatedAt = DateTime.Now;
        await _projectRequirementRepository.UpdateAsync(requirement);
        return true;
    }

    public async Task<RequirementTask?> CreateRequirementTaskAsync(int requirementId, CreateRequirementTaskDto taskDto)
    {
        var requirement = await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(requirementId);
        if (requirement == null)
            return null;

        // Validate dates for each role if both are provided
        if (taskDto.DeveloperStartDate.HasValue && taskDto.DeveloperEndDate.HasValue && 
            taskDto.DeveloperStartDate.Value > taskDto.DeveloperEndDate.Value)
        {
            throw new ArgumentException("Developer end date must be after start date");
        }

        if (taskDto.QcStartDate.HasValue && taskDto.QcEndDate.HasValue && 
            taskDto.QcStartDate.Value > taskDto.QcEndDate.Value)
        {
            throw new ArgumentException("QC end date must be after start date");
        }

        if (taskDto.DesignerStartDate.HasValue && taskDto.DesignerEndDate.HasValue && 
            taskDto.DesignerStartDate.Value > taskDto.DesignerEndDate.Value)
        {
            throw new ArgumentException("Designer end date must be after start date");
        }

        // Check if task already exists for this requirement
        RequirementTask task;
        
        if (requirement.RequirementTask != null)
        {
            // Update existing task
            task = requirement.RequirementTask;
            task.DeveloperId = taskDto.DeveloperId;
            task.QcId = taskDto.QcId;
            task.DesignerId = taskDto.DesignerId;
            task.Description = taskDto.Description;
            task.DeveloperStartDate = taskDto.DeveloperStartDate;
            task.DeveloperEndDate = taskDto.DeveloperEndDate;
            task.QcStartDate = taskDto.QcStartDate;
            task.QcEndDate = taskDto.QcEndDate;
            task.DesignerStartDate = taskDto.DesignerStartDate;
            task.DesignerEndDate = taskDto.DesignerEndDate;
            task.UpdatedAt = DateTime.Now;
        }
        else
        {
            // Create a new task associated with the requirement
            task = new RequirementTask
            {
                ProjectRequirementId = requirementId,
                DeveloperId = taskDto.DeveloperId,
                QcId = taskDto.QcId,
                DesignerId = taskDto.DesignerId,
                Description = taskDto.Description,
                DeveloperStartDate = taskDto.DeveloperStartDate,
                DeveloperEndDate = taskDto.DeveloperEndDate,
                QcStartDate = taskDto.QcStartDate,
                QcEndDate = taskDto.QcEndDate,
                DesignerStartDate = taskDto.DesignerStartDate,
                DesignerEndDate = taskDto.DesignerEndDate,
                Status = "not-started",
                CreatedBy = 1, // This should be the current user ID
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // Add the task to the requirement's tasks collection
            requirement.RequirementTask = task;
        }

        // Save the requirement (which will cascade save the task due to EF Core relationships)
        await _projectRequirementRepository.UpdateAsync(requirement);

        // Update project status to UnderDevelopment after creating the task
        if (requirement.Project != null)
        {
            requirement.Project.Status = ProjectStatus.UnderDevelopment;
            requirement.Project.UpdatedAt = DateTime.Now;
            await _projectRepository.UpdateAsync(requirement.Project);
        }

        return task;
    }

    public async Task<ProjectRequirementAttachment?> UploadAttachmentAsync(int requirementId, object fileObj)
    {
        // Cast the object to IFormFile
        if (fileObj is not IFormFile file)
        {
            throw new ArgumentException("File parameter must be of type IFormFile", nameof(fileObj));
        }

        var requirement = await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(requirementId);
        if (requirement == null)
            return null;

        try
        {
            // Read file to byte array - CRITICAL: Capture data BEFORE stream disposal
            byte[] fileData;
            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                // Get array while stream is still open and valid
                fileData = memoryStream.ToArray();
            }

            // Verify file data was actually read (not empty)
            if (fileData == null || fileData.Length == 0)
            {
                throw new Exception("Failed to read file data - file appears to be empty");
            }

            var attachment = new ProjectRequirementAttachment
            {
                ProjectRequirementId = requirementId,
                FileName = file.FileName,
                OriginalName = file.FileName,
                FileData = fileData,
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTime.Now
            };

            requirement.Attachments ??= new List<ProjectRequirementAttachment>();
            requirement.Attachments.Add(attachment);
            await _projectRequirementRepository.UpdateAsync(requirement);

            return attachment;
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to upload attachment: {ex.Message}", ex);
        }
    }

    public async Task<IReadOnlyList<ProjectRequirementAttachment>> UploadAttachmentsAsync(int requirementId, IEnumerable<IFormFile> files)
    {
        var requirement = await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(requirementId);
        if (requirement == null) return Array.Empty<ProjectRequirementAttachment>();

        requirement.Attachments ??= new List<ProjectRequirementAttachment>();
        var uploaded = new List<ProjectRequirementAttachment>();

        foreach (var file in files ?? Enumerable.Empty<IFormFile>())
        {
            if (file == null || file.Length == 0) continue;
            try
            {
                // Read file to byte array - CRITICAL: Capture data BEFORE stream disposal
                byte[] fileData;
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    // Get array while stream is still open and valid
                    fileData = memoryStream.ToArray();
                }
                
                // Verify file data was actually read (not empty)
                if (fileData == null || fileData.Length == 0)
                {
                    continue; // Skip files that failed to read
                }

                var attachment = new ProjectRequirementAttachment
                {
                    ProjectRequirementId = requirementId,
                    FileName = file.FileName,
                    OriginalName = file.FileName,
                    FileData = fileData, // Assign captured byte array
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedAt = DateTime.Now
                };
                requirement.Attachments.Add(attachment);
                uploaded.Add(attachment);
            }
            catch (Exception ex)
            {
                // Skip individual file failure but log it
                System.Diagnostics.Debug.WriteLine($"Error uploading attachment {file?.FileName}: {ex.Message}");
            }
        }

        if (uploaded.Count > 0)
        {
            requirement.UpdatedAt = DateTime.Now;
            await _projectRequirementRepository.UpdateAsync(requirement);
        }

        return uploaded.AsReadOnly();
    }

    public async System.Threading.Tasks.Task<bool> DeleteAttachmentAsync(int requirementId, int attachmentId)
    {
        try
        {
            // Delete attachment directly from database without loading full requirement
            return await _projectRequirementRepository.DeleteAttachmentAsync(requirementId, attachmentId);
        }
        catch
        {
            return false;
        }
    }

    public async System.Threading.Tasks.Task<DTOs.FileDownloadResult?> DownloadAttachmentAsync(int requirementId, int attachmentId)
    {
        try
        {
            // Load attachment directly from database with FileData included
            var attachment = await _projectRequirementRepository.GetAttachmentWithFileDataAsync(attachmentId);
            
            if (attachment == null || attachment.FileData == null || attachment.FileData.Length == 0)
                return null;

            // Convert byte array to MemoryStream
            var fileStream = new MemoryStream(attachment.FileData);

            // Infer MIME if missing or generic
            string contentType = attachment.ContentType ?? "application/octet-stream";
            if (string.IsNullOrWhiteSpace(contentType) || contentType == "application/octet-stream")
            {
                var ext = Path.GetExtension(attachment.OriginalName).ToLowerInvariant();
                contentType = ext switch
                {
                    ".pdf" => "application/pdf",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    ".gif" => "image/gif",
                    ".doc" => "application/msword",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ".xls" => "application/vnd.ms-excel",
                    ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ".ppt" => "application/vnd.ms-powerpoint",
                    ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    ".txt" => "text/plain",
                    ".zip" => "application/zip",
                    _ => "application/octet-stream"
                };
            }

            return new DTOs.FileDownloadResult
            {
                FileStream = fileStream,
                ContentType = contentType,
                FileName = attachment.OriginalName,
                FileSize = attachment.FileSize
            };
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Bulk synchronize attachments in a single operation: remove specified attachment IDs and add new uploaded files.
    /// Mirrors logic of individual upload/delete operations while minimizing round trips.
    /// </summary>
    /// <param name="requirementId">Requirement identifier.</param>
    /// <param name="newFiles">New files to add (can be empty).</param>
    /// <param name="removeIds">Attachment IDs to remove (can be empty).</param>
    /// <returns>Updated immutable list of attachments or null if requirement not found.</returns>
    public async Task<IReadOnlyList<ProjectRequirementAttachment>?> SyncAttachmentsAsync(int requirementId, IEnumerable<IFormFile> newFiles, IEnumerable<int> removeIds)
    {
        // Normalize inputs
        var removeSet = new HashSet<int>(removeIds ?? Enumerable.Empty<int>());

        // Remove attachments whose IDs are specified
        if (removeSet.Count > 0)
        {
            foreach (var attachmentId in removeSet)
            {
                try
                {
                    await _projectRequirementRepository.DeleteAttachmentAsync(requirementId, attachmentId);
                }
                catch
                {
                    // Ignore individual deletion failures to continue processing other attachments
                }
            }
        }

        // Add new files directly
        foreach (var file in newFiles ?? Enumerable.Empty<IFormFile>())
        {
            if (file == null || file.Length == 0)
            {
                continue;
            }

            try
            {
                byte[] fileData;
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    fileData = memoryStream.ToArray();
                }

                if (fileData.Length == 0)
                {
                    continue;
                }

                var attachment = new ProjectRequirementAttachment
                {
                    ProjectRequirementId = requirementId,
                    FileName = file.FileName,
                    OriginalName = file.FileName,
                    FileData = fileData,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedAt = DateTime.Now,
                };

                await _projectRequirementRepository.AddAttachmentAsync(attachment);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error syncing attachment {file?.FileName}: {ex.Message}");
            }
        }

        // Return updated attachment list without reloading requirement entity
        var updatedAttachments = await _projectRequirementRepository.GetAttachmentsMetadataAsync(requirementId);
        return updatedAttachments.AsReadOnly();
    }

     

    private bool IsRoleCode(string? roleCode, RoleCodes targetRole)
    {
        if (string.IsNullOrEmpty(roleCode))
            return false;

        return Enum.TryParse(roleCode, true, out RoleCodes parsedRole) && parsedRole == targetRole;
    }

    private bool IsManagerRole(string? roleCode)
    {
        if (string.IsNullOrEmpty(roleCode))
            return false;

        return Enum.TryParse(roleCode, true, out RoleCodes parsedRole) &&
               (parsedRole == RoleCodes.AnalystManager ||
                parsedRole == RoleCodes.DevelopmentManager ||
                parsedRole == RoleCodes.QCManager ||
                parsedRole == RoleCodes.DesignerManager);
    }

    // Status history methods
    public async Task<ProjectRequirementStatusHistory> CreateRequirementStatusHistoryAsync(ProjectRequirementStatusHistory statusHistory)
    {
        statusHistory.CreatedAt = DateTime.Now;
        return await _statusHistoryRepository.AddAsync(statusHistory);
    }

    public async Task<IEnumerable<ProjectRequirementStatusHistory>> GetRequirementStatusHistoryAsync(int requirementId)
    {
        return await _statusHistoryRepository.GetRequirementStatusHistoryAsync(requirementId);
    }
}