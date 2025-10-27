using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
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
        unit.CreatedAt = DateTime.Now;
        unit.UpdatedAt = DateTime.Now;
        return await _unitRepository.AddAsync(unit);
    }

    public async Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, bool? isActive = null)
    {
        return await _unitRepository.GetUnitsAsync(page, limit, isActive);
    }

    public async Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, string? search = null, int? parentId = null, bool? isActive = null)
    {
        return await _unitRepository.GetUnitsAsync(page, limit, search, parentId, isActive);
    }

    public async Task<Unit> UpdateUnitAsync(Unit unit)
    {
        unit.UpdatedAt = DateTime.Now;
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

    public async System.Threading.Tasks.Task<IEnumerable<UnitTreeDto>> GetUnitsTreeAsync()
    {
        var allUnits = await _unitRepository.GetAllAsync();
        var unitsList = allUnits.ToList();
        
        return BuildTree(unitsList, null);
    }

    public async System.Threading.Tasks.Task<IEnumerable<Unit>> GetRootUnitsAsync()
    {
        return await _unitRepository.GetRootUnitsAsync();
    }

    public async System.Threading.Tasks.Task<IEnumerable<Unit>> GetUnitChildrenAsync(int parentId)
    {
        return await _unitRepository.GetUnitChildrenAsync(parentId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<Unit>> GetUnitPathAsync(int unitId)
    {
        return await _unitRepository.GetUnitPathAsync(unitId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<Unit>> SearchUnitsAsync(string searchTerm)
    {
        return await _unitRepository.SearchUnitsAsync(searchTerm);
    }

    public async System.Threading.Tasks.Task<UnitStatsDto> GetUnitStatsAsync()
    {
        return await _unitRepository.GetUnitStatsAsync();
    }

    public async System.Threading.Tasks.Task<IEnumerable<UnitTreeDto>> GetRootUnitsTreeAsync()
    {
        var rootUnits = await _unitRepository.GetRootUnitsAsync();
        var allUnits = await _unitRepository.GetAllAsync();
        var unitsList = allUnits.ToList();
        
        return rootUnits.Select(u => new UnitTreeDto
        {
            Id = u.Id,
            Name = u.Name,
            NameAr = u.Name,
            Code = u.Code,
            Description = u.Description,
            ParentId = u.ParentId,
            Level = u.Level,
            Path = u.Path,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt,
            Children = new List<UnitTreeDto>(), // Empty for lazy loading
            HasChildren = unitsList.Any(unit => unit.ParentId == u.Id),
            IsExpanded = false,
            IsLoading = false
        }).ToList();
    }

    public async System.Threading.Tasks.Task<IEnumerable<UnitTreeDto>> GetUnitChildrenTreeAsync(int parentId)
    {
        var children = await _unitRepository.GetUnitChildrenAsync(parentId);
        var allUnits = await _unitRepository.GetAllAsync();
        var unitsList = allUnits.ToList();
        
        return children.Select(u => new UnitTreeDto
        {
            Id = u.Id,
            Name = u.Name,
            NameAr = u.Name,
            Code = u.Code,
            Description = u.Description,
            ParentId = u.ParentId,
            Level = u.Level,
            Path = u.Path,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt,
            Children = new List<UnitTreeDto>(), // Empty for lazy loading
            HasChildren = unitsList.Any(unit => unit.ParentId == u.Id),
            IsExpanded = false,
            IsLoading = false
        }).ToList();
    }

    private static List<UnitTreeDto> BuildTree(List<Unit> units, int? parentId)
    {
        return units
            .Where(u => u.ParentId == parentId)
            .Select(u => new UnitTreeDto
            {
                Id = u.Id,
                Name = u.Name,
                NameAr = u.Name,
                Code = u.Code,
                Description = u.Description,
                ParentId = u.ParentId,
                Level = u.Level,
                Path = u.Path,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                Children = BuildTree(units, u.Id),
                HasChildren = units.Any(unit => unit.ParentId == u.Id),
                IsExpanded = true, // For full tree, all nodes are expanded
                IsLoading = false
            })
            .ToList();
    }
}



