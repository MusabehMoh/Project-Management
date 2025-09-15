using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class ProjectRepository : Repository<Project>, IProjectRepository
{
    public ProjectRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Project>> GetProjectsWithPaginationAsync(int page, int limit, string? search = null, int? status = null, string? priority = null)
    {
        var query = _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.AlternativeOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.ApplicationName.Contains(search) ||
                p.Description.Contains(search) ||
                p.ProjectOwner.Contains(search));
        }

        // Apply status filter
        if (status.HasValue)
        {
            query = query.Where(p => (int)p.Status == status.Value);
        }

        // Apply priority filter
        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<Priority>(priority, true, out var priorityEnum))
            {
                query = query.Where(p => p.Priority == priorityEnum);
            }
        }

        // Apply pagination
        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetTotalProjectsCountAsync(string? search = null, int? status = null, string? priority = null)
    {
        var query = _context.Projects.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.ApplicationName.Contains(search) ||
                p.Description.Contains(search) ||
                p.ProjectOwner.Contains(search));
        }

        // Apply status filter
        if (status.HasValue)
        {
            query = query.Where(p => (int)p.Status == status.Value);
        }

        // Apply priority filter
        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<Priority>(priority, true, out var priorityEnum))
            {
                query = query.Where(p => p.Priority == priorityEnum);
            }
        }

        return await query.CountAsync();
    }

    public async Task<Project?> GetProjectWithDetailsAsync(int id)
    {
        return await _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.AlternativeOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.Tasks)
            .Include(p => p.Requirements)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20)
    {
        var searchQuery = _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.AlternativeOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Where(p =>
                p.ApplicationName.Contains(query) ||
                p.Description.Contains(query) ||
                p.ProjectOwner.Contains(query) ||
                p.AlternativeOwner.Contains(query))
            .AsQueryable();

        // Apply status filter
        if (status.HasValue)
        {
            searchQuery = searchQuery.Where(p => (int)p.Status == status.Value);
        }

        // Apply priority filter
        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<Priority>(priority, true, out var priorityEnum))
            {
                searchQuery = searchQuery.Where(p => p.Priority == priorityEnum);
            }
        }

        return await searchQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
    }
}


