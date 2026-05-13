using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Api.Attributes;
using PMA.Core.Entities;
using PMA.Infrastructure.Data;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/managers")]
[RequireAdmin]
public class ProjectManagerAssignmentsController : ApiBaseController
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ProjectManagerAssignmentsController> _logger;

    public ProjectManagerAssignmentsController(ApplicationDbContext db, ILogger<ProjectManagerAssignmentsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Get all PM assignments for a project
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAssignments(int projectId)
    {
        try
        {
            var assignments = await _db.ProjectManagerAssignments
                .Include(a => a.User)
                .Where(a => a.ProjectId == projectId)
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    UserName = a.User != null ? a.User.FullName : "",
                    a.AssignedAt
                })
                .ToListAsync();

            return Success(assignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting PM assignments for project {ProjectId}", projectId);
            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Assign a PM to a project (Admin only)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> AssignManager(int projectId, [FromBody] AssignManagerDto dto)
    {
        try
        {
            var project = await _db.Projects.FindAsync(projectId);
            if (project == null)
                return Error<object>("Project not found", status: 404);

            var user = await _db.Users.FindAsync(dto.UserId);
            if (user == null)
                return Error<object>("User not found", status: 404);

            var exists = await _db.ProjectManagerAssignments
                .AnyAsync(a => a.ProjectId == projectId && a.UserId == dto.UserId);

            if (exists)
                return Error<object>("Manager already assigned to this project");

            var assignment = new ProjectManagerAssignment
            {
                ProjectId = projectId,
                UserId = dto.UserId,
                AssignedBy = dto.AssignedBy,
                AssignedAt = DateTime.Now
            };

            _db.ProjectManagerAssignments.Add(assignment);
            await _db.SaveChangesAsync();

            return Created(new { assignment.Id, assignment.ProjectId, assignment.UserId, assignment.AssignedAt },
                "Manager assigned successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning PM {UserId} to project {ProjectId}", dto.UserId, projectId);
            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Remove PM assignment from a project (Admin only)
    /// </summary>
    [HttpDelete("{userId}")]
    public async Task<IActionResult> RemoveManager(int projectId, int userId)
    {
        try
        {
            var assignment = await _db.ProjectManagerAssignments
                .FirstOrDefaultAsync(a => a.ProjectId == projectId && a.UserId == userId);

            if (assignment == null)
                return Error<object>("Assignment not found", status: 404);

            _db.ProjectManagerAssignments.Remove(assignment);
            await _db.SaveChangesAsync();

            return Success<object>(null!, "Manager removed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing PM {UserId} from project {ProjectId}", userId, projectId);
            return Error<object>("Internal server error", ex.Message);
        }
    }
}

public class AssignManagerDto
{
    public int UserId { get; set; }
    public int AssignedBy { get; set; }
}
