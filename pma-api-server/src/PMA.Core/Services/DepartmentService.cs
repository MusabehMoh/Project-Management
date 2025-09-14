using PMA.Core.Entities;
using PMA.Core.Interfaces;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _departmentRepository;

    public DepartmentService(IDepartmentRepository departmentRepository)
    {
        _departmentRepository = departmentRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Department>> GetAllDepartmentsAsync()
    {
        return await _departmentRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Department?> GetDepartmentByIdAsync(int id)
    {
        return await _departmentRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Department> CreateDepartmentAsync(Department department)
    {
        department.CreatedAt = DateTime.UtcNow;
        department.UpdatedAt = DateTime.UtcNow;
        return await _departmentRepository.AddAsync(department);
    }

    public async Task<(IEnumerable<Department> Departments, int TotalCount)> GetDepartmentsAsync(int page, int limit, bool? isActive = null)
    {
        return await _departmentRepository.GetDepartmentsAsync(page, limit, isActive);
    }

    public async Task<Department> UpdateDepartmentAsync(Department department)
    {
        department.UpdatedAt = DateTime.UtcNow;
        await _departmentRepository.UpdateAsync(department);
        return department;
    }

    public async Task<bool> DeleteDepartmentAsync(int id)
    {
        var department = await _departmentRepository.GetByIdAsync(id);
        if (department != null)
        {
            await _departmentRepository.DeleteAsync(department);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Department>> GetActiveDepartmentsAsync()
    {
        return await _departmentRepository.GetActiveDepartmentsAsync();
    }
}


