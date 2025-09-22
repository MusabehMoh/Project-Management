using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PMA.Infrastructure.Repositories;

public class LookupRepository : Repository<Lookup>, ILookupRepository
{
    public LookupRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Lookup>> GetLookupsAsync(string? code = null)
    {
        var query = _context.Lookups.AsQueryable();

        if (!string.IsNullOrEmpty(code))
        {
            query = query.Where(l => l.Code == code);
        }

        // Always filter by active records only
        query = query.Where(l => l.IsActive);

        return await query
            .OrderBy(l => l.Value)
            .ToListAsync();
    }

    public async Task<IEnumerable<Lookup>> GetLookupsByCategoryAsync(string code)
    {
        return await _context.Lookups
            .Where(l => l.Code == code && l.IsActive)
            .OrderBy(l => l.Value)
            .ToListAsync();
    }
}