using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class UnitRepository : Repository<Unit>, IUnitRepository
{
    public UnitRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, bool? isActive = null)
    {
        var query = _context.Units.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var units = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (units, totalCount);
    }

    public async Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, string? search = null, int? parentId = null, bool? isActive = null)
    {
        var query = _context.Units.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.ToLower();
            query = query.Where(u => 
                u.Name.ToLower().Contains(searchTerm) ||
                u.Code.ToLower().Contains(searchTerm) ||
                (u.Description != null && u.Description.ToLower().Contains(searchTerm)));
        }

        // Apply parent filter
        if (parentId.HasValue)
        {
            query = query.Where(u => u.ParentId == parentId.Value);
        }

        // Apply active filter
        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var units = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (units, totalCount);
    }

    public async Task<IEnumerable<Unit>> GetActiveUnitsAsync()
    {
        return await _context.Units
            .Where(u => u.IsActive)
            .OrderBy(u => u.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Unit>> GetRootUnitsAsync()
    {
        return await _context.Units
            .Where(u => u.ParentId == null)
            .OrderBy(u => u.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Unit>> GetUnitChildrenAsync(int parentId)
    {
        return await _context.Units
            .Where(u => u.ParentId == parentId)
            .OrderBy(u => u.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Unit>> GetUnitPathAsync(int unitId)
    {
        var path = new List<Unit>();
        var currentUnit = await _context.Units.FindAsync(unitId);
        
        while (currentUnit != null)
        {
            path.Insert(0, currentUnit);
            if (currentUnit.ParentId.HasValue)
            {
                currentUnit = await _context.Units.FindAsync(currentUnit.ParentId.Value);
            }
            else
            {
                break;
            }
        }

        return path;
    }

    public async Task<IEnumerable<Unit>> SearchUnitsAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return new List<Unit>();
        }

        var search = searchTerm.ToLower();
        return await _context.Units
            .Where(u => 
                u.Name.ToLower().Contains(search) ||
                u.Code.ToLower().Contains(search) ||
                (u.Description != null && u.Description.ToLower().Contains(search)) ||
                u.Path.ToLower().Contains(search))
            .OrderBy(u => u.Name)
            .ToListAsync();
    }

    public async Task<UnitStatsDto> GetUnitStatsAsync()
    {
        var allUnits = await _context.Units.ToListAsync();
        
        return new UnitStatsDto
        {
            Total = allUnits.Count,
            Active = allUnits.Count(u => u.IsActive),
            Inactive = allUnits.Count(u => !u.IsActive),
            RootUnits = allUnits.Count(u => u.ParentId == null),
            MaxLevel = allUnits.Any() ? allUnits.Max(u => u.Level) : 0
        };
    }
}


