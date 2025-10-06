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
    /// Get team workload performance metrics for all team members
    /// Returns: workload, busy status, performance scores, and task counts
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
            // Get all employees (team members) with their teams and departments
            var employeesQuery = _context.MawaredEmployees
                .Include(e => e.User)
                .Join(_context.Teams,
                    e => e.Id,
                    t => t.PrsId,
                    (e, t) => new { Employee = e, Team = t })
                .Join(_context.Departments,
                    et => et.Team.DepartmentId,
                    d => d.Id,
                    (et, d) => new { et.Employee, et.Team, Department = d })
                .AsQueryable();

            // Apply department filter if provided
            if (departmentId.HasValue)
            {
                employeesQuery = employeesQuery.Where(etd => etd.Department.Id == departmentId.Value);
            }

            // Get all employees for processing
            var employeeData = await employeesQuery.ToListAsync();

            var teamMetrics = new List<object>();

            foreach (var data in employeeData)
            {
                var employee = data.Employee;
                var department = data.Department;

                // Get requirements assigned to this employee
                var assignedRequirements = await _context.ProjectRequirements
                    .Where(pr => pr.CreatedBy == employee.Id || pr.AssignedAnalyst == employee.Id)
                    .ToListAsync();

                // Calculate requirement metrics
                var totalRequirements = assignedRequirements.Count;
                var draftRequirements = assignedRequirements.Count(r => r.Status == RequirementStatusEnum.New);
                var inProgressRequirements = assignedRequirements.Count(r => r.Status == RequirementStatusEnum.ManagerReview ||
                                                                            r.Status == RequirementStatusEnum.UnderDevelopment ||
                                                                            r.Status == RequirementStatusEnum.UnderTesting);
                var completedRequirements = assignedRequirements.Count(r => r.Status == RequirementStatusEnum.Completed);

                // Calculate performance score (simple algorithm)
                var performance = 0.0;
                if (totalRequirements > 0)
                {
                    var completionRate = (double)completedRequirements / totalRequirements;
                    var efficiency = totalRequirements > 0 ? (completedRequirements * 100.0) / totalRequirements : 0;
                    performance = Math.Min(efficiency, 100.0);
                }

                // Determine busy status based on current workload
                var busyStatusValue = "available";
                DateTime? busyUntil = null;

                if (inProgressRequirements > 3)
                {
                    busyStatusValue = "busy";
                    // Estimate busy until date (rough calculation)
                    busyUntil = DateTime.UtcNow.AddDays(inProgressRequirements - 2);
                }

                // Apply busy status filter if provided
                if (!string.IsNullOrEmpty(busyStatus) && busyStatusValue != busyStatus)
                {
                    continue; // Skip this employee if status doesn't match filter
                }

                teamMetrics.Add(new
                {
                    userId = employee.Id,
                    fullName = employee.FullName,
                    department = department.Name,
                    gradeName = employee.GradeName ?? "Unknown",
                    busyStatus = busyStatusValue,
                    busyUntil = busyUntil?.ToString("o"), // ISO 8601 format
                    metrics = new
                    {
                        totalRequirements,
                        draft = draftRequirements,
                        inProgress = inProgressRequirements,
                        completed = completedRequirements,
                        performance = Math.Round(performance, 2)
                    }
                });
            }

            // Apply pagination
            var totalItems = teamMetrics.Count;
            var totalPages = (int)Math.Ceiling(totalItems / (double)limit);
            var startIndex = (page - 1) * limit;
            var paginatedMetrics = teamMetrics
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
                message = "Team workload performance retrieved successfully"
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
