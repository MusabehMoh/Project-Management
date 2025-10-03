using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Infrastructure.Data;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/developer-team")]
public class DeveloperTeamController : ApiBaseController
{
    private readonly ApplicationDbContext _context;

    public DeveloperTeamController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get developer team availability information
    /// </summary>
    [HttpGet("availability")]
    public async Task<IActionResult> GetTeamAvailability()
    {
        try
        {
            // Get all developers with their current workload
            var developers = await _context.Users
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id &&
                           ur.Role != null && ur.Role.Name.Contains("Developer")))
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    department = u.Department != null ? u.Department : "",
                    currentTasksCount = _context.TaskAssignments
                        .Count(ta => ta.PrsId == u.Id &&
                              ta.Task != null &&
                              ta.Task.StatusId != Core.Enums.TaskStatus.Completed),
                    totalCapacity = 5, // Assuming 5 tasks max capacity
                    availableCapacity = 5 - _context.TaskAssignments
                        .Count(ta => ta.PrsId == u.Id &&
                              ta.Task != null &&
                              ta.Task.StatusId != Core.Enums.TaskStatus.Completed),
                    activeTasks = _context.TaskAssignments
                        .Where(ta => ta.PrsId == u.Id &&
                              ta.Task != null &&
                              ta.Task.StatusId != Core.Enums.TaskStatus.Completed)
                        .Select(ta => new
                        {
                            id = ta.Task!.Id,
                            name = ta.Task!.Name,
                            priority = ta.Task!.PriorityId,
                            endDate = ta.Task!.EndDate,
                            progress = ta.Task!.Progress
                        })
                        .ToList()
                })
                .ToListAsync();

            // Calculate team statistics
            var teamStats = new
            {
                totalDevelopers = developers.Count,
                availableDevelopers = developers.Count(d => d.availableCapacity > 0),
                overloadedDevelopers = developers.Count(d => d.currentTasksCount > 5),
                averageWorkload = developers.Any() ? developers.Average(d => d.currentTasksCount) : 0,
                totalAvailableCapacity = developers.Sum(d => Math.Max(0, d.availableCapacity))
            };

            return Ok(new
            {
                success = true,
                data = new
                {
                    developers,
                    teamStats
                },
                message = "Developer team availability retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving developer team availability",
                error = ex.Message
            });
        }
    }
}