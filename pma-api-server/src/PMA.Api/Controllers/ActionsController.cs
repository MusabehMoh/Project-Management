using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using Permission = PMA.Core.Entities.Permission;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActionsController : ApiBaseController
{
    private readonly IActionService _actionService;

    public ActionsController(IActionService actionService)
    {
        _actionService = actionService;
    }

    /// <summary>
    /// Get all actions with filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetActions(
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var actions = await _actionService.GetAllActionsAsync();
            
            // Apply filtering if parameters are provided
            if (!string.IsNullOrEmpty(category) || isActive.HasValue)
            {
                if (!string.IsNullOrEmpty(category))
                {
                    actions = actions.Where(a => a.Category == category);
                }
                
                if (isActive.HasValue)
                {
                    actions = actions.Where(a => a.IsActive == isActive.Value);
                }
            }
            
            return Success(actions);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Permission>>("An error occurred while retrieving actions", ex.Message);
        }
    }

    /// <summary>
    /// Get action by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Permission), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetActionById(int id)
    {
        try
        {
            var action = await _actionService.GetActionByIdAsync(id);
            if (action == null)
                return NotFound(Error<Permission>("Action not found", null, 404));
            return Success(action);
        }
        catch (Exception ex)
        {
            return Error<Permission>("An error occurred while retrieving the action", ex.Message);
        }
    }

    /// <summary>
    /// Create a new action
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Permission), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateAction([FromBody] Permission action)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var createdAction = await _actionService.CreateActionAsync(action);
            return CreatedAtAction(nameof(GetActionById), new { id = createdAction.Id }, createdAction);
        }
        catch (Exception ex)
        {
            return Error<Permission>("An error occurred while creating the action", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing action
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Permission), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateAction(int id, [FromBody] Permission action)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var existingAction = await _actionService.GetActionByIdAsync(id);
            if (existingAction == null)
                return NotFound(Error<Permission>("Action not found", null, 404));
            // Update properties
            existingAction.Name = action.Name ?? existingAction.Name;
            existingAction.Description = action.Description ?? existingAction.Description;
            existingAction.Category = action.Category ?? existingAction.Category;
            existingAction.Resource = action.Resource ?? existingAction.Resource;
            existingAction.Action = action.Action ?? existingAction.Action;
            existingAction.IsActive = action.IsActive;
            existingAction.UpdatedAt = DateTime.UtcNow;
            var updatedAction = await _actionService.UpdateActionAsync(existingAction);
            return Success(updatedAction);
        }
        catch (Exception ex)
        {
            return Error<Permission>("An error occurred while updating the action", ex.Message);
        }
    }

    /// <summary>
    /// Delete an action
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteAction(int id)
    {
        try
        {
            var action = await _actionService.GetActionByIdAsync(id);
            if (action == null)
                return NotFound(Error<Permission>("Action not found", null, 404));
            await _actionService.DeleteActionAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<Permission>("An error occurred while deleting the action", ex.Message);
        }
    }
}