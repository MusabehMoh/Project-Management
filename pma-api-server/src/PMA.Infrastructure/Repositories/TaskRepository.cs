using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Infrastructure.Repositories;

public class TaskRepository : Repository<TaskEntity>, ITaskRepository
{
    public TaskRepository(ApplicationDbContext context) : base(context)
    {
    }

    // Hide the base GetByIdAsync method to include assignments and dependencies
    public new async Task<TaskEntity?> GetByIdAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.Sprint)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null, int? priorityId = null, int? departmentId = null, string? search = null, int? typeId = null)
    {
        var query = _context.Tasks
            .Include(t => t.Sprint)
                .ThenInclude(s => s!.Project)
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Employee)
            .Include(t => t.Department)
            .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
            .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
                    .ThenInclude(p => p!.OwningUnitEntity)
            .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
                    .ThenInclude(p => p!.ProjectOwnerEmployee)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .AsQueryable();

        if (sprintId.HasValue)
        {
            query = query.Where(t => t.SprintId == sprintId.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(t => t.ProjectRequirement != null && t.ProjectRequirement.ProjectId == projectId.Value);
        }

        if (assigneeId.HasValue)
        {
            query = query.Where(t => t.Assignments.Any(a => a.PrsId == assigneeId.Value));
        }
        
        if (statusId.HasValue)
        {
            query = query.Where(t => (int)t.StatusId == statusId.Value);
        }

        if (priorityId.HasValue)
        {
            query = query.Where(t => (int)t.PriorityId == priorityId.Value);
        }

        if (typeId.HasValue)
        {
            query = query.Where(t => (int)t.TypeId == typeId.Value);
        }

        if (departmentId.HasValue)
        {
            // Get team member PRS IDs from the specified department
            var departmentTeamPrsIds = await _context.Teams
                .Where(t => t.DepartmentId == departmentId.Value && t.IsActive == true)
                .Select(t => t.PrsId)
                .ToListAsync();
            
            // Filter tasks that are assigned to team members from this department
            query = query.Where(t => t.Assignments.Any(a => departmentTeamPrsIds.Contains(a.PrsId)));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(t => t.Name.Contains(search) || t.Description.Contains(search));
        }

        var totalCount = await query.CountAsync();
        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (tasks, totalCount);
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksBySprintAsync(int sprintId)
    {
        return await _context.Tasks  
            .Where(t => t.SprintId == sprintId)
            .OrderBy(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksByAssigneeAsync(int assigneeId)
    {
        return await _context.Tasks
            .Include(t => t.Sprint)
                .ThenInclude(s => s!.Project)
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Employee)
            .Include(t => t.Department)
            .Include(t => t.ProjectRequirement)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .Where(t => t.Assignments.Any(a => a.PrsId == assigneeId))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksByProjectAsync(int projectId)
    {
        return await _context.Tasks
            .Include(t => t.Sprint)
                .ThenInclude(s => s!.Project)
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Employee)
            .Include(t => t.Department)
            .Include(t => t.ProjectRequirement)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .Where(t => t.Sprint != null && t.Sprint.ProjectId == projectId)
            .OrderBy(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<TaskEntity?> GetTaskWithSubTasksAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Sprint)
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<TaskEntity>> SearchTasksAsync(string query, int? timelineId = null, int limit = 25)
    {
        var taskQuery = _context.Tasks 
            .AsQueryable();

        // Apply timeline filter if provided
        if (timelineId.HasValue)
        {
            taskQuery = taskQuery.Where(t => t.TimelineId == timelineId.Value);
        }

        // Search in name and description if query is provided
        if (!string.IsNullOrEmpty(query))
        {
            var searchTerm = query.ToLower();
            taskQuery = taskQuery.Where(t => 
                (t.Name != null && t.Name.ToLower().Contains(searchTerm)) || 
                (t.Description != null && t.Description.ToLower().Contains(searchTerm)));
        }

        return await taskQuery
            .OrderByDescending(t => t.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task UpdateTaskAssignmentsAsync(int taskId, IEnumerable<int> memberIds)
    {
        // Remove existing assignments
        var existingAssignments = await _context.TaskAssignments
            .Where(ta => ta.TaskId == taskId)
            .ToListAsync();
        
        _context.TaskAssignments.RemoveRange(existingAssignments);

        // Add new assignments
        var newAssignments = memberIds.Select(memberId => new TaskAssignment
        {
            TaskId = taskId,
            PrsId = memberId,
            AssignedAt = DateTime.Now
        });

        await _context.TaskAssignments.AddRangeAsync(newAssignments);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateTaskDependenciesAsync(int taskId, IEnumerable<int> predecessorIds)
    {
        // Remove existing dependencies
        var existingDependencies = await _context.TaskDependencies
            .Where(td => td.TaskId == taskId)
            .ToListAsync();
        
        _context.TaskDependencies.RemoveRange(existingDependencies);

        // Add new dependencies
        var newDependencies = predecessorIds.Select(predecessorId => new TaskDependency
        {
            TaskId = taskId,
            DependsOnTaskId = predecessorId,
            CreatedAt = DateTime.Now
        });

        await _context.TaskDependencies.AddRangeAsync(newDependencies);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<TaskAssignment>> GetTaskAssignmentsAsync(int taskId)
    {
        return await _context.TaskAssignments
            .Include(ta => ta.Employee)
            .Where(ta => ta.TaskId == taskId)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskDependency>> GetTaskDependenciesAsync(int taskId)
    {
        return await _context.TaskDependencies
            .Include(td => td.DependsOnTask)
            .Where(td => td.DependsOnTaskId == taskId)
            .ToListAsync();
    }
    public async Task<IEnumerable<TaskDependency>> GetTaskPrerequisitesAsync(int taskId)
    {
        return await _context.TaskDependencies
            .Include(td => td.DependsOnTask)
            .Where(td => td.TaskId == taskId)
            .ToListAsync();
    }

    public async Task CleanupTaskDependenciesAsync(int taskId)
    {
        // Remove all dependencies where this task is the predecessor (other tasks depend on it)
        var dependenciesWhereTaskIsPredecessor = await _context.TaskDependencies
            .Where(td => td.DependsOnTaskId == taskId)
            .ToListAsync();

        _context.TaskDependencies.RemoveRange(dependenciesWhereTaskIsPredecessor);

        // Remove all dependencies where this task depends on others
        var dependenciesWhereTaskIsSuccessor = await _context.TaskDependencies
            .Where(td => td.TaskId == taskId)
            .ToListAsync();

        _context.TaskDependencies.RemoveRange(dependenciesWhereTaskIsSuccessor);

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Remove all task assignments for a specific task
    /// Performance: Single database query to fetch and delete all assignments
    /// </summary>
    public async Task CleanupTaskAssignmentsAsync(int taskId)
    {
        var assignments = await _context.TaskAssignments
            .Where(ta => ta.TaskId == taskId)
            .ToListAsync();

        _context.TaskAssignments.RemoveRange(assignments);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<int>> GetTaskIdsWithNoDependentTasksAsync()
    {
        // Get all task IDs that are not referenced as DependsOnTaskId in TaskDependencies
        var tasksWithDependencies = await _context.TaskDependencies
            .Select(td => td.DependsOnTaskId)
            .Distinct()
            .ToListAsync();

        var allTaskIds = await _context.Tasks.Where(w=>w.RoleType=="developer")
            .Select(t => t.Id)
            .ToListAsync();

        return allTaskIds.Except(tasksWithDependencies);
    }

    public async Task<IEnumerable<User>> GetTeamMembersAsync(bool isAdministrator, bool isManager, int? currentUserDepartmentId)
    {
        if (isAdministrator)
        {
            // Administrators can see all team members from Teams table
            var allTeamMembers = await _context.Teams
                .Include(t => t.Employee)
                .Where(t => t.IsActive == true && t.Employee != null)
                .Select(t => new User
                {
                    Id = t.Employee!.Id,
                    PrsId = t.Employee.Id,
                    UserName = t.Employee.UserName,
                    FullName = t.Employee.FullName,
                    MilitaryNumber = t.Employee.MilitaryNumber,
                    GradeName = t.Employee.GradeName,
                    IsActive = true,
                    Email = "",
                    Phone = "",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    Employee = t.Employee,
                    DepartmentId = t.DepartmentId
                })
                .OrderBy(u => u.GradeName)
                .ThenBy(u => u.FullName)
                .ToListAsync();
            
            return allTeamMembers;
        }
        else if (currentUserDepartmentId.HasValue)
        {
            // Managers and regular users can see members from their department only
            var departmentTeamMembers = await _context.Teams
                .Include(t => t.Employee)
                .Where(t => t.DepartmentId == currentUserDepartmentId.Value && 
                           t.IsActive == true && 
                           t.Employee != null)
                .Select(t => new User
                {
                    Id = t.Employee!.Id,
                    PrsId = t.Employee.Id,
                    UserName = t.Employee.UserName,
                    FullName = t.Employee.FullName,
                    MilitaryNumber = t.Employee.MilitaryNumber,
                    GradeName = t.Employee.GradeName,
                    IsActive = true,
                    Email = "",
                    Phone = "",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    Employee = t.Employee,
                    DepartmentId = t.DepartmentId
                })
                .OrderBy(u => u.GradeName)
                .ThenBy(u => u.FullName)
                .ToListAsync();
            
            return departmentTeamMembers;
        }
        else
        {
            // If no department context, return empty list
            return new List<User>();
        }
    }

    public async Task<IEnumerable<TaskComment>> GetTaskCommentsAsync(int taskId)
    {
        // Get all task IDs that are related through dependencies
        var relatedTaskIds = new List<int> { taskId };

        // Add tasks that depend on this task (where this task is the DependsOnTaskId)
        var dependentTaskIds = await _context.TaskDependencies
            .Where(td => td.DependsOnTaskId == taskId)
            .Select(td => td.TaskId)
            .ToListAsync();
        relatedTaskIds.AddRange(dependentTaskIds);

        // Add tasks that this task depends on (where this task is the TaskId)
        var dependencyTaskIds = await _context.TaskDependencies
            .Where(td => td.TaskId == taskId)
            .Select(td => td.DependsOnTaskId)
            .ToListAsync();
        relatedTaskIds.AddRange(dependencyTaskIds);

        // Remove duplicates
        relatedTaskIds = relatedTaskIds.Distinct().ToList();

        return await _context.TaskComments
            .Where(tc => relatedTaskIds.Contains(tc.TaskId))
            .OrderByDescending(tc => tc.CreatedAt)
            .ToListAsync();
    }

    public async Task<TaskComment> AddTaskCommentAsync(int taskId, string commentText, string createdBy)
    {
        var comment = new TaskComment
        {
            TaskId = taskId,
            CommentText = commentText,
            CreatedBy = createdBy,
            CreatedAt = DateTime.Now
        };

        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync();
        return comment;
    }

    public async Task<IEnumerable<ChangeGroup>> GetTaskHistoryAsync(int taskId)
    {
        // Get all task IDs that are related through dependencies
        var relatedTaskIds = new List<int> { taskId };

        // Add tasks that depend on this task (where this task is the DependsOnTaskId)
        var dependentTaskIds = await _context.TaskDependencies
            .Where(td => td.DependsOnTaskId == taskId)
            .Select(td => td.TaskId)
            .ToListAsync();
        relatedTaskIds.AddRange(dependentTaskIds);

        // Add tasks that this task depends on (where this task is the TaskId)
        var dependencyTaskIds = await _context.TaskDependencies
            .Where(td => td.TaskId == taskId)
            .Select(td => td.DependsOnTaskId)
            .ToListAsync();
        relatedTaskIds.AddRange(dependencyTaskIds);

        // Remove duplicates
        relatedTaskIds = relatedTaskIds.Distinct().ToList();

        return await _context.ChangeGroups
            .Where(cg => cg.EntityType == "Task" && relatedTaskIds.Contains(cg.EntityId))
            .Include(cg => cg.Items)
            .OrderByDescending(cg => cg.ChangedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskAttachment>> GetTaskAttachmentsAsync(int taskId)
    {
        // Get all task IDs that are related through dependencies
        var relatedTaskIds = new List<int> { taskId };

        // Add tasks that depend on this task (where this task is the DependsOnTaskId)
        var dependentTaskIds = await _context.TaskDependencies
            .Where(td => td.DependsOnTaskId == taskId)
            .Select(td => td.TaskId)
            .ToListAsync();
        relatedTaskIds.AddRange(dependentTaskIds);

        // Add tasks that this task depends on (where this task is the TaskId)
        var dependencyTaskIds = await _context.TaskDependencies
            .Where(td => td.TaskId == taskId)
            .Select(td => td.DependsOnTaskId)
            .ToListAsync();
        relatedTaskIds.AddRange(dependencyTaskIds);

        // Remove duplicates
        relatedTaskIds = relatedTaskIds.Distinct().ToList();

        return await _context.TaskAttachments 
            .Where(tc => relatedTaskIds.Contains(tc.TaskId))
            .OrderByDescending(ta => ta.UploadedAt)
            .ToListAsync();
    }

    public async Task<TaskAttachment?> GetTaskAttachmentByIdAsync(int attachmentId)
    {
        return await _context.TaskAttachments
            .FirstOrDefaultAsync(ta => ta.Id == attachmentId);
    }

    public async Task<TaskAttachment> AddTaskAttachmentAsync(TaskAttachment attachment)
    {
        _context.TaskAttachments.Add(attachment);
        await _context.SaveChangesAsync();
        return attachment;
    }

    public async Task DeleteTaskAttachmentAsync(int attachmentId)
    {
        var attachment = await _context.TaskAttachments.FindAsync(attachmentId);
        if (attachment != null)
        {
            _context.TaskAttachments.Remove(attachment);
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Fetch multiple tasks by IDs in a single database call - eliminates N+1 query problem
    /// </summary>
    public async Task<IEnumerable<TaskEntity>> GetTasksByIdsAsync(IEnumerable<int> taskIds)
    {
        if (taskIds == null || !taskIds.Any())
        {
            return Enumerable.Empty<TaskEntity>();
        }

        return await _context.Tasks
            .Where(t => taskIds.Contains(t.Id))
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.Sprint)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
            .ToListAsync();
    }

    /// <summary>
    /// Get dependent tasks in a single database query - eliminates separate dependency lookup
    /// Returns only tasks that depend on the specified task ID
    /// </summary>
    public async Task<IEnumerable<TaskEntity>> GetDependentTasksAsync(int taskId)
    {
        return await _context.Tasks
            .Where(t => _context.TaskDependencies
                .Where(td => td.DependsOnTaskId == taskId)
                .Select(td => td.TaskId)
                .Contains(t.Id))
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.Sprint)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
            .ToListAsync();
    }

    /// <summary>
    /// Get prerequisite tasks in a single database query - eliminates separate dependency lookup
    /// Returns only tasks that the specified task depends on
    /// </summary>
    public async Task<IEnumerable<TaskEntity>> GetPrerequisiteTasksAsync(int taskId)
    {
        return await _context.Tasks
            .Where(t => _context.TaskDependencies
                .Where(td => td.TaskId == taskId)
                .Select(td => td.DependsOnTaskId)
                .Contains(t.Id))
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.Sprint)
            .Include(t => t.DesignRequests)
                .ThenInclude(dr => dr.AssignedToEmployee)
            .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
            .ToListAsync();
    }

    /// <summary>
    /// Get all tasks for a project requirement in single query
    /// Performance: Single DB call with no N+1 queries
    /// </summary>
    public async Task<IEnumerable<TaskEntity>> GetTasksByProjectRequirementIdAsync(int projectRequirementId)
    {
        return await _context.Tasks
            .Where(t => t.ProjectRequirementId == projectRequirementId)
            .AsNoTracking()
            .ToListAsync();
    }

    /// <summary>
    /// Get all requirements for a project with their completion status in single query
    /// Performance: Single DB call checking requirement status directly
    /// Returns: (RequirementId, Status, IsCompleted)
    /// </summary>
    public async Task<IEnumerable<(int RequirementId, int Status, bool IsCompleted)>> GetProjectRequirementsCompletionStatusAsync(int projectId)
    {
        return await _context.ProjectRequirements
            .Where(pr => pr.ProjectId == projectId)
            .AsNoTracking()
            .Select(pr => new ValueTuple<int, int, bool>(
                pr.Id,
                (int)pr.Status,
                pr.Status == Core.Enums.RequirementStatusEnum.Completed
            ))
            .ToListAsync();
    }
}


