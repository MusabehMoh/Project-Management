using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Enums;
using PMA.Infrastructure.Data;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/requirement-completion")]
public class RequirementCompletionController : ApiBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RequirementCompletionController> _logger;

    public RequirementCompletionController(
        ApplicationDbContext context,
        ILogger<RequirementCompletionController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get requirement completion analytics including overdue and at-risk requirements
    /// For RequirementCompletionTracker component
    /// </summary>
    [HttpGet("analytics")]
    public async Task<IActionResult> GetCompletionAnalytics(
        [FromQuery] int? analystId = null,
        [FromQuery] int? projectId = null)
    {
        try
        {
            var today = DateTime.UtcNow.Date;

            // Base query for requirements
            var requirementsQuery = _context.ProjectRequirements
                .Include(pr => pr.Project)
                .AsQueryable();

            // Filter by analyst if provided
            if (analystId.HasValue)
            {
                requirementsQuery = requirementsQuery
                    .Where(pr => _context.ProjectAnalysts
                        .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == analystId.Value));
            }

            // Filter by project if provided
            if (projectId.HasValue)
            {
                requirementsQuery = requirementsQuery.Where(pr => pr.ProjectId == projectId.Value);
            }

            // Get overdue requirements (past deadline and not completed)
            var overdueRequirements = await requirementsQuery
                .Where(pr => pr.ExpectedCompletionDate.HasValue &&
                           pr.ExpectedCompletionDate.Value < today &&
                           pr.Status != RequirementStatusEnum.Completed &&
                           pr.Status != RequirementStatusEnum.Cancelled)
                .Select(pr => new
                {
                    requirementId = pr.Id,
                    requirementTitle = pr.Name,
                    projectId = pr.ProjectId,
                    projectName = pr.Project != null ? pr.Project.ApplicationName : "N/A",
                    priority = pr.Priority,
                    status = pr.Status,
                    ExpectedCompletionDate = pr.ExpectedCompletionDate,
                    daysOverdue = EF.Functions.DateDiffDay(pr.ExpectedCompletionDate!.Value, today),
                    assignedAnalyst = _context.ProjectAnalysts
                        .Where(pa => pa.ProjectId == pr.ProjectId)
                        .Select(pa => pa.Analyst != null ? pa.Analyst.FullName : "N/A")
                        .FirstOrDefault()
                })
                .OrderByDescending(r => r.daysOverdue)
                .ToListAsync();

            // Get at-risk requirements (due within 3 days)
            var atRiskRequirements = await requirementsQuery
                .Where(pr => pr.ExpectedCompletionDate.HasValue &&
                           pr.ExpectedCompletionDate.Value >= today &&
                           pr.ExpectedCompletionDate.Value <= today.AddDays(3) &&
                             pr.Status != RequirementStatusEnum.Completed &&
                           pr.Status != RequirementStatusEnum.Cancelled)
                .Select(pr => new
                {
                    requirementId = pr.Id,
                    requirementTitle = pr.Name,
                    projectId = pr.ProjectId,
                    projectName = pr.Project != null ? pr.Project.ApplicationName : "N/A",
                    priority = pr.Priority,
                    status = pr.Status,
                    ExpectedCompletionDate = pr.ExpectedCompletionDate,
                    daysUntilDeadline = EF.Functions.DateDiffDay(today, pr.ExpectedCompletionDate!.Value),
                    assignedAnalyst = _context.ProjectAnalysts
                        .Where(pa => pa.ProjectId == pr.ProjectId)
                        .Select(pa => pa.Analyst != null ? pa.Analyst.FullName : "N/A")
                        .FirstOrDefault()
                })
                .OrderBy(r => r.daysUntilDeadline)
                .ToListAsync();

            // Get completed requirements count
            var completedCount = await requirementsQuery
                .CountAsync(pr => pr.Status == RequirementStatusEnum.Completed);

            // Get total requirements count
            var totalCount = await requirementsQuery.CountAsync();

            // Get in-progress requirements count
            var inProgressCount = await requirementsQuery
                .CountAsync(pr => pr.Status == RequirementStatusEnum.UnderDevelopment );

            // Get pending requirements count
            var pendingCount = await requirementsQuery
                .CountAsync(pr => pr.Status == RequirementStatusEnum.New || pr.Status == RequirementStatusEnum.ManagerReview);

            // Calculate completion rate
            var completionRate = totalCount > 0 
                ? Math.Round((double)completedCount / totalCount * 100, 2) 
                : 0;

            // Calculate on-time completion rate (completed requirements that were completed before deadline)
            // Note: This assumes we have an actual completion date field, using ExpectedCompletionDate as placeholder
            var onTimeCompletedCount = await requirementsQuery
                .Where(pr => pr.Status == RequirementStatusEnum.Completed &&
                           pr.ExpectedCompletionDate.HasValue)
                .CountAsync();

            var onTimeRate = completedCount > 0 
                ? Math.Round((double)onTimeCompletedCount / completedCount * 100, 2) 
                : 0;

            // Calculate average delay days (simplified - using 0 as placeholder)
            var avgDelayDays = 0.0;

            var analytics = new
            {
                summary = new
                {
                    totalRequirements = totalCount,
                    completedRequirements = completedCount,
                    onTimeCompleted = onTimeCompletedCount,
                    onTimeRate = onTimeRate,
                    avgDelayDays = Math.Round(avgDelayDays, 2)
                },
                overdueItems = overdueRequirements,
                atRiskItems = atRiskRequirements
            };

            return Ok(new
            {
                success = true,
                data = analytics,
                message = "Requirement completion analytics retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving requirement completion analytics");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving requirement completion analytics",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get requirement completion metrics over time
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetCompletionMetrics(
        [FromQuery] string period = "month",
        [FromQuery] int? analystId = null,
        [FromQuery] int? projectId = null)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            DateTime startDate;

            // Determine the period
            switch (period.ToLower())
            {
                case "week":
                    startDate = today.AddDays(-7);
                    break;
                case "quarter":
                    startDate = today.AddMonths(-3);
                    break;
                case "year":
                    startDate = today.AddYears(-1);
                    break;
                case "month":
                default:
                    startDate = today.AddMonths(-1);
                    break;
            }

            // Base query for requirements
            var requirementsQuery = _context.ProjectRequirements
                .Include(pr => pr.Project)
                .AsQueryable();

            // Filter by analyst if provided
            if (analystId.HasValue)
            {
                requirementsQuery = requirementsQuery
                    .Where(pr => _context.ProjectAnalysts
                        .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == analystId.Value));
            }

            // Filter by project if provided
            if (projectId.HasValue)
            {
                requirementsQuery = requirementsQuery.Where(pr => pr.ProjectId == projectId.Value);
            }

            // Get completion trend data
            var completionTrend = await requirementsQuery
                .Where(pr => pr.ExpectedCompletionDate.HasValue &&
                           pr.ExpectedCompletionDate.Value >= startDate &&
                           pr.ExpectedCompletionDate.Value <= today)
                .GroupBy(pr => pr.ExpectedCompletionDate!.Value.Date)
                .Select(g => new
                {
                    date = g.Key,
                    count = g.Count(),
                    onTimeCount = g.Count(pr => pr.Status == RequirementStatusEnum.Completed)
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            // Get requirements created in period
            var createdInPeriod = await requirementsQuery
                .Where(pr => pr.CreatedAt >= startDate && pr.CreatedAt <= today)
                .CountAsync();

            // Get requirements completed in period
            var completedInPeriod = await requirementsQuery
                .Where(pr => pr.ExpectedCompletionDate.HasValue &&
                           pr.ExpectedCompletionDate.Value >= startDate &&
                           pr.ExpectedCompletionDate.Value <= today)
                .CountAsync();

            // Get on-time completed requirements in period
            var onTimeCompletedInPeriod = await requirementsQuery
                .Where(pr => pr.Status == RequirementStatusEnum.Completed &&
                           pr.ExpectedCompletionDate.HasValue &&
                           pr.ExpectedCompletionDate.Value >= startDate &&
                           pr.ExpectedCompletionDate.Value <= today)
                .CountAsync();

            // Calculate completion rate
            var completionRate = createdInPeriod > 0 
                ? Math.Round((double)completedInPeriod / createdInPeriod * 100, 2) 
                : 0;

            // Calculate on-time rate
            var onTimeRate = completedInPeriod > 0 
                ? Math.Round((double)onTimeCompletedInPeriod / completedInPeriod * 100, 2) 
                : 0;

            var metrics = new
            {
                period,
                startDate,
                endDate = today,
                totalRequirements = createdInPeriod,
                completedRequirements = completedInPeriod,
                onTimeCompleted = onTimeCompletedInPeriod,
                completionRate,
                onTimeRate
            };

            return Ok(new
            {
                success = true,
                data = metrics,
                message = "Requirement completion metrics retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving requirement completion metrics");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving requirement completion metrics",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get analyst-specific requirement completion performance
    /// </summary>
    [HttpGet("analyst-performance")]
    public async Task<IActionResult> GetAnalystPerformance(
        [FromQuery] int? analystId = null,
        [FromQuery] int top = 10)
    {
        try
        {
            var today = DateTime.UtcNow.Date;

            var analystQuery = _context.Users
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                           ur.Role != null && ur.Role.Name.Contains("Analyst")))
                .AsQueryable();

            if (analystId.HasValue)
            {
                analystQuery = analystQuery.Where(u => u.Id == analystId.Value);
            }

            var analystPerformance = await analystQuery
                .Select(u => new
                {
                    analystId = u.Id,
                    analystName = u.FullName,
                    department = u.Department != null ? u.Department.Name : "",
                    
                    totalRequirements = _context.ProjectRequirements
                        .Count(pr => _context.ProjectAnalysts
                            .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == u.Id)),
                    
                    completedRequirements = _context.ProjectRequirements
                        .Count(pr => pr.Status == RequirementStatusEnum.Completed &&
                                   _context.ProjectAnalysts
                                       .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == u.Id)),
                    
                    overdueRequirements = _context.ProjectRequirements
                        .Count(pr => pr.ExpectedCompletionDate.HasValue &&
                                   pr.ExpectedCompletionDate.Value < today &&
                                   pr.Status != RequirementStatusEnum.Completed &&
                                   pr.Status != RequirementStatusEnum.Cancelled &&
                                   _context.ProjectAnalysts
                                       .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == u.Id)),
                    
                    onTimeCompletions = _context.ProjectRequirements
                        .Count(pr => pr.Status == RequirementStatusEnum.Completed &&
                                   pr.ExpectedCompletionDate.HasValue &&
                                   _context.ProjectAnalysts
                                       .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == u.Id))
                })
                .ToListAsync();

            // Calculate performance metrics
            var performanceWithMetrics = analystPerformance
                .Select(ap => new
                {
                    ap.analystId,
                    ap.analystName,
                    ap.department,
                    ap.totalRequirements,
                    ap.completedRequirements,
                    ap.overdueRequirements,
                    ap.onTimeCompletions,
                    completionRate = ap.totalRequirements > 0 
                        ? Math.Round((double)ap.completedRequirements / ap.totalRequirements * 100, 2) 
                        : 0,
                    onTimeRate = ap.completedRequirements > 0 
                        ? Math.Round((double)ap.onTimeCompletions / ap.completedRequirements * 100, 2) 
                        : 0,
                    overdueRate = ap.totalRequirements > 0 
                        ? Math.Round((double)ap.overdueRequirements / ap.totalRequirements * 100, 2) 
                        : 0
                })
                .OrderByDescending(ap => ap.completionRate)
                .ThenByDescending(ap => ap.onTimeRate)
                .Take(top)
                .ToList();

            return Ok(new
            {
                success = true,
                data = performanceWithMetrics,
                count = performanceWithMetrics.Count,
                message = "Analyst performance retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving analyst performance");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving analyst performance",
                error = ex.Message
            });
        }
    }
}
