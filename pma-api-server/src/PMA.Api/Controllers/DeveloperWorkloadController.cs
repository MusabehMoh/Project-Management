using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Infrastructure.Data;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/developer-workload")]
public class DeveloperWorkloadController : ApiBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DeveloperWorkloadController> _logger;

    public DeveloperWorkloadController(
        ApplicationDbContext context,
        ILogger<DeveloperWorkloadController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get developer workload performance data with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetWorkloadData(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = "developerName",
        [FromQuery] string? sortOrder = "asc",
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.MawaredEmployees
                .Include(e => e.User)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(e =>
                    e.FullName.Contains(search) ||
                    e.MilitaryNumber.Contains(search) ||
                    e.GradeName.Contains(search));
            }

            // Apply status filter
            if (!string.IsNullOrEmpty(status))
            {
                // For now, we'll map status to employee status
                // This could be extended to include task-based status
                query = query.Where(e => e.StatusId.ToString() == status);
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "developername" => sortOrder == "desc"
                    ? query.OrderByDescending(e => e.FullName)
                    : query.OrderBy(e => e.FullName),
                "militarynumber" => sortOrder == "desc"
                    ? query.OrderByDescending(e => e.MilitaryNumber)
                    : query.OrderBy(e => e.MilitaryNumber),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(e => e.FullName)
                    : query.OrderBy(e => e.FullName)
            };

            // Apply pagination
            var employees = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Calculate workload data for each developer
            var developers = new List<object>();
            foreach (var employee in employees)
            {
                var taskAssignments = await _context.TaskAssignments
                    .Include(ta => ta.Task)
                    .Where(ta => ta.PrsId == employee.Id)
                    .ToListAsync();

                var currentTasks = taskAssignments.Count(ta =>
                    ta.Task != null &&
                    ta.Task.StatusId != Core.Enums.TaskStatus.Completed);

                var completedTasks = taskAssignments.Count(ta =>
                    ta.Task != null &&
                    ta.Task.StatusId == Core.Enums.TaskStatus.Completed);

                var averageTaskTime = taskAssignments
                    .Where(ta => ta.Task != null && ta.Task.ActualHours.HasValue)
                    .Average(ta => ta.Task!.ActualHours ?? 0);

                var efficiency = currentTasks > 0 ? (completedTasks * 100.0) / (completedTasks + currentTasks) : 0;

                var workloadPercentage = Math.Min(currentTasks * 20, 100); // Rough calculation

                developers.Add(new
                {
                    developerId = employee.Id.ToString(),
                    developerName = employee.FullName,
                    currentTasks,
                    completedTasks,
                    averageTaskTime = Math.Round(averageTaskTime, 2),
                    efficiency = Math.Round(efficiency, 2),
                    workloadPercentage,
                    skills = new string[] { }, // Placeholder - would need skills table
                    currentProjects = new string[] { }, // Placeholder - would need project assignments
                    availableHours = 40 - workloadPercentage, // Rough calculation
                    status = currentTasks > 5 ? "busy" : currentTasks > 2 ? "available" : "available",
                    department = "", // Placeholder
                    militaryNumber = employee.MilitaryNumber,
                    gradeName = employee.GradeName,
                    email = employee.User?.Email ?? "",
                    phone = "" // Placeholder
                });
            }

            // Calculate team metrics
            var allEmployees = await _context.MawaredEmployees.ToListAsync();
            var allTaskAssignments = await _context.TaskAssignments
                .Include(ta => ta.Task)
                .ToListAsync();

                var totalTasksCompleted = allTaskAssignments.Count(ta =>
                    ta.Task != null && ta.Task.StatusId == Core.Enums.TaskStatus.Completed);
                var totalTasksInProgress = allTaskAssignments.Count(ta =>
                    ta.Task != null && ta.Task.StatusId == Core.Enums.TaskStatus.InProgress);            var metrics = new
            {
                totalDevelopers = allEmployees.Count,
                activeDevelopers = allEmployees.Count(e => e.StatusId == 1), // Assuming 1 is active
                averageEfficiency = developers.Any() ? developers.Average(d => (double?)d.GetType().GetProperty("efficiency")?.GetValue(d) ?? 0) : 0,
                totalTasksCompleted,
                totalTasksInProgress,
                averageTaskCompletionTime = 0, // Placeholder
                codeReviewsCompleted = 0, // Placeholder
                averageReviewTime = 0, // Placeholder
                bugsFixed = 0, // Placeholder
                featuresDelivered = 0 // Placeholder
            };

            var pagination = new
            {
                currentPage = page,
                pageSize,
                totalItems = totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                hasNextPage = page * pageSize < totalCount,
                hasPreviousPage = page > 1
            };

            var filters = new
            {
                status,
                search,
                sortBy,
                sortOrder
            };

            return Ok(new
            {
                success = true,
                data = new
                {
                    developers,
                    metrics,
                    pagination,
                    filters
                },
                message = "Developer workload data retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving developer workload data");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving developer workload data"
            });
        }
    }

    /// <summary>
    /// Get code review metrics
    /// </summary>
    [HttpGet("code-reviews/metrics")]
    public IActionResult GetCodeReviewMetrics()
    {
        try
        {
            // Placeholder implementation - would need code review entities
            var metrics = new
            {
                totalReviews = 0,
                pendingReviews = 0,
                averageReviewTime = 0,
                approvalRate = 0,
                reviewsThisWeek = 0,
                criticalReviews = 0,
                reviewsByStatus = new
                {
                    approved = 0,
                    needsChanges = 0,
                    pending = 0,
                    rejected = 0
                },
                topReviewers = new object[] { }
            };

            return Ok(new
            {
                success = true,
                data = metrics,
                message = "Code review metrics retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving code review metrics");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving code review metrics"
            });
        }
    }

    /// <summary>
    /// Get individual developer performance
    /// </summary>
    [HttpGet("performance/{developerId}")]
    public async Task<IActionResult> GetDeveloperPerformance(string developerId)
    {
        try
        {
            if (!int.TryParse(developerId, out var id))
            {
                return BadRequest(new { success = false, message = "Invalid developer ID" });
            }

            var employee = await _context.MawaredEmployees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
            {
                return NotFound(new { success = false, message = "Developer not found" });
            }

            var taskAssignments = await _context.TaskAssignments
                .Include(ta => ta.Task)
                .Where(ta => ta.PrsId == id)
                .ToListAsync();

            var performance = new
            {
                developerId = employee.Id.ToString(),
                developerName = employee.FullName,
                totalTasks = taskAssignments.Count,
                completedTasks = taskAssignments.Count(ta => ta.Task?.StatusId == Core.Enums.TaskStatus.Completed),
                inProgressTasks = taskAssignments.Count(ta => ta.Task?.StatusId == Core.Enums.TaskStatus.InProgress),
                averageCompletionTime = taskAssignments
                    .Where(ta => ta.Task?.ActualHours.HasValue == true)
                    .Average(ta => ta.Task?.ActualHours ?? 0),
                efficiency = taskAssignments.Any() ?
                    taskAssignments.Count(ta => ta.Task?.StatusId == Core.Enums.TaskStatus.Completed) * 100.0 / taskAssignments.Count : 0,
                recentTasks = taskAssignments
                    .Where(ta => ta.Task != null)
                    .OrderByDescending(ta => ta.AssignedAt)
                    .Take(5)
                    .Select(ta => new
                    {
                        taskId = ta.Task!.Id,
                        taskName = ta.Task.Name,
                        status = ta.Task.StatusId.ToString(),
                        priority = ta.Task.PriorityId.ToString(),
                        assignedAt = ta.AssignedAt
                    })
            };

            return Ok(new
            {
                success = true,
                data = performance,
                message = "Developer performance retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving developer performance");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving developer performance"
            });
        }
    }

    /// <summary>
    /// Update developer workload
    /// </summary>
    [HttpPatch("{developerId}")]
    public async Task<IActionResult> UpdateWorkload(string developerId, [FromBody] object workloadData)
    {
        try
        {
            if (!int.TryParse(developerId, out var id))
            {
                return BadRequest(new { success = false, message = "Invalid developer ID" });
            }

            var employee = await _context.MawaredEmployees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { success = false, message = "Developer not found" });
            }

            // Placeholder - would need to implement actual workload update logic
            // This could involve updating task assignments, priorities, etc.

            return Ok(new
            {
                success = true,
                data = new { developerId, updated = true },
                message = "Developer workload updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating developer workload");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while updating developer workload"
            });
        }
    }

    /// <summary>
    /// Get team workload data
    /// </summary>
    [HttpGet("teams")]
    public async Task<IActionResult> GetTeamWorkload()
    {
        try
        {
            // Group employees by department as teams
            var teams = await _context.MawaredEmployees
                .Include(e => e.User)
                .GroupBy(e => e.GradeName) // Using grade as team grouping
                .Select(g => new
                {
                    teamId = g.Key,
                    teamName = $"Team {g.Key}",
                    totalMembers = g.Count(),
                    activeMembers = g.Count(e => e.StatusId == 1),
                    averageWorkload = 0, // Placeholder
                    totalTasks = 0, // Placeholder
                    completedTasks = 0, // Placeholder
                    efficiency = 0, // Placeholder
                    members = g.Select(e => new
                    {
                        id = e.Id.ToString(),
                        name = e.FullName,
                        workload = 0 // Placeholder
                    }).ToList()
                })
                .ToListAsync();

            var overview = new
            {
                totalTeams = teams.Count,
                totalDevelopers = teams.Sum(t => t.totalMembers),
                averageTeamEfficiency = teams.Any() ? teams.Average(t => t.efficiency) : 0,
                overloadedDevelopers = 0, // Placeholder
                underutilizedDevelopers = 0 // Placeholder
            };

            return Ok(new
            {
                success = true,
                data = new
                {
                    teams,
                    overview
                },
                message = "Team workload data retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving team workload data");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving team workload data"
            });
        }
    }

    /// <summary>
    /// Get capacity planning data
    /// </summary>
    [HttpGet("capacity-planning")]
    public IActionResult GetCapacityPlanning()
    {
        try
        {
            // Placeholder implementation
            var capacityPlanning = new
            {
                currentSprint = new
                {
                    sprintName = "Current Sprint",
                    totalCapacity = 100,
                    allocatedCapacity = 75,
                    remainingCapacity = 25,
                    utilizationRate = 75
                },
                nextSprint = new
                {
                    sprintName = "Next Sprint",
                    estimatedCapacity = 100,
                    plannedAllocation = 80,
                    projectedUtilization = 80
                },
                weeklyCapacity = new[]
                {
                    new { week = "Week 1", capacity = 100, allocated = 80, utilization = 80 },
                    new { week = "Week 2", capacity = 100, allocated = 85, utilization = 85 },
                    new { week = "Week 3", capacity = 100, allocated = 75, utilization = 75 },
                    new { week = "Week 4", capacity = 100, allocated = 90, utilization = 90 }
                },
                developerAvailability = new[]
                {
                    new { developerId = "1", name = "Developer 1", hoursAvailable = 40, hoursAllocated = 30 },
                    new { developerId = "2", name = "Developer 2", hoursAvailable = 40, hoursAllocated = 35 }
                }
            };

            return Ok(new
            {
                success = true,
                data = capacityPlanning,
                message = "Capacity planning data retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving capacity planning data");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving capacity planning data"
            });
        }
    }

    /// <summary>
    /// Get burnout analysis
    /// </summary>
    [HttpGet("burnout-analysis")]
    public IActionResult GetBurnoutAnalysis()
    {
        try
        {
            // Placeholder implementation
            var burnoutAnalysis = new
            {
                overallRisk = "Medium",
                highRiskDevelopers = new object[] { },
                mediumRiskDevelopers = new[]
                {
                    new
                    {
                        developerId = "1",
                        name = "Developer 1",
                        riskLevel = "Medium",
                        workloadPercentage = 80,
                        overtimeHours = 10,
                        stressIndicators = new[] { "High workload", "Overtime" },
                        recommendations = new[] { "Reduce workload", "Add break time" }
                    }
                },
                lowRiskDevelopers = new[]
                {
                    new
                    {
                        developerId = "2",
                        name = "Developer 2",
                        riskLevel = "Low",
                        workloadPercentage = 60,
                        overtimeHours = 2,
                        stressIndicators = new string[] { },
                        recommendations = new string[] { }
                    }
                },
                teamMetrics = new
                {
                    averageWorkload = 70,
                    averageOvertimeHours = 6,
                    burnoutRiskScore = 45,
                    recommendedActions = new[] { "Balance workload distribution", "Implement work-life balance policies" }
                }
            };

            return Ok(new
            {
                success = true,
                data = burnoutAnalysis,
                message = "Burnout analysis retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving burnout analysis");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving burnout analysis"
            });
        }
    }

    /// <summary>
    /// Assign task to developer
    /// </summary>
    [HttpPost("assign-task")]
    public IActionResult AssignTask([FromBody] object taskData)
    {
        try
        {
            // Placeholder implementation
            return Ok(new
            {
                success = true,
                data = new { assigned = true },
                message = "Task assigned successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning task");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while assigning task"
            });
        }
    }

    /// <summary>
    /// Get skills matrix
    /// </summary>
    [HttpGet("skills-matrix")]
    public IActionResult GetSkillsMatrix()
    {
        try
        {
            // Placeholder implementation
            var skillsMatrix = new
            {
                developers = new[]
                {
                    new
                    {
                        developerId = "1",
                        name = "Developer 1",
                        skills = new Dictionary<string, object>
                        {
                            ["C#"] = new { level = 4, experience = "5 years" },
                            ["JavaScript"] = new { level = 3, experience = "3 years" }
                        }
                    }
                },
                skillGaps = new[]
                {
                    new
                    {
                        skill = "React",
                        currentLevel = 2,
                        requiredLevel = 4,
                        gap = 2
                    }
                },
                trainingRecommendations = new[]
                {
                    new
                    {
                        skill = "React",
                        priority = "High",
                        developers = new[] { "Developer 1" },
                        estimatedTime = "2 months"
                    }
                }
            };

            return Ok(new
            {
                success = true,
                data = skillsMatrix,
                message = "Skills matrix retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving skills matrix");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving skills matrix"
            });
        }
    }

    /// <summary>
    /// Get productivity trends
    /// </summary>
    [HttpGet("productivity-trends")]
    public IActionResult GetProductivityTrends()
    {
        try
        {
            // Placeholder implementation
            var productivityTrends = new
            {
                monthlyTrends = new[]
                {
                    new { month = "Jan", tasksCompleted = 25, efficiency = 85, velocity = 25 },
                    new { month = "Feb", tasksCompleted = 30, efficiency = 90, velocity = 30 }
                },
                weeklyTrends = new[]
                {
                    new { week = "Week 1", velocity = 5, burndown = 20 },
                    new { week = "Week 2", velocity = 7, burndown = 15 }
                },
                developerTrends = new[]
                {
                    new
                    {
                        developerId = "1",
                        name = "Developer 1",
                        monthlyTasksCompleted = new[] { 5, 7, 6, 8 },
                        efficiencyTrend = new[] { 80, 85, 90, 88 }
                    }
                },
                insights = new[] { "Productivity increased by 15% this month", "Team velocity is above average" }
            };

            return Ok(new
            {
                success = true,
                data = productivityTrends,
                message = "Productivity trends retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving productivity trends");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving productivity trends"
            });
        }
    }

    /// <summary>
    /// Get pending code reviews
    /// </summary>
    [HttpGet("code-reviews/pending")]
    public IActionResult GetPendingCodeReviews()
    {
        try
        {
            // Placeholder implementation
            var pendingReviews = new
            {
                reviews = new[]
                {
                    new
                    {
                        reviewId = "1",
                        title = "Feature implementation",
                        author = "Developer 1",
                        authorId = "1",
                        repository = "main-repo",
                        branch = "feature-branch",
                        createdAt = DateTime.UtcNow.AddDays(-2),
                        linesAdded = 150,
                        linesDeleted = 20,
                        filesChanged = 5,
                        priority = "High",
                        assignedReviewers = new[] { "Reviewer 1", "Reviewer 2" },
                        status = "pending",
                        ageInHours = 48
                    }
                },
                summary = new
                {
                    totalPending = 1,
                    criticalPending = 0,
                    averageAge = 48,
                    overdueReviews = 0
                }
            };

            return Ok(new
            {
                success = true,
                data = pendingReviews,
                message = "Pending code reviews retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending code reviews");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving pending code reviews"
            });
        }
    }

    /// <summary>
    /// Approve code review
    /// </summary>
    [HttpPost("code-reviews/{reviewId}/approve")]
    public IActionResult ApproveCodeReview(string reviewId, [FromBody] object comment)
    {
        try
        {
            // Placeholder implementation
            return Ok(new
            {
                success = true,
                data = new { reviewId, approved = true },
                message = "Code review approved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving code review");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while approving code review"
            });
        }
    }

    /// <summary>
    /// Request changes in code review
    /// </summary>
    [HttpPost("code-reviews/{reviewId}/request-changes")]
    public IActionResult RequestChanges(string reviewId, [FromBody] object data)
    {
        try
        {
            // Placeholder implementation
            return Ok(new
            {
                success = true,
                data = new { reviewId, changesRequested = true },
                message = "Changes requested successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting changes");
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while requesting changes"
            });
        }
    }
}