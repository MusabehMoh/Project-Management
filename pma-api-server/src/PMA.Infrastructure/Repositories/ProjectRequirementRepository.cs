using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Enums;
using PMA.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;

namespace PMA.Infrastructure.Repositories;

public class ProjectRequirementRepository : Repository<ProjectRequirement>, IProjectRequirementRepository
{
    public ProjectRequirementRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<ProjectRequirement> ProjectRequirements, int TotalCount)> GetProjectRequirementsAsync(int page, int limit, int? projectId = null, int? status = null, string? priority = null, string? search = null, int[]? excludeStatuses = null)
    {
        var query = _context.ProjectRequirements
            .Include(pr => pr.Project)
            .Include(pr => pr.Creator)
            .Include(pr => pr.Sender)
            .Include(pr => pr.Analyst)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(rt => rt.Developer)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(rt => rt.Qc)
            .Include(pr => pr.Timeline)
            .AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(pr => pr.ProjectId == projectId.Value);
        }

        if (status.HasValue && status.Value > 0)
        {
            if (Enum.IsDefined(typeof(RequirementStatusEnum), status.Value))
            {
                var statusEnum = (RequirementStatusEnum)status.Value;
                query = query.Where(pr => pr.Status == statusEnum);
            }
        }

        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<RequirementPriority>(priority, true, out var priorityEnum))
            {
                query = query.Where(pr => pr.Priority == priorityEnum);
            }
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(pr => 
                pr.Name.Contains(search) || 
                (pr.Description != null && pr.Description.Contains(search)) ||
                (pr.Project != null && pr.Project.ApplicationName.Contains(search)));
        }

        if (excludeStatuses != null && excludeStatuses.Length > 0)
        {
            query = query.Where(pr => !excludeStatuses.Contains((int)pr.Status));
        }

        var totalCount = await query.CountAsync();
        var projectRequirements = await query
            .OrderByDescending(pr => pr.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (projectRequirements, totalCount);
    }

    public async Task<(IEnumerable<ProjectRequirement> ProjectRequirements, int TotalCount)> GetProjectRequirementsByStatusesAsync(int page, int limit, int[] statuses, int? projectId = null, string? priority = null, string? search = null)
    {
        var query = _context.ProjectRequirements
            .Include(pr => pr.Project)
            .Include(pr => pr.Creator)
            .Include(pr => pr.Sender)
            .Include(pr => pr.Analyst)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(rt => rt.Developer)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(rt => rt.Qc)
            .Include(pr => pr.Timeline)
            .AsQueryable();

        // Filter by multiple statuses
        if (statuses != null && statuses.Length > 0)
        {
            var statusEnums = statuses
                .Where(s => Enum.IsDefined(typeof(RequirementStatusEnum), s))
                .Select(s => (RequirementStatusEnum)s)
                .ToList();
            
            if (statusEnums.Any())
            {
                query = query.Where(pr => statusEnums.Contains(pr.Status));
            }
        }

        if (projectId.HasValue)
        {
            query = query.Where(pr => pr.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<RequirementPriority>(priority, true, out var priorityEnum))
            {
                query = query.Where(pr => pr.Priority == priorityEnum);
            }
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(pr => 
                pr.Name.Contains(search) || 
                (pr.Description != null && pr.Description.Contains(search)) ||
                (pr.Project != null && pr.Project.ApplicationName.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var projectRequirements = await query
            .OrderByDescending(pr => pr.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (projectRequirements, totalCount);
    }

    public async Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByProjectAsync(int projectId)
    {
        // Ultra-optimized approach: Use multiple targeted queries instead of complex joins
        
        // 1. Get basic requirements data first
        var basicRequirements = await _context.ProjectRequirements
            .Where(pr => pr.ProjectId == projectId)
            .OrderByDescending(pr => pr.CreatedAt)
            .ToListAsync();

        if (!basicRequirements.Any())
            return basicRequirements;

        var requirementIds = basicRequirements.Select(r => r.Id).ToList();
        
        // 2. Load Project data (single query for all requirements of same project)
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId);

        // 3. Load Users in batches (Creator, Analyst)
        var userIds = new List<int>();
        userIds.AddRange(basicRequirements.Where(r => r.CreatedBy > 0).Select(r => r.CreatedBy));
        userIds.AddRange(basicRequirements.Where(r => r.AssignedAnalyst.HasValue).Select(r => r.AssignedAnalyst!.Value));
        
        var users = userIds.Any() 
            ? await _context.Users.Where(u => userIds.Contains(u.PrsId)).ToDictionaryAsync(u => u.PrsId)
            : new Dictionary<int, User>();

        // Load Employees for Sender (SentBy references Employee.Id)
        var employeeIds = basicRequirements.Where(r => r.SentBy.HasValue).Select(r => r.SentBy!.Value).ToList();
        var employees = employeeIds.Any()
            ? await _context.MawaredEmployees.Where(e => employeeIds.Contains(e.Id)).ToDictionaryAsync(e => e.Id)
            : new Dictionary<int, Employee>();

        // 4. Load RequirementTasks with related data
        var tasks = await _context.RequirementTasks
            .Include(rt => rt.Developer)
            .Include(rt => rt.Qc)
            .Where(rt => requirementIds.Contains(rt.ProjectRequirementId))
            .ToDictionaryAsync(rt => rt.ProjectRequirementId);

        // 5. Load Timelines
        var timelines = await _context.Timelines
            .Where(t => requirementIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id);

        // 6. Load attachment metadata (without FileData)
        var attachments = await _context.ProjectRequirementAttachments
            .Where(a => requirementIds.Contains(a.ProjectRequirementId))
            .Select(a => new ProjectRequirementAttachment
            {
                Id = a.Id,
                ProjectRequirementId = a.ProjectRequirementId,
                FileName = a.FileName,
                OriginalName = a.OriginalName,
                FileSize = a.FileSize,
                ContentType = a.ContentType,
                UploadedAt = a.UploadedAt
            })
            .ToListAsync();

        var attachmentGroups = attachments.GroupBy(a => a.ProjectRequirementId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 7. Manually populate navigation properties
        foreach (var requirement in basicRequirements)
        {
            requirement.Project = project;
            
            if (users.TryGetValue(requirement.CreatedBy, out var creator))
                requirement.Creator = creator;
            
            if (requirement.SentBy.HasValue && employees.TryGetValue(requirement.SentBy.Value, out var sender))
                requirement.Sender = sender;
                
            if (requirement.AssignedAnalyst.HasValue && users.TryGetValue(requirement.AssignedAnalyst.Value, out var analyst))
                requirement.Analyst = analyst;

            if (tasks.TryGetValue(requirement.Id, out var task))
                requirement.RequirementTask = task;

            if (timelines.TryGetValue(requirement.Id, out var timeline))
                requirement.Timeline = timeline;

            if (attachmentGroups.TryGetValue(requirement.Id, out var reqAttachments))
                requirement.Attachments = reqAttachments;
            else
                requirement.Attachments = new List<ProjectRequirementAttachment>();
        }

        return basicRequirements;
    }

    public async Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByAnalystAsync(int analystId)
    {
        return await _context.ProjectRequirements
            .Include(pr => pr.Project)
            .Include(pr => pr.Creator)
            .Include(pr => pr.Sender)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(rt => rt.Developer)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(rt => rt.Qc)
            .Where(pr => pr.AssignedAnalyst == analystId)
            .OrderBy(pr => pr.Priority)
            .ThenBy(pr => pr.ExpectedCompletionDate)
            .ToListAsync();
    }

    public async Task<ProjectRequirement?> GetProjectRequirementWithDetailsAsync(int id)
    {
        var requirement = await _context.ProjectRequirements
            .Include(pr => pr.Project)
                .ThenInclude(p => p != null ? p.ProjectOwnerEmployee : null)
            .Include(pr => pr.Project)
                .ThenInclude(p => p != null ? p.AlternativeOwnerEmployee : null)
            .Include(pr => pr.Project)
                .ThenInclude(p => p != null ? p.OwningUnitEntity : null)
            .Include(pr => pr.Creator)
            .Include(pr => pr.Sender)
            .Include(pr => pr.Analyst)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(t => t.Developer)
            .Include(pr => pr.RequirementTask)
                .ThenInclude(t => t.Qc)
            .Include(pr => pr.Timeline)
            .FirstOrDefaultAsync(pr => pr.Id == id);

        // Fetch attachments separately with Select projection to exclude FileData
        // This avoids loading large byte arrays when only metadata is needed
        if (requirement != null)
        {
            requirement.Attachments = await _context.ProjectRequirementAttachments
                .Where(a => a.ProjectRequirementId == id)
                .Select(a => new ProjectRequirementAttachment
                {
                    Id = a.Id,
                    ProjectRequirementId = a.ProjectRequirementId,
                    FileName = a.FileName,
                    OriginalName = a.OriginalName,
                    FileSize = a.FileSize,
                    ContentType = a.ContentType,
                    UploadedAt = a.UploadedAt
                    // Exclude a.FileData to avoid loading large byte arrays
                })
                .ToListAsync();
        }

        return requirement;
    }

    public async Task<ProjectRequirementStatsDto> GetProjectRequirementStatsAsync(int projectId)
    {
        var query = _context.ProjectRequirements
            .Where(pr => pr.ProjectId == projectId);

        var total = await query.CountAsync();

        // Group by status to get counts - using enum values
        var statusCounts = await query
            .GroupBy(pr => pr.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Status, g => g.Count);

        // Map status enum values to DTO properties
        var newCount = statusCounts.GetValueOrDefault(RequirementStatusEnum.New, 0);
        var managerReview = statusCounts.GetValueOrDefault(RequirementStatusEnum.ManagerReview, 0);
        var approved = statusCounts.GetValueOrDefault(RequirementStatusEnum.Approved, 0);
        var underDevelopment = statusCounts.GetValueOrDefault(RequirementStatusEnum.UnderDevelopment, 0);
        var underTesting = statusCounts.GetValueOrDefault(RequirementStatusEnum.UnderTesting, 0);
        var completed = statusCounts.GetValueOrDefault(RequirementStatusEnum.Completed, 0);

        // Group by priority to get counts - using enum values
        var priorityCounts = await query
            .GroupBy(pr => pr.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Priority, g => g.Count);

        return new ProjectRequirementStatsDto
        {
            Total = total,
            Draft = newCount,
            ManagerReview = managerReview,
            Approved = approved,
            InDevelopment = underDevelopment,
            UnderTesting = underTesting,
            Completed = completed,
            ByStatus = new ByStatusDto
            {
                Draft = newCount,
                ManagerReview = managerReview,
                Approved = approved,
                Rejected = 0, // No rejected status in current enum
                InDevelopment = underDevelopment,
                UnderTesting = underTesting,
                Completed = completed
            },
            ByPriority = new ByPriorityDto
            {
                Low = priorityCounts.GetValueOrDefault(RequirementPriority.Low, 0),
                Medium = priorityCounts.GetValueOrDefault(RequirementPriority.Medium, 0),
                High = priorityCounts.GetValueOrDefault(RequirementPriority.High, 0),
                Critical = priorityCounts.GetValueOrDefault(RequirementPriority.Critical, 0)
            }
        };
    }

    public async Task<RequirementOverviewDto> GetRequirementOverviewAsync()
    {
        var today = DateTime.Today;
        var thirtyDaysAgo = today.AddDays(-30);
        var sixtyDaysAgo = today.AddDays(-60);

        // Query all requirements once
        var allRequirements = _context.ProjectRequirements.AsQueryable();

        // New Requirements (status: New only)
        var newRequirementsCount = await allRequirements
            .Where(pr => pr.Status == RequirementStatusEnum.New)
            .CountAsync();

        // Ongoing Requirements (status: UnderDevelopment or UnderTesting)
        var ongoingRequirementsCount = await allRequirements
            .Where(pr => pr.Status == RequirementStatusEnum.UnderDevelopment ||
                         pr.Status == RequirementStatusEnum.UnderTesting)
            .CountAsync();

        // Active Requirements (all except Completed, Cancelled, Postponed)
        var activeRequirements = await allRequirements
            .Where(pr => pr.Status != RequirementStatusEnum.Completed &&
                         pr.Status != RequirementStatusEnum.Cancelled &&
                         pr.Status != RequirementStatusEnum.Postponed)
            .CountAsync();

        // Pending Approvals (status: ManagerReview)
        var pendingApprovals = await allRequirements
            .Where(pr => pr.Status == RequirementStatusEnum.ManagerReview)
            .CountAsync();

        return new RequirementOverviewDto
        {
            NewRequirements = new NewRequirementsDto
            {
                Count = newRequirementsCount
            },
            OngoingRequirements = new OngoingRequirementsDto
            {
                Count = ongoingRequirementsCount
            },
            ActiveRequirements = activeRequirements,
            PendingApprovals = pendingApprovals
        };
    }

    public async Task<ProjectRequirementAttachment?> GetAttachmentWithFileDataAsync(int attachmentId)
    {
        // Load attachment directly from database with full FileData included
        return await _context.ProjectRequirementAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId);
    }

    public async Task<ProjectRequirementAttachment> AddAttachmentAsync(ProjectRequirementAttachment attachment)
    {
        _context.ProjectRequirementAttachments.Add(attachment);
        await _context.SaveChangesAsync();
        return attachment;
    }

    public async Task<List<ProjectRequirementAttachment>> GetAttachmentsMetadataAsync(int requirementId)
    {
        return await _context.ProjectRequirementAttachments
            .Where(a => a.ProjectRequirementId == requirementId)
            .OrderByDescending(a => a.UploadedAt)
            .Select(a => new ProjectRequirementAttachment
            {
                Id = a.Id,
                ProjectRequirementId = a.ProjectRequirementId,
                FileName = a.FileName,
                OriginalName = a.OriginalName,
                FileSize = a.FileSize,
                ContentType = a.ContentType,
                UploadedAt = a.UploadedAt
            })
            .ToListAsync();
    }

    public async System.Threading.Tasks.Task<bool> DeleteAttachmentAsync(int requirementId, int attachmentId)
    {
        try
        {
            // Find the attachment directly in the database
            var attachment = await _context.ProjectRequirementAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.ProjectRequirementId == requirementId);

            if (attachment == null)
                return false;

            // Files are stored as binary data (byte[]) in FileData column
            // Removing the database record automatically deletes the file
            _context.ProjectRequirementAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Directly insert a RequirementTask entity without loading the full requirement context.
    /// This is more efficient than loading the entire requirement with all its details.
    /// </summary>
    /// <param name="task">The RequirementTask entity to add</param>
    /// <returns>The added RequirementTask with its generated Id</returns>
    public async System.Threading.Tasks.Task<RequirementTask> AddRequirementTaskAsync(RequirementTask task)
    {
        try
        {
            _context.RequirementTasks.Add(task);
            await _context.SaveChangesAsync();
            return task;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error adding requirement task for requirement {task.ProjectRequirementId}", ex);
        }
    }

    /// <summary>
    /// Get an existing RequirementTask by its ProjectRequirementId.
    /// </summary>
    /// <param name="requirementId">The ProjectRequirement ID to search for</param>
    /// <returns>The RequirementTask if found, null otherwise</returns>
    public async System.Threading.Tasks.Task<RequirementTask?> GetRequirementTaskByRequirementIdAsync(int requirementId)
    {
        return await _context.RequirementTasks
            .FirstOrDefaultAsync(rt => rt.ProjectRequirementId == requirementId);
    }

    /// <summary>
    /// Update an existing RequirementTask entity.
    /// </summary>
    /// <param name="task">The RequirementTask entity to update</param>
    public async System.Threading.Tasks.Task UpdateRequirementTaskAsync(RequirementTask task)
    {
        _context.RequirementTasks.Update(task);
        await _context.SaveChangesAsync();
    }
}