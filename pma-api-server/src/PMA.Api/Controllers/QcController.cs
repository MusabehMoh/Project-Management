using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.DTOs.QC;
using PMA.Core.Enums;
using PMA.Infrastructure.Data;
using TaskStatus = PMA.Core.Enums.TaskStatus;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/qc")]
public class QcController : ApiBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<QcController> _logger;
    private const int QualityAssuranceDepartmentId = 5;

    public QcController(
        ApplicationDbContext context,
        ILogger<QcController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get QC workload performance data with pagination and filtering
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
                "Getting QC workload - Page: {Page}, PageSize: {PageSize}, Search: {Search}, Status: {Status}, SortBy: {SortBy}, SortOrder: {SortOrder}",
                page, pageSize, searchQuery, statusFilter, sortBy, sortOrder);

            // Get QC members from Quality Assurance Department (ID: 5) using Teams table
            var query = _context.Teams
                .Include(t => t.Employee)
                .Where(t => t.DepartmentId == QualityAssuranceDepartmentId && t.IsActive)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrEmpty(searchQuery))
            {
                query = query.Where(t =>
                    (t.FullName != null && t.FullName.Contains(searchQuery)) ||
                    (t.Employee != null && t.Employee.MilitaryNumber.Contains(searchQuery)) ||
                    (t.Employee != null && t.Employee.GradeName.Contains(searchQuery)));
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Get QC members for current page
            var qcTeamMembers = await query
                .OrderBy(t => t.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Calculate workload data for each QC member
            var qcWorkloads = new List<QcWorkloadDto>();

            foreach (var qcMember in qcTeamMembers)
            {
                // Get tasks assigned to this QC member through TaskAssignments
                var taskAssignments = await _context.TaskAssignments
                    .Include(ta => ta.Task)
                    .Where(ta => ta.PrsId == qcMember.PrsId && ta.Task != null)
                    .ToListAsync();

                // Current tasks (not completed)
                var currentTasks = taskAssignments
                    .Where(ta => ta.Task!.StatusId != TaskStatus.Completed)
                    .Count();

                // Completed tasks
                var completedTasks = taskAssignments
                    .Where(ta => ta.Task!.StatusId == TaskStatus.Completed)
                    .Count();

                // Calculate average completion time (in days based on date range)
                var completedTasksList = taskAssignments
                    .Where(ta => ta.Task!.StatusId == TaskStatus.Completed)
                    .ToList();
                
                var avgCompletionTime = completedTasksList.Any()
                    ? completedTasksList.Average(ta => (ta.Task!.EndDate - ta.Task!.StartDate).TotalDays)
                    : 0.0;

                // Calculate efficiency (based on completion ratio but adjusted for current workload)
                var totalAssigned = taskAssignments.Count;
                var efficiency = 0.0;
                
                if (totalAssigned == 0)
                {
                    efficiency = 100.0; // No tasks assigned = perfect efficiency
                }
                else if (currentTasks == 0 && completedTasks > 0)
                {
                    efficiency = 100.0; // All tasks completed, none pending = perfect efficiency
                }
                else if (currentTasks == 0 && completedTasks == 0)
                {
                    efficiency = 100.0; // No tasks at all = available and efficient
                }
                else
                {
                    // Calculate efficiency based on completion rate adjusted by current load
                    var baseEfficiency = (double)completedTasks / totalAssigned * 100;
                    // Reduce efficiency if they have many current tasks (indicating potential delays)
                    var currentTaskPenalty = Math.Min(currentTasks * 10, 30); // Max 30% penalty for having many current tasks
                    efficiency = Math.Max(baseEfficiency - currentTaskPenalty, 0);
                }

                // Calculate workload percentage (based on current tasks' date ranges)
                var currentTasksList = taskAssignments
                    .Where(ta => ta.Task!.StatusId != TaskStatus.Completed)
                    .ToList();
                
                // Calculate total days from start to end dates for all current tasks
                var totalTaskDays = currentTasksList
                    .Sum(ta => 
                    {
                        var startDate = ta.Task!.StartDate;
                        var endDate = ta.Task!.EndDate;
                        return Math.Max((endDate - startDate).TotalDays, 1); // Minimum 1 day per task
                    });
                
                // Assume 30 working days per month capacity, calculate percentage
                var workloadPercentage = Math.Min((totalTaskDays / 30.0) * 100.0, 100.0);

                // Available days (remaining capacity)
                var availableDays = Math.Max(30.0 - totalTaskDays, 0.0);
                var availableHours = availableDays * 8.0; // Convert to hours (8 hours per day)

                // Determine status based on current tasks count and workload percentage
                var status = currentTasks switch
                {
                    0 => "available",
                    1 when workloadPercentage < 50 => "light",
                    _ when workloadPercentage >= 90 => "overloaded",
                    _ when workloadPercentage >= 70 => "busy",
                    _ when currentTasks >= 3 => "busy",
                    _ => "light"
                };

                var workloadDto = new QcWorkloadDto
                {
                    PrsId = qcMember.PrsId ?? 0,
                    QcName = qcMember.FullName ?? string.Empty,
                    GradeName = qcMember.Employee?.GradeName ?? string.Empty,
                    CurrentTasksCount = currentTasks,
                    CompletedTasksCount = completedTasks,
                    AverageTaskCompletionTime = Math.Round(avgCompletionTime, 1),
                    Efficiency = Math.Round(efficiency, 1),
                    WorkloadPercentage = Math.Round(workloadPercentage, 1),
                    AvailableHours = Math.Round(availableHours, 1),
                    Status = status
                };

                qcWorkloads.Add(workloadDto);
            }

            // Apply status filter after calculation
            if (!string.IsNullOrEmpty(statusFilter) && statusFilter.ToLower() != "all")
            {
                qcWorkloads = qcWorkloads
                    .Where(d => d.Status.Equals(statusFilter, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            // Apply sorting
            qcWorkloads = sortBy?.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? qcWorkloads.OrderByDescending(d => d.QcName).ToList()
                    : qcWorkloads.OrderBy(d => d.QcName).ToList(),
                "workload" => sortOrder == "desc"
                    ? qcWorkloads.OrderByDescending(d => d.WorkloadPercentage).ToList()
                    : qcWorkloads.OrderBy(d => d.WorkloadPercentage).ToList(),
                "efficiency" => sortOrder == "desc"
                    ? qcWorkloads.OrderByDescending(d => d.Efficiency).ToList()
                    : qcWorkloads.OrderBy(d => d.Efficiency).ToList(),
                _ => sortOrder == "desc"
                    ? qcWorkloads.OrderByDescending(d => d.Efficiency).ToList()
                    : qcWorkloads.OrderBy(d => d.Efficiency).ToList()
            };

            var response = new QcWorkloadResponse
            {
                QcMembers = qcWorkloads,
                Pagination = new PaginationInfo
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalItems = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            };

            _logger.LogInformation("Successfully retrieved {Count} QC members", qcWorkloads.Count);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting QC workload data");
            return StatusCode(500, new { message = "Error retrieving QC workload data", error = ex.Message });
        }
    }

    /// <summary>
    /// Get team-wide metrics for QC performance
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        try
        {
            _logger.LogInformation("Getting QC team metrics");

            // Get all QC members from Quality Assurance Department using Teams table
            var qcMembers = await _context.Teams
                .Include(t => t.Employee)
                .Where(t => t.DepartmentId == QualityAssuranceDepartmentId && t.IsActive)
                .ToListAsync();

            var totalQcMembers = qcMembers.Count;
            var totalCompleted = 0;
            var totalInProgress = 0;
            var totalCompletionTime = 0.0;
            var completedTaskCount = 0;
            var activeQcMembersCount = 0;
            var totalEfficiency = 0.0;

            foreach (var qcMember in qcMembers)
            {
                var taskAssignments = await _context.TaskAssignments
                    .Include(ta => ta.Task)
                    .Where(ta => ta.PrsId == qcMember.PrsId && ta.Task != null)
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
                    .Where(ta => ta.Task!.StatusId == TaskStatus.Completed)
                    .Select(ta => (ta.Task!.EndDate - ta.Task!.StartDate).TotalDays)
                    .ToList();

                if (completionTimes.Any())
                {
                    totalCompletionTime += completionTimes.Average();
                    completedTaskCount++;
                }

                // Calculate efficiency for this QC member
                if (taskAssignments.Any())
                {
                    var efficiency = (double)completed / taskAssignments.Count * 100;
                    totalEfficiency += efficiency;
                    if (inProgress > 0)
                    {
                        activeQcMembersCount++;
                    }
                }
            }

            var metrics = new QcTeamMetricsDto
            {
                TotalQcMembers = totalQcMembers,
                ActiveQcMembers = activeQcMembersCount,
                AverageEfficiency = totalQcMembers > 0 ? Math.Round(totalEfficiency / totalQcMembers, 1) : 0,
                TotalTasksCompleted = totalCompleted,
                TotalTasksInProgress = totalInProgress,
                AverageTaskCompletionTime = completedTaskCount > 0 ? Math.Round(totalCompletionTime / completedTaskCount, 1) : 0
            };

            _logger.LogInformation("Successfully retrieved QC team metrics");

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting QC team metrics");
            return StatusCode(500, new { message = "Error retrieving QC team metrics", error = ex.Message });
        }
    }
}