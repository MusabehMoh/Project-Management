using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.Enums;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class ProjectRequirementService : IProjectRequirementService
{
    private readonly IProjectRequirementRepository _projectRequirementRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICurrentUserProvider _currentUserProvider;
    private readonly IAppPathProvider _pathProvider;

    public ProjectRequirementService(
        IProjectRequirementRepository projectRequirementRepository, 
        IProjectRepository projectRepository,
        IEmployeeRepository employeeRepository,
        ICurrentUserProvider currentUserProvider,
        IAppPathProvider pathProvider)
    {
        _projectRequirementRepository = projectRequirementRepository;
        _projectRepository = projectRepository;
        _employeeRepository = employeeRepository;
        _currentUserProvider = currentUserProvider;
        _pathProvider = pathProvider;
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

    public async Task<ProjectRequirement> CreateProjectRequirementAsync(ProjectRequirement projectRequirement)
    {
        projectRequirement.CreatedAt = DateTime.UtcNow;
        projectRequirement.UpdatedAt = DateTime.UtcNow;
        return await _projectRequirementRepository.AddAsync(projectRequirement);
    }

    public async Task<ProjectRequirement> UpdateProjectRequirementAsync(ProjectRequirement projectRequirement)
    {
        projectRequirement.UpdatedAt = DateTime.UtcNow;
        await _projectRequirementRepository.UpdateAsync(projectRequirement);
        return projectRequirement;
    }

    public async Task<bool> DeleteProjectRequirementAsync(int id)
    {
        var projectRequirement = await _projectRequirementRepository.GetByIdAsync(id);
        if (projectRequirement != null)
        {
            await _projectRequirementRepository.DeleteAsync(projectRequirement);
            return true;
        }
        return false;
    }

    public async Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByProjectAsync(int projectId)
    {
        return await _projectRequirementRepository.GetProjectRequirementsByProjectAsync(projectId);
    }

    public async Task<(IEnumerable<AssignedProjectDto> AssignedProjects, int TotalCount)> GetAssignedProjectsAsync(int? userId, int page, int limit, string? search = null, int? projectId = null)
    {
        // Get current user's PrsId for filtering assigned projects
        var currentUserPrsId = await _currentUserProvider.GetCurrentUserPrsIdAsync();
        if (string.IsNullOrWhiteSpace(currentUserPrsId))
        {
            return (Enumerable.Empty<AssignedProjectDto>(), 0);
        }

        // Delegate to repository for complex query logic
        return await _projectRepository.GetAssignedProjectsAsync(currentUserPrsId, page, limit, search, projectId);
    }

    public async Task<ProjectRequirementStatsDto> GetProjectRequirementStatsAsync(int projectId)
    {
        return await _projectRequirementRepository.GetProjectRequirementStatsAsync(projectId);
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

    public async Task<(IEnumerable<ProjectRequirement> Requirements, int TotalCount)> GetApprovedRequirementsAsync(int page, int limit, int? projectId = null, string? priority = null, string? search = null)
    {
        // Get requirements with status NOT in "New" (1) or "ManagerReview" (2)
        // This returns all requirements that are approved or further in the process
        // Apply additional filters on top of the status filtering
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, projectId, null, priority, search, new[] { 1, 2 });
    }

    public async Task<bool> SendRequirementAsync(int id)
    {
        // Logic to send requirement for approval or processing
        var requirement = await _projectRequirementRepository.GetByIdAsync(id);
        if (requirement == null)
            return false;

        // Update status to "Under Study" (assuming status 2)
        requirement.Status = (RequirementStatusEnum)2;
        requirement.UpdatedAt = DateTime.UtcNow;
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
        requirement.UpdatedAt = DateTime.UtcNow;
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
            taskDto.DeveloperStartDate.Value >= taskDto.DeveloperEndDate.Value)
        {
            throw new ArgumentException("Developer end date must be after start date");
        }

        if (taskDto.QcStartDate.HasValue && taskDto.QcEndDate.HasValue && 
            taskDto.QcStartDate.Value >= taskDto.QcEndDate.Value)
        {
            throw new ArgumentException("QC end date must be after start date");
        }

        if (taskDto.DesignerStartDate.HasValue && taskDto.DesignerEndDate.HasValue && 
            taskDto.DesignerStartDate.Value >= taskDto.DesignerEndDate.Value)
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
            task.UpdatedAt = DateTime.UtcNow;
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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Add the task to the requirement's tasks collection
            requirement.RequirementTask = task;
        }

        // Update requirement status to "under development" if it was approved
        if (requirement.Status == RequirementStatusEnum.Approved)
        {
            requirement.Status = RequirementStatusEnum.UnderDevelopment;
        }

        requirement.UpdatedAt = DateTime.UtcNow;

        // Save the requirement (which will cascade save the task due to EF Core relationships)
        await _projectRequirementRepository.UpdateAsync(requirement);

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
            // Generate unique filename to avoid conflicts
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}" + fileExtension;

            // Use provided web root path (best practice) for static file compatibility
            var physicalDirectory = Path.Combine(_pathProvider.WebRootPath, "uploads", "requirements", requirementId.ToString());
            Directory.CreateDirectory(physicalDirectory);

            var physicalPath = Path.Combine(physicalDirectory, uniqueFileName);

            await using (var stream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream);
            }

            // Store a relative path (from content root) for portability
            var relativePathForDb = Path.Combine("uploads", "requirements", requirementId.ToString(), uniqueFileName)
                .Replace('\\', '/');

            var attachment = new ProjectRequirementAttachment
            {
                ProjectRequirementId = requirementId,
                FileName = uniqueFileName,
                OriginalName = file.FileName,
                FilePath = relativePathForDb,
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTime.UtcNow
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
                var ext = Path.GetExtension(file.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}" + ext;
                var physicalDirectory = Path.Combine(_pathProvider.WebRootPath, "uploads", "requirements", requirementId.ToString());
                Directory.CreateDirectory(physicalDirectory);
                var physicalPath = Path.Combine(physicalDirectory, uniqueFileName);
                await using (var stream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await file.CopyToAsync(stream);
                }
                var relativePathForDb = Path.Combine("uploads", "requirements", requirementId.ToString(), uniqueFileName).Replace('\\', '/');
                var attachment = new ProjectRequirementAttachment
                {
                    ProjectRequirementId = requirementId,
                    FileName = uniqueFileName,
                    OriginalName = file.FileName,
                    FilePath = relativePathForDb,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedAt = DateTime.UtcNow
                };
                requirement.Attachments.Add(attachment);
                uploaded.Add(attachment);
            }
            catch
            {
                // skip individual file failure
            }
        }

        if (uploaded.Count > 0)
        {
            requirement.UpdatedAt = DateTime.UtcNow;
            await _projectRequirementRepository.UpdateAsync(requirement);
        }

        return uploaded.AsReadOnly();
    }

    public async System.Threading.Tasks.Task<bool> DeleteAttachmentAsync(int requirementId, int attachmentId)
    {
        try
        {
            var requirement = await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(requirementId);
            if (requirement?.Attachments == null)
                return false;

            var attachment = requirement.Attachments.FirstOrDefault(a => a.Id == attachmentId);
            if (attachment == null)
                return false;

            // Resolve physical path before attempting deletion (supports relative & legacy absolute)
            var deletePhysical = ResolvePhysicalPath(attachment.FilePath);
            if (deletePhysical != null && File.Exists(deletePhysical))
            {
                File.Delete(deletePhysical);
            }

            // Remove attachment from requirement
            requirement.Attachments.Remove(attachment);
            await _projectRequirementRepository.UpdateAsync(requirement);
            
            return true;
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
            var requirement = await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(requirementId);
            if (requirement?.Attachments == null)
                return null;

            var attachment = requirement.Attachments.FirstOrDefault(a => a.Id == attachmentId);
            if (attachment == null)
                return null;

            // Resolve physical path (support legacy absolute path, stored path beginning with wwwroot, or new relative path)
            var physicalPath = ResolvePhysicalPath(attachment.FilePath);
            if (physicalPath == null)
                return null;

            if (!File.Exists(physicalPath))
                return null;

            var fs = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read);

            // Infer MIME if missing or generic (lightweight mapping to keep Core project free of ASP.NET deps)
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

            var actualLength = new FileInfo(physicalPath).Length;
            // Optionally could log mismatch with attachment.FileSize
            if (attachment.FileSize != actualLength)
            {
                // We won't fail; trust disk
                attachment.FileSize = actualLength;
            }

            return new DTOs.FileDownloadResult
            {
                FileStream = fs,
                ContentType = contentType,
                FileName = attachment.OriginalName,
                FileSize = attachment.FileSize,
                FilePath = physicalPath
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
        var requirement = await _projectRequirementRepository.GetProjectRequirementWithDetailsAsync(requirementId);
        if (requirement == null)
            return null;

        requirement.Attachments ??= new List<ProjectRequirementAttachment>();

        // Normalize inputs
        var removeSet = new HashSet<int>(removeIds ?? Enumerable.Empty<int>());

        // Remove attachments (and underlying physical files) whose IDs are specified
        if (removeSet.Count > 0 && requirement.Attachments.Count > 0)
        {
            var toRemove = requirement.Attachments.Where(a => removeSet.Contains(a.Id)).ToList();
            foreach (var att in toRemove)
            {
                try
                {
                    var physicalPath = ResolvePhysicalPath(att.FilePath);
                    if (physicalPath != null && File.Exists(physicalPath))
                    {
                        File.Delete(physicalPath);
                    }
                }
                catch
                {
                    // Swallow individual deletion errors to allow rest of sync to continue
                }
                requirement.Attachments.Remove(att);
            }
        }

        // Add new files
        foreach (var file in newFiles ?? Enumerable.Empty<IFormFile>())
        {
            if (file == null || file.Length == 0) continue;
            try
            {
                var extension = Path.GetExtension(file.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}" + extension;
                var physicalDirectory = Path.Combine(_pathProvider.WebRootPath, "uploads", "requirements", requirementId.ToString());
                Directory.CreateDirectory(physicalDirectory);
                var physicalPath = Path.Combine(physicalDirectory, uniqueFileName);
                await using (var stream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await file.CopyToAsync(stream);
                }
                var relativePathForDb = Path.Combine("uploads", "requirements", requirementId.ToString(), uniqueFileName).Replace('\\', '/');

                requirement.Attachments.Add(new ProjectRequirementAttachment
                {
                    ProjectRequirementId = requirementId,
                    FileName = uniqueFileName,
                    OriginalName = file.FileName,
                    FilePath = relativePathForDb,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedAt = DateTime.UtcNow
                });
            }
            catch
            {
                // Skip failed file but continue others
            }
        }

        requirement.UpdatedAt = DateTime.UtcNow;
        await _projectRequirementRepository.UpdateAsync(requirement);

        // Return a snapshot (read-only copy) of attachments
        return requirement.Attachments.ToList().AsReadOnly();
    }

    /// <summary>
    /// Resolve a stored attachment path to an absolute on-disk path avoiding duplicate wwwroot segments.
    /// </summary>
    /// <param name="storedPath">Path persisted in DB (may be null, relative like 'uploads/...', or include 'wwwroot/...', or absolute).</param>
    /// <returns>Absolute physical path or null if cannot be resolved.</returns>
    private string? ResolvePhysicalPath(string? storedPath)
    {
        if (string.IsNullOrWhiteSpace(storedPath)) return null;

        // Absolute path already
        if (Path.IsPathRooted(storedPath)) return storedPath;

        // Normalise slashes
        var normalized = storedPath.Replace('\\', '/').TrimStart('/');

    var contentRoot = _pathProvider.ContentRootPath; // project root

        // If the path already starts with wwwroot/, just append to content root
        if (normalized.StartsWith("wwwroot/", StringComparison.OrdinalIgnoreCase))
        {
            return Path.Combine(contentRoot, normalized.Replace('/', Path.DirectorySeparatorChar));
        }

        // Otherwise assume it is relative to wwwroot (our current storage strategy: uploads/...)
        return Path.Combine(_pathProvider.WebRootPath, normalized.Replace('/', Path.DirectorySeparatorChar));
    }
}