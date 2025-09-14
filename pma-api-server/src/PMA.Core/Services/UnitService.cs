using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Task = System.Threading.Tasks.Task;

namespace PMA.Core.Services;

public class UnitService : IUnitService
{
    private readonly IUnitRepository _unitRepository;

    public UnitService(IUnitRepository unitRepository)
    {
        _unitRepository = unitRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Unit>> GetAllUnitsAsync()
    {
        return await _unitRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Unit?> GetUnitByIdAsync(int id)
    {
        return await _unitRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Unit> CreateUnitAsync(Unit unit)
    {
        unit.CreatedAt = DateTime.UtcNow;
        unit.UpdatedAt = DateTime.UtcNow;
        return await _unitRepository.AddAsync(unit);
    }

    public async Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, bool? isActive = null)
    {
        return await _unitRepository.GetUnitsAsync(page, limit, isActive);
    }

    public async Task<Unit> UpdateUnitAsync(Unit unit)
    {
        unit.UpdatedAt = DateTime.UtcNow;
        await _unitRepository.UpdateAsync(unit);
        return unit;
    }

    public async Task<bool> DeleteUnitAsync(int id)
    {
        var unit = await _unitRepository.GetByIdAsync(id);
        if (unit != null)
        {
            await _unitRepository.DeleteAsync(unit);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Unit>> GetActiveUnitsAsync()
    {
        return await _unitRepository.GetActiveUnitsAsync();
    }
}



