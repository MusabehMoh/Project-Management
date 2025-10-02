//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using PMA.Infrastructure.Data;

//namespace PMA.Api.Controllers;

//[ApiController]
//[Route("api/requirement-overview")]
//public class RequirementOverviewController : ApiBaseController
//{
//    private readonly ApplicationDbContext _context;
//    private readonly ILogger<RequirementOverviewController> _logger;

//    public RequirementOverviewController(
//        ApplicationDbContext context,
//        ILogger<RequirementOverviewController> logger)
//    {
//        _context = context;
//        _logger = logger;
//    }

//    /// <summary>
//    /// Get requirement overview statistics for RequirementOverview component
//    /// Returns: new requirements, ongoing requirements, active requirements, and pending approvals
//    /// </summary>
//    [HttpGet("stats")]
//    public async Task<IActionResult> GetRequirementOverviewStats(
//        [FromQuery] int? analystId = null,
//        [FromQuery] int? projectId = null,
//        [FromQuery] string period = "month")
//    {
//        try
//        {
//            var today = DateTime.UtcNow.Date;
//            DateTime startDate;

//            // Determine the period for "new" requirements
//            switch (period.ToLower())
//            {
//                case "week":
//                    startDate = today.AddDays(-7);
//                    break;
//                case "quarter":
//                    startDate = today.AddMonths(-3);
//                    break;
//                case "year":
//                    startDate = today.AddYears(-1);
//                    break;
//                case "month":
//                default:
//                    startDate = today.AddMonths(-1);
//                    break;
//            }

//            // Base query for requirements
//            var requirementsQuery = _context.ProjectRequirements.AsQueryable();

//            // Filter by analyst if provided
//            if (analystId.HasValue)
//            {
//                requirementsQuery = requirementsQuery
//                    .Where(pr => _context.ProjectAnalysts
//                        .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == analystId.Value));
//            }

//            // Filter by project if provided
//            if (projectId.HasValue)
//            {
//                requirementsQuery = requirementsQuery.Where(pr => pr.ProjectId == projectId.Value);
//            }

//            // New requirements (created within the period)
//            var newRequirementsCount = await requirementsQuery
//                .Where(pr => pr.CreatedAt >= startDate && pr.CreatedAt <= today)
//                .CountAsync();

//            // Total requirements in period (for percentage calculation)
//            var totalRequirementsInPeriod = await requirementsQuery
//                .Where(pr => pr.CreatedAt >= startDate.AddMonths(-1) && pr.CreatedAt <= today)
//                .CountAsync();

//            // Calculate increase/decrease compared to previous period
//            var previousPeriodStart = startDate.AddMonths(-1);
//            var previousPeriodNewCount = await requirementsQuery
//                .Where(pr => pr.CreatedAt >= previousPeriodStart && pr.CreatedAt < startDate)
//                .CountAsync();

//            var newRequirementsChange = newRequirementsCount - previousPeriodNewCount;

//            // Ongoing requirements (in progress but not completed)
//            var ongoingRequirementsCount = await requirementsQuery
//                .Where(pr => pr.Status == "InProgress" || pr.Status == "In Progress")
//                .CountAsync();

//            // Total requirements for ongoing calculation
//            var totalOngoingInPeriod = await requirementsQuery
//                .Where(pr => (pr.Status == "InProgress" || pr.Status == "In Progress" ||
//                             pr.Status == "Completed") &&
//                            pr.UpdatedAt >= startDate)
//                .CountAsync();

//            // Previous period ongoing count
//            var previousOngoingCount = await requirementsQuery
//                .Where(pr => (pr.Status == "InProgress" || pr.Status == "In Progress") &&
//                            pr.UpdatedAt >= previousPeriodStart && pr.UpdatedAt < startDate)
//                .CountAsync();

//            var ongoingRequirementsChange = ongoingRequirementsCount - previousOngoingCount;

//            // Active requirements (not completed or cancelled)
//            var activeRequirements = await requirementsQuery
//                .Where(pr => pr.Status != "Completed" && 
//                            pr.Status != "Cancelled" &&
//                            pr.Status != "Rejected")
//                .CountAsync();

//            // Pending approvals (Draft or Pending status)
//            var pendingApprovals = await requirementsQuery
//                .Where(pr => pr.Status == "Draft" || pr.Status == "Pending")
//                .CountAsync();

//            // Additional useful stats
//            var completedThisPeriod = await requirementsQuery
//                .Where(pr => pr.Status == "Completed" &&
//                            pr.CompletedDate.HasValue &&
//                            pr.CompletedDate.Value >= startDate)
//                .CountAsync();

//            var overdue = await requirementsQuery
//                .Where(pr => pr.TargetDate.HasValue &&
//                            pr.TargetDate.Value < today &&
//                            pr.Status != "Completed" &&
//                            pr.Status != "Cancelled")
//                .CountAsync();

//            var stats = new
//            {
//                newRequirements = new
//                {
//                    count = newRequirementsCount,
//                    total = totalRequirementsInPeriod,
//                    increasedBy = newRequirementsChange,
//                    percentage = totalRequirementsInPeriod > 0 
//                        ? Math.Round((double)newRequirementsCount / totalRequirementsInPeriod * 100, 2) 
//                        : 0
//                },
//                ongoingRequirements = new
//                {
//                    count = ongoingRequirementsCount,
//                    total = totalOngoingInPeriod,
//                    increasedBy = ongoingRequirementsChange,
//                    percentage = totalOngoingInPeriod > 0 
//                        ? Math.Round((double)ongoingRequirementsCount / totalOngoingInPeriod * 100, 2) 
//                        : 0
//                },
//                activeRequirements,
//                pendingApprovals,
//                additionalStats = new
//                {
//                    completedThisPeriod,
//                    overdueRequirements = overdue,
//                    totalRequirements = await requirementsQuery.CountAsync()
//                },
//                period = new
//                {
//                    type = period,
//                    startDate,
//                    endDate = today
//                }
//            };

//            return Ok(new
//            {
//                success = true,
//                data = stats,
//                message = "Requirement overview stats retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving requirement overview stats");
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving requirement overview stats",
//                error = ex.Message
//            });
//        }
//    }

//    /// <summary>
//    /// Get requirement breakdown by status
//    /// </summary>
//    [HttpGet("status-breakdown")]
//    public async Task<IActionResult> GetRequirementStatusBreakdown(
//        [FromQuery] int? analystId = null,
//        [FromQuery] int? projectId = null)
//    {
//        try
//        {
//            // Base query for requirements
//            var requirementsQuery = _context.ProjectRequirements.AsQueryable();

//            // Filter by analyst if provided
//            if (analystId.HasValue)
//            {
//                requirementsQuery = requirementsQuery
//                    .Where(pr => _context.ProjectAnalysts
//                        .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == analystId.Value));
//            }

//            // Filter by project if provided
//            if (projectId.HasValue)
//            {
//                requirementsQuery = requirementsQuery.Where(pr => pr.ProjectId == projectId.Value);
//            }

//            var statusBreakdown = await requirementsQuery
//                .GroupBy(pr => pr.Status)
//                .Select(g => new
//                {
//                    status = g.Key,
//                    count = g.Count(),
//                    percentage = 0.0 // Will calculate after
//                })
//                .ToListAsync();

//            var total = statusBreakdown.Sum(s => s.count);
//            var breakdownWithPercentages = statusBreakdown.Select(s => new
//            {
//                s.status,
//                s.count,
//                percentage = total > 0 ? Math.Round((double)s.count / total * 100, 2) : 0
//            }).ToList();

//            return Ok(new
//            {
//                success = true,
//                data = breakdownWithPercentages,
//                total,
//                message = "Requirement status breakdown retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving requirement status breakdown");
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving requirement status breakdown",
//                error = ex.Message
//            });
//        }
//    }

//    /// <summary>
//    /// Get requirement breakdown by priority
//    /// </summary>
//    [HttpGet("priority-breakdown")]
//    public async Task<IActionResult> GetRequirementPriorityBreakdown(
//        [FromQuery] int? analystId = null,
//        [FromQuery] int? projectId = null,
//        [FromQuery] string? status = null)
//    {
//        try
//        {
//            // Base query for requirements
//            var requirementsQuery = _context.ProjectRequirements.AsQueryable();

//            // Filter by analyst if provided
//            if (analystId.HasValue)
//            {
//                requirementsQuery = requirementsQuery
//                    .Where(pr => _context.ProjectAnalysts
//                        .Any(pa => pa.ProjectId == pr.ProjectId && pa.AnalystId == analystId.Value));
//            }

//            // Filter by project if provided
//            if (projectId.HasValue)
//            {
//                requirementsQuery = requirementsQuery.Where(pr => pr.ProjectId == projectId.Value);
//            }

//            // Filter by status if provided
//            if (!string.IsNullOrEmpty(status))
//            {
//                requirementsQuery = requirementsQuery.Where(pr => pr.Status == status);
//            }

//            var priorityBreakdown = await requirementsQuery
//                .GroupBy(pr => pr.Priority)
//                .Select(g => new
//                {
//                    priority = g.Key,
//                    count = g.Count(),
//                    completed = g.Count(pr => pr.Status == "Completed"),
//                    inProgress = g.Count(pr => pr.Status == "InProgress" || pr.Status == "In Progress"),
//                    pending = g.Count(pr => pr.Status == "Pending" || pr.Status == "Draft")
//                })
//                .ToListAsync();

//            var total = priorityBreakdown.Sum(p => p.count);
//            var breakdownWithPercentages = priorityBreakdown.Select(p => new
//            {
//                p.priority,
//                p.count,
//                p.completed,
//                p.inProgress,
//                p.pending,
//                percentage = total > 0 ? Math.Round((double)p.count / total * 100, 2) : 0
//            }).ToList();

//            return Ok(new
//            {
//                success = true,
//                data = breakdownWithPercentages,
//                total,
//                message = "Requirement priority breakdown retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving requirement priority breakdown");
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving requirement priority breakdown",
//                error = ex.Message
//            });
//        }
//    }
//}
