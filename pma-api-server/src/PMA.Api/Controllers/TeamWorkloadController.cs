using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Enums;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/team-workload")]
public class TeamWorkloadController : ApiBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TeamWorkloadController> _logger;

    public TeamWorkloadController(
        ApplicationDbContext context,
        ILogger<TeamWorkloadController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get team workload performance metrics for all team members using RGIS business logic
    /// Returns: all team members with comprehensive workload metrics including availability status
    /// </summary>
    [HttpGet("performance")]
    public async Task<IActionResult> GetTeamWorkloadPerformance(
        [FromQuery] int? departmentId = null,
        [FromQuery] string? busyStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        try
        {
            // Apply RGIS business logic: Get all team members with comprehensive workload metrics
            var teamMembersQuery = from t in _context.Teams
                                   join me in _context.MawaredEmployees on t.PrsId equals me.Id
                                   join d in _context.Departments on t.DepartmentId equals d.Id
                                   where t.IsActive && me.StatusId == 1
                                   select new
                                   {
                                       EmployeeId = me.Id,
                                       FullName = me.FullName,
                                       GradeName = me.GradeName,
                                       Department = d.Name,
                                       DepartmentId = d.Id,

                                       // Availability Status - Available if no active tasks AND no active requirements
                                       AvailabilityStatus = (_context.TaskAssignments
                                           .Join(_context.Tasks,
                                               ta => ta.TaskId,
                                               task => task.Id,
                                               (ta, task) => new { ta, task })
                                           .Any(x => x.ta.PrsId == me.Id && new[] { 
                                               Core.Enums.TaskStatus.ToDo, 
                                               Core.Enums.TaskStatus.InProgress, 
                                               Core.Enums.TaskStatus.InReview, 
                                               Core.Enums.TaskStatus.Rework, 
                                               Core.Enums.TaskStatus.OnHold 
                                           }.Contains(x.task.StatusId)) == false)
                                       &&
                                       (_context.ProjectAnalysts
                                           .Join(_context.ProjectRequirements,
                                               pa => pa.ProjectId,
                                               pr => pr.ProjectId,
                                               (pa, pr) => new { pa, pr })
                                           .Any(x => x.pa.AnalystId == me.Id && new[] { 1, 2, 3, 4, 5 }.Contains((int)x.pr.Status)) == false)
                                       ? "Available" : "Busy",

                                       // Active Tasks Count
                                       ActiveTasks = _context.TaskAssignments
                                           .Join(_context.Tasks,
                                               ta => ta.TaskId,
                                               task => task.Id,
                                               (ta, task) => new { ta, task })
                                           .Count(x => x.ta.PrsId == me.Id && new[] { 
                                               Core.Enums.TaskStatus.ToDo, 
                                               Core.Enums.TaskStatus.InProgress, 
                                               Core.Enums.TaskStatus.InReview, 
                                               Core.Enums.TaskStatus.Rework, 
                                               Core.Enums.TaskStatus.OnHold 
                                           }.Contains(x.task.StatusId)),

                                       // Active Requirements Count
                                       ActiveRequirements = _context.ProjectAnalysts
                                           .Join(_context.ProjectRequirements,
                                               pa => pa.ProjectId,
                                               pr => pr.ProjectId,
                                               (pa, pr) => new { pa, pr })
                                           .Count(x => x.pa.AnalystId == me.Id && new[] { 1, 2, 3, 4, 5 }.Contains((int)x.pr.Status)),

                                       // Overdue Tasks
                                       OverdueTasks = _context.TaskAssignments
                                           .Join(_context.Tasks,
                                               ta => ta.TaskId,
                                               task => task.Id,
                                               (ta, task) => new { ta, task })
                                           .Count(x => x.ta.PrsId == me.Id &&
                                                     new[] { 
                                                         Core.Enums.TaskStatus.ToDo, 
                                                         Core.Enums.TaskStatus.InProgress, 
                                                         Core.Enums.TaskStatus.InReview, 
                                                         Core.Enums.TaskStatus.Rework, 
                                                         Core.Enums.TaskStatus.OnHold 
                                                     }.Contains(x.task.StatusId) &&
                                                     x.task.EndDate < DateTime.UtcNow)
                                   };

            // Apply department filter if provided
            if (departmentId.HasValue)
            {
                teamMembersQuery = teamMembersQuery.Where(x => x.DepartmentId == departmentId.Value);
            }

            // Apply busy status filter if provided
            if (!string.IsNullOrEmpty(busyStatus))
            {
                teamMembersQuery = teamMembersQuery.Where(x => x.AvailabilityStatus.ToLower() == busyStatus.ToLower());
            }

            // Execute query and get results
            var teamMetrics = await teamMembersQuery
                .OrderBy(x => x.AvailabilityStatus == "Available" ? 0 : 1)
                .ThenByDescending(x => x.ActiveTasks)
                .ThenByDescending(x => x.ActiveRequirements)
                .ToListAsync();

            // Calculate BusyUntil for each team member separately (post-query)
            var enrichedTeamMetrics = new List<object>();
            
            foreach (var member in teamMetrics)
            {
                DateTime? busyUntil = null;
                
                // Get max task end date
                var maxTaskDate = await _context.TaskAssignments
                    .Join(_context.Tasks,
                        ta => ta.TaskId,
                        task => task.Id,
                        (ta, task) => new { ta, task })
                    .Where(x => x.ta.PrsId == member.EmployeeId && new[] { 
                        Core.Enums.TaskStatus.ToDo, 
                        Core.Enums.TaskStatus.InProgress, 
                        Core.Enums.TaskStatus.InReview, 
                        Core.Enums.TaskStatus.Rework, 
                        Core.Enums.TaskStatus.OnHold 
                    }.Contains(x.task.StatusId))
                    .MaxAsync(x => (DateTime?)x.task.EndDate);

                // Get max requirement expected completion date
                var maxRequirementDate = await _context.ProjectAnalysts
                    .Join(_context.ProjectRequirements,
                        pa => pa.ProjectId,
                        pr => pr.ProjectId,
                        (pa, pr) => new { pa, pr })
                    .Where(x => x.pa.AnalystId == member.EmployeeId && 
                              new[] { 1, 2, 3, 4, 5 }.Contains((int)x.pr.Status))
                    .MaxAsync(x => x.pr.ExpectedCompletionDate);

                // Calculate overall max date
                if (maxTaskDate.HasValue && maxRequirementDate.HasValue)
                {
                    busyUntil = maxTaskDate > maxRequirementDate ? maxTaskDate : maxRequirementDate;
                }
                else if (maxTaskDate.HasValue)
                {
                    busyUntil = maxTaskDate;
                }
                else if (maxRequirementDate.HasValue)
                {
                    busyUntil = maxRequirementDate;
                }

                enrichedTeamMetrics.Add(new
                {
                    userId = member.EmployeeId,
                    fullName = member.FullName,
                    department = member.Department,
                    gradeName = member.GradeName ?? "Unknown",
                    busyStatus = member.AvailabilityStatus.ToLower(),
                    busyUntil = busyUntil?.ToString("o"),
                    metrics = new
                    {
                        totalRequirements = member.ActiveRequirements,
                        draft = 0, // Not calculated in original query
                        inProgress = member.ActiveRequirements,
                        completed = 0, // Not calculated in original query
                        performance = 0.0, // Not calculated in original query
                        activeTasks = member.ActiveTasks,
                        activeRequirements = member.ActiveRequirements,
                        overdueTasks = member.OverdueTasks
                    }
                });
            }

            // Apply pagination to enriched results
            var totalItems = enrichedTeamMetrics.Count;
            var totalPages = (int)Math.Ceiling(totalItems / (double)limit);
            var startIndex = (page - 1) * limit;
            var paginatedMetrics = enrichedTeamMetrics
                .Skip(startIndex)
                .Take(limit)
                .ToList();

            return Ok(new
            {
                success = true,
                data = paginatedMetrics,
                pagination = new
                {
                    page,
                    limit,
                    total = totalItems,
                    totalPages
                },
                message = "Team workload performance retrieved successfully using RGIS business logic"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving team workload performance");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving team workload performance",
                error = ex.Message
            });
        }
    }
}
