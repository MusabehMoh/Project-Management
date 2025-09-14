using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PMA.Infrastructure.Repositories;

public class EmployeeRepository : Repository<Employee>, IEmployeeRepository
{
    public EmployeeRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async System.Threading.Tasks.Task<(IEnumerable<Employee> Employees, int TotalCount)> GetEmployeesAsync(int page, int limit, int? statusId = null)
    {
        var query = _context.Employees.AsQueryable();

        if (statusId.HasValue)
        {
            query = query.Where(e => e.StatusId == statusId.Value);
        }

        var totalCount = await query.CountAsync();
        var employees = await query
            .OrderBy(e => e.Id)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (employees, totalCount);
    }
}