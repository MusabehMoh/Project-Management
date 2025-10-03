//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using PMA.Infrastructure.Data;

//namespace PMA.Api.Controllers;

//[ApiController]
//[Route("api/dashboard-stats")]
//public class DashboardStatsController : ApiBaseController
//{
//    private readonly ApplicationDbContext _context;

//    public DashboardStatsController(ApplicationDbContext context)
//    {
//        _context = context;
//    }

//    /// <summary>
//    /// Get dashboard statistics for ModernQuickStats component
//    /// Returns: active projects, total tasks, in-progress tasks, overdue tasks
//    /// </summary>
//    [HttpGet]
//    public async Task<IActionResult> GetDashboardStats()
//    {
//        try
//        {
//            var today = DateTime.UtcNow.Date;

//            // Active projects count (Planning, In Progress, Testing statuses)
//            var activeProjectsCount = await _context.Projects
//                .Where(p => p.Status == Core.Entities.ProjectStatus.Planning ||
//                           p.Status == Core.Entities.ProjectStatus.InProgress ||
//                           p.Status == Core.Entities.ProjectStatus.Testing)
//                .CountAsync();

//            // Total tasks count (all tasks)
//            var totalTasksCount = await _context.Tasks.CountAsync();

//            // In progress tasks count
//            var inProgressTasksCount = await _context.Tasks
//                .Where(t => t.StatusId == Core.Entities.TaskStatus.InProgress)
//                .CountAsync();

//            // Overdue tasks count (tasks where EndDate < today and status is not Completed or Cancelled)
//            var overdueTasksCount = await _context.Tasks
//                .Where(t => t.EndDate < today &&
//                           t.StatusId != Core.Entities.TaskStatus.Completed &&
//                           t.StatusId != Core.Entities.TaskStatus.Cancelled)
//                .CountAsync();

//            var stats = new
//            {
//                activeProjects = activeProjectsCount,
//                totalTasks = totalTasksCount,
//                inProgress = inProgressTasksCount,
//                overdue = overdueTasksCount
//            };

//            return Ok(new
//            {
//                success = true,
//                data = stats,
//                message = "Dashboard stats retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving dashboard stats",
//                error = ex.Message
//            });
//        }
//    }

//    /// <summary>
//    /// Get detailed dashboard statistics with additional metrics
//    /// </summary>
//    [HttpGet("detailed")]
//    public async Task<IActionResult> GetDetailedDashboardStats()
//    {
//        try
//        {
//            var today = DateTime.UtcNow.Date;

//            // Projects breakdown by status
//            var projectsByStatus = await _context.Projects
//                .GroupBy(p => p.Status)
//                .Select(g => new
//                {
//                    status = g.Key.ToString(),
//                    count = g.Count()
//                })
//                .ToListAsync();

//            // Tasks breakdown by status
//            var tasksByStatus = await _context.Tasks
//                .GroupBy(t => t.StatusId)
//                .Select(g => new
//                {
//                    status = g.Key.ToString(),
//                    count = g.Count()
//                })
//                .ToListAsync();

//            // Tasks breakdown by priority
//            var tasksByPriority = await _context.Tasks
//                .GroupBy(t => t.PriorityId)
//                .Select(g => new
//                {
//                    priority = g.Key.ToString(),
//                    count = g.Count()
//                })
//                .ToListAsync();

//            // Upcoming deadlines (tasks due in next 7 days)
//            var upcomingDeadlinesCount = await _context.Tasks
//                .Where(t => t.EndDate >= today &&
//                           t.EndDate <= today.AddDays(7) &&
//                           t.StatusId != Core.Entities.TaskStatus.Completed &&
//                           t.StatusId != Core.Entities.TaskStatus.Cancelled)
//                .CountAsync();

//            // Requirements stats
//            var requirementsStats = new
//            {
//                total = await _context.Requirements.CountAsync(),
//                pending = await _context.Requirements
//                    .Where(r => r.Status == Core.Entities.RequirementStatus.Pending)
//                    .CountAsync(),
//                approved = await _context.Requirements
//                    .Where(r => r.Status == Core.Entities.RequirementStatus.Approved)
//                    .CountAsync(),
//                completed = await _context.Requirements
//                    .Where(r => r.Status == Core.Entities.RequirementStatus.Completed)
//                    .CountAsync()
//            };

//            return Ok(new
//            {
//                success = true,
//                data = new
//                {
//                    projectsByStatus,
//                    tasksByStatus,
//                    tasksByPriority,
//                    upcomingDeadlines = upcomingDeadlinesCount,
//                    requirements = requirementsStats
//                },
//                message = "Detailed dashboard stats retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving detailed dashboard stats",
//                error = ex.Message
//            });
//        }
//    }
//}
