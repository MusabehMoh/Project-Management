using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Permission = PMA.Core.Entities.Permission;
using System.Threading.Tasks;

namespace PMA.Infrastructure.Repositories;

public class ActionRepository : Repository<Permission>, IActionRepository
{
    public ActionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Permission>> GetActionsAsync(int page, int limit, string? category = null, bool? isActive = null)
    {
        // Temporarily simplified implementation
        var allActions = await _context.Set<Permission>().ToListAsync();
        var filteredActions = allActions.AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            filteredActions = filteredActions.Where(a => a.Category == category);
        }

        if (isActive.HasValue)
        {
            filteredActions = filteredActions.Where(a => a.IsActive == isActive.Value);
        }

        var actions = filteredActions
            .OrderBy(a => a.Category)
            .ThenBy(a => a.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToList();

        return actions;
    }

    public async Task<IEnumerable<Permission>> GetActiveActionsAsync()
    {
        var allActions = await _context.Set<Permission>().ToListAsync();
        return allActions
            .Where(a => a.IsActive)
            .OrderBy(a => a.Category)
            .ThenBy(a => a.Name)
            .ToList();
    }

    public async Task<IEnumerable<Permission>> GetActionsByCategoryAsync(string category)
    {
        var allActions = await _context.Set<Permission>().ToListAsync();
        return allActions
            .Where(a => a.IsActive && a.Category == category)
            .OrderBy(a => a.Name)
            .ToList();
    }
}


