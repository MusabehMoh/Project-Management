//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using PMA.Infrastructure.Data;

//namespace PMA.Api.Controllers;

//[ApiController]
//[Route("api/pipeline")]
//public class PipelineController : ApiBaseController
//{
//    private readonly ApplicationDbContext _context;
//    private readonly ILogger<PipelineController> _logger;

//    public PipelineController(
//        ApplicationDbContext context,
//        ILogger<PipelineController> logger)
//    {
//        _context = context;
//        _logger = logger;
//    }

//    /// <summary>
//    /// Get project pipeline data grouped by status (planning, in-progress, completed)
//    /// For ProjectPipeline component
//    /// </summary>
//    [HttpGet("projects")]
//    public async Task<IActionResult> GetPipelineProjects()
//    {
//        try
//        {
//            var today = DateTime.Now;

//            // Get all projects with their requirements data
//            var allProjects = await _context.Projects
//                .Include(p => p.Owner)
//                .Include(p => p.OwningUnit)
//                .Where(p => p.Status != Core.Entities.ProjectStatus.Cancelled)
//                .Select(p => new
//                {
//                    id = p.Id,
//                    applicationName = p.ApplicationName,
//                    projectOwner = p.ProjectOwner,
//                    owningUnit = p.OwningUnit.Name,
//                    owningUnitId = p.OwningUnitId,
//                    status = p.Status,
//                    startDate = p.StartDate,
//                    expectedCompletionDate = p.ExpectedCompletionDate,
//                    lastActivity = p.UpdatedAt ?? p.CreatedAt,
                    
//                    // Requirements count
//                    requirementsCount = _context.ProjectRequirements
//                        .Count(pr => pr.ProjectId == p.Id),
                    
//                    // Completed requirements count
//                    completedRequirements = _context.ProjectRequirements
//                        .Count(pr => pr.ProjectId == p.Id && 
//                              (pr.Status == "Completed" || pr.Status == "Approved")),
                    
//                    // Analysts assigned
//                    analystsCount = _context.ProjectAnalysts
//                        .Count(pa => pa.ProjectId == p.Id),
                    
//                    // Active tasks count
//                    activeTasksCount = _context.Tasks
//                        .Count(t => t.ProjectRequirement != null && 
//                               t.ProjectRequirement.ProjectId == p.Id &&
//                               t.StatusId != Core.Entities.TaskStatus.Completed &&
//                               t.StatusId != Core.Entities.TaskStatus.Cancelled)
//                })
//                .ToListAsync();

//            // Group projects by status
//            var planning = allProjects
//                .Where(p => p.status == Core.Entities.ProjectStatus.Planning)
//                .Select(p => new
//                {
//                    p.id,
//                    p.applicationName,
//                    p.projectOwner,
//                    p.owningUnit,
//                    p.owningUnitId,
//                    status = p.status.ToString(),
//                    p.startDate,
//                    p.expectedCompletionDate,
//                    p.lastActivity,
//                    p.requirementsCount,
//                    p.completedRequirements,
//                    p.analystsCount,
//                    p.activeTasksCount,
//                    completionPercentage = p.requirementsCount > 0 
//                        ? Math.Round((double)p.completedRequirements / p.requirementsCount * 100, 2) 
//                        : 0
//                })
//                .OrderByDescending(p => p.startDate)
//                .ToList();

//            var inProgress = allProjects
//                .Where(p => p.status == Core.Entities.ProjectStatus.InProgress || 
//                           p.status == Core.Entities.ProjectStatus.Testing)
//                .Select(p => new
//                {
//                    p.id,
//                    p.applicationName,
//                    p.projectOwner,
//                    p.owningUnit,
//                    p.owningUnitId,
//                    status = p.status.ToString(),
//                    p.startDate,
//                    p.expectedCompletionDate,
//                    p.lastActivity,
//                    p.requirementsCount,
//                    p.completedRequirements,
//                    p.analystsCount,
//                    p.activeTasksCount,
//                    completionPercentage = p.requirementsCount > 0 
//                        ? Math.Round((double)p.completedRequirements / p.requirementsCount * 100, 2) 
//                        : 0
//                })
//                .OrderByDescending(p => p.lastActivity)
//                .ToList();

//            var completed = allProjects
//                .Where(p => p.status == Core.Entities.ProjectStatus.Completed)
//                .Select(p => new
//                {
//                    p.id,
//                    p.applicationName,
//                    p.projectOwner,
//                    p.owningUnit,
//                    p.owningUnitId,
//                    status = p.status.ToString(),
//                    p.startDate,
//                    p.expectedCompletionDate,
//                    p.lastActivity,
//                    p.requirementsCount,
//                    p.completedRequirements,
//                    p.analystsCount,
//                    p.activeTasksCount,
//                    completionPercentage = 100.0
//                })
//                .OrderByDescending(p => p.lastActivity)
//                .ToList();

//            return Ok(new
//            {
//                success = true,
//                data = new
//                {
//                    planning,
//                    inProgress,
//                    completed
//                },
//                summary = new
//                {
//                    planningCount = planning.Count,
//                    inProgressCount = inProgress.Count,
//                    completedCount = completed.Count,
//                    totalProjects = planning.Count + inProgress.Count + completed.Count
//                },
//                message = "Pipeline projects retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving pipeline projects");
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving pipeline projects",
//                error = ex.Message
//            });
//        }
//    }

//    /// <summary>
//    /// Get project pipeline summary statistics
//    /// </summary>
//    [HttpGet("summary")]
//    public async Task<IActionResult> GetPipelineSummary()
//    {
//        try
//        {
//            var today = DateTime.Now.Date;

//            var summary = new
//            {
//                // Project counts by status
//                planningCount = await _context.Projects
//                    .CountAsync(p => p.Status == Core.Entities.ProjectStatus.Planning),
                
//                inProgressCount = await _context.Projects
//                    .CountAsync(p => p.Status == Core.Entities.ProjectStatus.InProgress),
                
//                testingCount = await _context.Projects
//                    .CountAsync(p => p.Status == Core.Entities.ProjectStatus.Testing),
                
//                completedCount = await _context.Projects
//                    .CountAsync(p => p.Status == Core.Entities.ProjectStatus.Completed),
                
//                cancelledCount = await _context.Projects
//                    .CountAsync(p => p.Status == Core.Entities.ProjectStatus.Cancelled),
                
//                // Overdue projects
//                overdueProjects = await _context.Projects
//                    .CountAsync(p => p.ExpectedCompletionDate < today &&
//                               p.Status != Core.Entities.ProjectStatus.Completed &&
//                               p.Status != Core.Entities.ProjectStatus.Cancelled),
                
//                // At-risk projects (due within 7 days)
//                atRiskProjects = await _context.Projects
//                    .CountAsync(p => p.ExpectedCompletionDate >= today &&
//                               p.ExpectedCompletionDate <= today.AddDays(7) &&
//                               p.Status != Core.Entities.ProjectStatus.Completed &&
//                               p.Status != Core.Entities.ProjectStatus.Cancelled),
                
//                // Total requirements across all projects
//                totalRequirements = await _context.ProjectRequirements.CountAsync(),
                
//                // Completed requirements
//                completedRequirements = await _context.ProjectRequirements
//                    .CountAsync(pr => pr.Status == "Completed" || pr.Status == "Approved"),
                
//                // Overall completion rate
//                overallCompletionRate = await CalculateOverallCompletionRate()
//            };

//            return Ok(new
//            {
//                success = true,
//                data = summary,
//                message = "Pipeline summary retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving pipeline summary");
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving pipeline summary",
//                error = ex.Message
//            });
//        }
//    }

//    /// <summary>
//    /// Get project pipeline filtered by unit
//    /// </summary>
//    [HttpGet("by-unit/{unitId}")]
//    public async Task<IActionResult> GetPipelineByUnit(int unitId)
//    {
//        try
//        {
//            // Verify unit exists
//            var unitExists = await _context.Units.AnyAsync(u => u.Id == unitId);
//            if (!unitExists)
//            {
//                return NotFound(new
//                {
//                    success = false,
//                    message = "Unit not found"
//                });
//            }

//            var allProjects = await _context.Projects
//                .Include(p => p.Owner)
//                .Include(p => p.OwningUnit)
//                .Where(p => p.OwningUnitId == unitId && 
//                           p.Status != Core.Entities.ProjectStatus.Cancelled)
//                .Select(p => new
//                {
//                    id = p.Id,
//                    applicationName = p.ApplicationName,
//                    projectOwner = p.ProjectOwner,
//                    owningUnit = p.OwningUnit.Name,
//                    status = p.Status.ToString(),
//                    startDate = p.StartDate,
//                    expectedCompletionDate = p.ExpectedCompletionDate,
//                    lastActivity = p.UpdatedAt ?? p.CreatedAt,
//                    requirementsCount = _context.ProjectRequirements
//                        .Count(pr => pr.ProjectId == p.Id),
//                    completedRequirements = _context.ProjectRequirements
//                        .Count(pr => pr.ProjectId == p.Id && 
//                              (pr.Status == "Completed" || pr.Status == "Approved"))
//                })
//                .ToListAsync();

//            // Group by status
//            var planning = allProjects
//                .Where(p => p.status == Core.Entities.ProjectStatus.Planning.ToString())
//                .ToList();
            
//            var inProgress = allProjects
//                .Where(p => p.status == Core.Entities.ProjectStatus.InProgress.ToString() ||
//                           p.status == Core.Entities.ProjectStatus.Testing.ToString())
//                .ToList();
            
//            var completed = allProjects
//                .Where(p => p.status == Core.Entities.ProjectStatus.Completed.ToString())
//                .ToList();

//            return Ok(new
//            {
//                success = true,
//                data = new
//                {
//                    unitId,
//                    planning,
//                    inProgress,
//                    completed
//                },
//                message = "Unit pipeline projects retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving pipeline projects for unit {UnitId}", unitId);
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving unit pipeline projects",
//                error = ex.Message
//            });
//        }
//    }

//    private async Task<double> CalculateOverallCompletionRate()
//    {
//        var totalRequirements = await _context.ProjectRequirements.CountAsync();
//        if (totalRequirements == 0)
//            return 0;

//        var completedRequirements = await _context.ProjectRequirements
//            .CountAsync(pr => pr.Status == "Completed" || pr.Status == "Approved");

//        return Math.Round((double)completedRequirements / totalRequirements * 100, 2);
//    }
//}
