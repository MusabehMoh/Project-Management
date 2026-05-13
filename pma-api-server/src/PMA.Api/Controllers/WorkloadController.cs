using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Api.Attributes;
using PMA.Core.DTOs.Common;
using PMA.Infrastructure.Data;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[RequireAdminOrPM]
public class WorkloadController : ApiBaseController
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<WorkloadController> _logger;

    public WorkloadController(ApplicationDbContext db, ILogger<WorkloadController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Get workload summary for all employees
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllWorkloads()
    {
        try
        {
            var now = DateTime.Now;

            var employeeWorkloads = await _db.TaskAssignments
                .Include(ta => ta.Employee)
                .Include(ta => ta.Task)
                .Where(ta => ta.Employee != null && ta.Task != null)
                .GroupBy(ta => new { ta.PrsId, ta.Employee!.FullName, ta.Employee.JobTitle })
                .Select(g => new EmployeeWorkloadDto
                {
                    EmployeeId = g.Key.PrsId,
                    FullName = g.Key.FullName ?? "",
                    JobTitle = g.Key.JobTitle ?? "",
                    TotalTasks = g.Count(),
                    ActiveTasks = g.Count(ta =>
                        ta.Task!.StatusId == TaskStatusEnum.InProgress ||
                        ta.Task.StatusId == TaskStatusEnum.ToDo),
                    CompletedTasks = g.Count(ta => ta.Task!.StatusId == TaskStatusEnum.Completed),
                    InReviewTasks = g.Count(ta => ta.Task!.StatusId == TaskStatusEnum.InReview),
                    OverdueTasks = g.Count(ta =>
                        ta.Task!.StatusId != TaskStatusEnum.Completed &&
                        ta.Task.EndDate < now),
                    CompletionRate = g.Count() == 0 ? 0 :
                        (int)(g.Count(ta => ta.Task!.StatusId == TaskStatusEnum.Completed) * 100.0 / g.Count()),
                    WorkloadLevel = CalculateWorkloadLevel(g.Count(ta =>
                        ta.Task!.StatusId == TaskStatusEnum.InProgress ||
                        ta.Task.StatusId == TaskStatusEnum.ToDo))
                })
                .OrderByDescending(e => e.ActiveTasks)
                .ToListAsync();

            return Success(employeeWorkloads, message: "Workload retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving workload");
            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get workload for a specific employee with task details
    /// </summary>
    [HttpGet("employee/{employeeId}")]
    public async Task<IActionResult> GetEmployeeWorkload(int employeeId)
    {
        try
        {
            var now = DateTime.Now;

            var employee = await _db.MawaredEmployees
                .FirstOrDefaultAsync(e => e.PrsId == employeeId);

            if (employee == null)
                return Error<object>("Employee not found", status: 404);

            var tasks = await _db.TaskAssignments
                .Include(ta => ta.Task)
                .Where(ta => ta.PrsId == employeeId && ta.Task != null)
                .Select(ta => new EmployeeTaskDto
                {
                    TaskId = ta.Task!.Id,
                    TaskName = ta.Task.Name,
                    Status = ta.Task.StatusId.ToString(),
                    Priority = ta.Task.PriorityId.ToString(),
                    Progress = ta.Task.Progress,
                    EndDate = ta.Task.EndDate,
                    IsOverdue = ta.Task.StatusId != TaskStatusEnum.Completed && ta.Task.EndDate < now
                })
                .ToListAsync();

            var profile = new EmployeePerformanceDto
            {
                EmployeeId = employeeId,
                FullName = employee.FullName ?? "",
                JobTitle = employee.JobTitle ?? "",
                TotalTasks = tasks.Count,
                CompletedTasks = tasks.Count(t => t.Status == "Completed"),
                ActiveTasks = tasks.Count(t => t.Status == "InProgress" || t.Status == "ToDo"),
                InReviewTasks = tasks.Count(t => t.Status == "InReview"),
                OverdueTasks = tasks.Count(t => t.IsOverdue),
                CompletionRate = tasks.Count == 0 ? 0 :
                    (int)(tasks.Count(t => t.Status == "Completed") * 100.0 / tasks.Count),
                OnTimeCompletionRate = tasks.Count(t => t.Status == "Completed") == 0 ? 0 :
                    (int)(tasks.Count(t => t.Status == "Completed" && !t.IsOverdue) * 100.0 /
                          tasks.Count(t => t.Status == "Completed")),
                Tasks = tasks
            };

            return Success(profile, message: "Employee performance retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving employee workload for {EmployeeId}", employeeId);
            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get overdue tasks across all employees
    /// </summary>
    [HttpGet("overdue")]
    public async Task<IActionResult> GetOverdueTasks()
    {
        try
        {
            var now = DateTime.Now;

            var overdueTasks = await _db.TaskAssignments
                .Include(ta => ta.Task)
                .Include(ta => ta.Employee)
                .Where(ta =>
                    ta.Task != null &&
                    ta.Task.StatusId != TaskStatusEnum.Completed &&
                    ta.Task.EndDate < now)
                .Select(ta => new
                {
                    TaskId = ta.Task!.Id,
                    TaskName = ta.Task.Name,
                    EmployeeId = ta.PrsId,
                    EmployeeName = ta.Employee != null ? ta.Employee.FullName : "",
                    EndDate = ta.Task.EndDate,
                    DaysOverdue = (int)(now - ta.Task.EndDate).TotalDays,
                    Status = ta.Task.StatusId.ToString(),
                    Priority = ta.Task.PriorityId.ToString()
                })
                .OrderByDescending(t => t.DaysOverdue)
                .ToListAsync();

            return Success(overdueTasks, message: "Overdue tasks retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving overdue tasks");
            return Error<object>("Internal server error", ex.Message);
        }
    }

    /// <summary>
    /// Get dashboard summary stats
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        try
        {
            var now = DateTime.Now;
            var weekEnd = now.AddDays(7);

            var totalProjects = await _db.Projects.CountAsync();
            var activeProjects = await _db.Projects
                .CountAsync(p => p.Status != PMA.Core.Enums.ProjectStatus.Production);

            var totalTasks = await _db.Tasks.CountAsync();
            var completedTasks = await _db.Tasks
                .CountAsync(t => t.StatusId == TaskStatusEnum.Completed);
            var overdueTasks = await _db.Tasks
                .CountAsync(t => t.StatusId != TaskStatusEnum.Completed && t.EndDate < now);
            var dueSoonTasks = await _db.Tasks
                .CountAsync(t => t.StatusId != TaskStatusEnum.Completed && t.EndDate >= now && t.EndDate <= weekEnd);

            var topOverloadedEmployees = await _db.TaskAssignments
                .Include(ta => ta.Employee)
                .Include(ta => ta.Task)
                .Where(ta => ta.Task != null &&
                    (ta.Task.StatusId == TaskStatusEnum.InProgress || ta.Task.StatusId == TaskStatusEnum.ToDo))
                .GroupBy(ta => new { ta.PrsId, ta.Employee!.FullName })
                .Select(g => new { g.Key.FullName, ActiveTasks = g.Count() })
                .OrderByDescending(e => e.ActiveTasks)
                .Take(5)
                .ToListAsync();

            return Success(new
            {
                Projects = new { Total = totalProjects, Active = activeProjects },
                Tasks = new
                {
                    Total = totalTasks,
                    Completed = completedTasks,
                    Overdue = overdueTasks,
                    DueSoon = dueSoonTasks,
                    CompletionRate = totalTasks == 0 ? 0 : (int)(completedTasks * 100.0 / totalTasks)
                },
                TopOverloadedEmployees = topOverloadedEmployees
            }, message: "Dashboard stats retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard stats");
            return Error<object>("Internal server error", ex.Message);
        }
    }

    private static string CalculateWorkloadLevel(int activeTasks) => activeTasks switch
    {
        0 => "Free",
        <= 2 => "Light",
        <= 4 => "Moderate",
        <= 6 => "Heavy",
        _ => "Overloaded"
    };
}

public class EmployeeWorkloadDto
{
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = "";
    public string JobTitle { get; set; } = "";
    public int TotalTasks { get; set; }
    public int ActiveTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InReviewTasks { get; set; }
    public int OverdueTasks { get; set; }
    public int CompletionRate { get; set; }
    public string WorkloadLevel { get; set; } = "";
}

public class EmployeePerformanceDto
{
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = "";
    public string JobTitle { get; set; } = "";
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int ActiveTasks { get; set; }
    public int InReviewTasks { get; set; }
    public int OverdueTasks { get; set; }
    public int CompletionRate { get; set; }
    public int OnTimeCompletionRate { get; set; }
    public List<EmployeeTaskDto> Tasks { get; set; } = new();
}

public class EmployeeTaskDto
{
    public int TaskId { get; set; }
    public string TaskName { get; set; } = "";
    public string Status { get; set; } = "";
    public string Priority { get; set; } = "";
    public int Progress { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsOverdue { get; set; }
}
