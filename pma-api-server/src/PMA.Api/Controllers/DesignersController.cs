using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.DTOs.Designers;
using PMA.Core.Enums;
using PMA.Infrastructure.Data;
using TaskStatus = PMA.Core.Enums.TaskStatus;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/designers")]
public class DesignersController : ApiBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DesignersController> _logger;
    private const int DesignDepartmentId = 3;

    public DesignersController(
        ApplicationDbContext context,
        ILogger<DesignersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get designer workload performance data with pagination and filtering
    /// </summary>
    [HttpGet("workload")]
    public async Task<IActionResult> GetWorkload(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string? searchQuery = null,
        [FromQuery] string? statusFilter = null,
        [FromQuery] string? sortBy = "efficiency",
        [FromQuery] string? sortOrder = "desc")
    {
        try
        {
            _logger.LogInformation(
                "Getting designer workload - Page: {Page}, PageSize: {PageSize}, Search: {Search}, Status: {Status}, SortBy: {SortBy}, SortOrder: {SortOrder}",
                page, pageSize, searchQuery, statusFilter, sortBy, sortOrder);

            // Get designers from Design Department (ID: 3) using Users table
            var query = _context.Users
                .Where(u => u.DepartmentId == DesignDepartmentId && u.IsVisible)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrEmpty(searchQuery))
            {
                query = query.Where(e =>
                    e.FullName.Contains(searchQuery) ||
                    e.MilitaryNumber.Contains(searchQuery) ||
                    e.GradeName.Contains(searchQuery));
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Get designers for current page
            var designers = await query
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Calculate workload data for each designer
            var designerWorkloads = new List<DesignerWorkloadDto>();

            foreach (var designer in designers)
            {
                // Get tasks assigned to this designer through TaskAssignments
                var taskAssignments = await _context.TaskAssignments
                    .Include(ta => ta.Task)
                    .Where(ta => ta.PrsId == designer.PrsId && ta.Task != null)
                    .ToListAsync();

                // Current tasks (not completed)
                var currentTasks = taskAssignments
                    .Where(ta => ta.Task!.StatusId != TaskStatus.Completed)
                    .Count();

                // Completed tasks
                var completedTasks = taskAssignments
                    .Where(ta => ta.Task!.StatusId == TaskStatus.Completed)
                    .Count();

                // Calculate average completion time (in hours)
                var completedTasksList = taskAssignments
                    .Where(ta => ta.Task!.StatusId == TaskStatus.Completed && ta.Task.ActualHours.HasValue)
                    .ToList();
                
                var avgCompletionTime = completedTasksList.Any()
                    ? completedTasksList.Average(ta => (double)(ta.Task!.ActualHours ?? 0))
                    : 0.0;

                // Calculate efficiency (completed vs total assigned)
                var totalAssigned = taskAssignments.Count;
                var efficiency = totalAssigned > 0
                    ? (double)completedTasks / totalAssigned * 100
                    : 0.0;

                // Calculate workload percentage (based on current tasks and estimated hours)
                var currentTasksList = taskAssignments
                    .Where(ta => ta.Task!.StatusId != TaskStatus.Completed)
                    .ToList();
                
                var totalEstimatedHours = currentTasksList
                    .Where(ta => ta.Task!.EstimatedHours.HasValue)
                    .Sum(ta => (double)(ta.Task!.EstimatedHours ?? 0));
                
                var workloadPercentage = Math.Min((totalEstimatedHours / 160.0) * 100.0, 100.0); // Assume 160 hours/month capacity

                // Available hours
                var availableHours = Math.Max(160.0 - totalEstimatedHours, 0.0);

                // Determine status based on workload
                var status = workloadPercentage switch
                {
                    >= 90 => "Busy",
                    >= 70 => "Busy",
                    <= 10 => "Available",
                    _ => "Available"
                };

                var workloadDto = new DesignerWorkloadDto
                {
                    PrsId = designer.PrsId,
                    DesignerName = designer.FullName,
                    GradeName = designer.GradeName,
                    CurrentTasksCount = currentTasks,
                    CompletedTasksCount = completedTasks,
                    AverageTaskCompletionTime = Math.Round(avgCompletionTime, 1),
                    Efficiency = Math.Round(efficiency, 1),
                    WorkloadPercentage = Math.Round(workloadPercentage, 1),
                    AvailableHours = Math.Round(availableHours, 1),
                    Status = status
                };

                designerWorkloads.Add(workloadDto);
            }

            // Apply status filter after calculation
            if (!string.IsNullOrEmpty(statusFilter) && statusFilter.ToLower() != "all")
            {
                designerWorkloads = designerWorkloads
                    .Where(d => d.Status.Equals(statusFilter, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            // Apply sorting
            designerWorkloads = sortBy?.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? designerWorkloads.OrderByDescending(d => d.DesignerName).ToList()
                    : designerWorkloads.OrderBy(d => d.DesignerName).ToList(),
                "workload" => sortOrder == "desc"
                    ? designerWorkloads.OrderByDescending(d => d.WorkloadPercentage).ToList()
                    : designerWorkloads.OrderBy(d => d.WorkloadPercentage).ToList(),
                "efficiency" => sortOrder == "desc"
                    ? designerWorkloads.OrderByDescending(d => d.Efficiency).ToList()
                    : designerWorkloads.OrderBy(d => d.Efficiency).ToList(),
                _ => sortOrder == "desc"
                    ? designerWorkloads.OrderByDescending(d => d.Efficiency).ToList()
                    : designerWorkloads.OrderBy(d => d.Efficiency).ToList()
            };

            var response = new DesignerWorkloadResponse
            {
                Designers = designerWorkloads,
                Pagination = new PaginationInfo
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalItems = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            };

            _logger.LogInformation("Successfully retrieved {Count} designers", designerWorkloads.Count);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting designer workload data");
            return StatusCode(500, new { message = "Error retrieving designer workload data", error = ex.Message });
        }
    }

    /// <summary>
    /// Get team-wide metrics for designer performance
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        try
        {
            _logger.LogInformation("Getting designer team metrics");

            // Get all designers from Design Department using Users table
            var designers = await _context.Users
                .Where(u => u.DepartmentId == DesignDepartmentId && u.IsVisible)
                .ToListAsync();

            var totalDesigners = designers.Count;
            var totalCompleted = 0;
            var totalInProgress = 0;
            var totalCompletionTime = 0.0;
            var completedTaskCount = 0;
            var activeDesignersCount = 0;
            var totalEfficiency = 0.0;

            foreach (var designer in designers)
            {
                var taskAssignments = await _context.TaskAssignments
                    .Include(ta => ta.Task)
                    .Where(ta => ta.PrsId == designer.PrsId && ta.Task != null)
                    .ToListAsync();

                var completed = taskAssignments
                    .Where(ta => ta.Task!.StatusId == TaskStatus.Completed)
                    .Count();

                var inProgress = taskAssignments
                    .Where(ta => ta.Task!.StatusId != TaskStatus.Completed)
                    .Count();

                totalCompleted += completed;
                totalInProgress += inProgress;

                // Calculate average completion time
                var completionTimes = taskAssignments
                    .Where(ta => ta.Task!.StatusId == TaskStatus.Completed && ta.Task.ActualHours.HasValue)
                    .Select(ta => (double)(ta.Task!.ActualHours ?? 0))
                    .ToList();

                if (completionTimes.Any())
                {
                    totalCompletionTime += completionTimes.Average();
                    completedTaskCount++;
                }

                // Calculate efficiency for this designer
                if (taskAssignments.Any())
                {
                    var efficiency = (double)completed / taskAssignments.Count * 100;
                    totalEfficiency += efficiency;
                    if (inProgress > 0)
                    {
                        activeDesignersCount++;
                    }
                }
            }

            var metrics = new TeamMetricsDto
            {
                TotalDesigners = totalDesigners,
                ActiveDesigners = activeDesignersCount,
                AverageEfficiency = totalDesigners > 0 ? Math.Round(totalEfficiency / totalDesigners, 1) : 0,
                TotalTasksCompleted = totalCompleted,
                TotalTasksInProgress = totalInProgress,
                AverageTaskCompletionTime = completedTaskCount > 0 ? Math.Round(totalCompletionTime / completedTaskCount, 1) : 0
            };

            _logger.LogInformation("Successfully retrieved team metrics");

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting designer team metrics");
            return StatusCode(500, new { message = "Error retrieving team metrics", error = ex.Message });
        }
    }
}
