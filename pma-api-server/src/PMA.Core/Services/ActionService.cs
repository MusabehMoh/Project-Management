using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Permission = PMA.Core.Entities.Permission;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class ActionService : IActionService
{
    private readonly IActionRepository _actionRepository;

    public ActionService(IActionRepository actionRepository)
    {
        _actionRepository = actionRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Permission>> GetAllActionsAsync()
    {
        return await _actionRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Permission?> GetActionByIdAsync(int id)
    {
        return await _actionRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Permission> CreateActionAsync(Permission action)
    {
        action.CreatedAt = DateTime.Now;
        action.UpdatedAt = DateTime.Now;
        return await _actionRepository.AddAsync(action);
    }

    public async System.Threading.Tasks.Task<Permission> UpdateActionAsync(Permission action)
    {
        action.UpdatedAt = DateTime.Now;
        await _actionRepository.UpdateAsync(action);
        return action;
    }

    public async System.Threading.Tasks.Task<bool> DeleteActionAsync(int id)
    {
        var action = await _actionRepository.GetByIdAsync(id);
        if (action != null)
        {
            await _actionRepository.DeleteAsync(action);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsAsync(int page, int limit, string? category = null, bool? isActive = null)
    {
        return await _actionRepository.GetActionsAsync(page, limit, category, isActive);
    }

    public async Task<IEnumerable<Permission>> GetActiveActionsAsync()
    {
        return await _actionRepository.GetActiveActionsAsync();
    }

    public async System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsByCategoryAsync(string category)
    {
        return await _actionRepository.GetActionsByCategoryAsync(category);
    }
}



