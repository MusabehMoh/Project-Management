using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UnitsController : ApiBaseController
{
    private readonly IUnitService _unitService;

    public UnitsController(IUnitService unitService)
    {
        _unitService = unitService;
    }

    /// <summary>
    /// Get all units with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetUnits(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? parentId = null,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var (units, totalCount) = await _unitService.GetUnitsAsync(page, limit, search, parentId, isActive);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(units, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Unit>>("An error occurred while retrieving units", ex.Message);
        }
    }

    /// <summary>
    /// Get unit by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Unit), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetUnitById(int id)
    {
        try
        {
            var unit = await _unitService.GetUnitByIdAsync(id);
            if (unit == null)
                return NotFound(Error<Unit>("Unit not found", null, 404));
            return Success(unit);
        }
        catch (Exception ex)
        {
            return Error<Unit>("An error occurred while retrieving the unit", ex.Message);
        }
    }

    /// <summary>
    /// Create a new unit
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Unit), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateUnit([FromBody] Unit unit)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var createdUnit = await _unitService.CreateUnitAsync(unit);
            return CreatedAtAction(nameof(GetUnitById), new { id = createdUnit.Id }, createdUnit);
        }
        catch (Exception ex)
        {
            return Error<Unit>("An error occurred while creating the unit", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing unit
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Unit), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateUnit(int id, [FromBody] Unit unit)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != unit.Id)
                return BadRequest(Error<Unit>("ID mismatch", null, 400));
            var updatedUnit = await _unitService.UpdateUnitAsync(unit);
            if (updatedUnit == null)
                return NotFound(Error<Unit>("Unit not found", null, 404));
            return Success(updatedUnit);
        }
        catch (Exception ex)
        {
            return Error<Unit>("An error occurred while updating the unit", ex.Message);
        }
    }

    /// <summary>
    /// Delete a unit
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteUnit(int id)
    {
        try
        {
            var result = await _unitService.DeleteUnitAsync(id);
            if (!result)
                return NotFound(Error<Unit>("Unit not found", null, 404));
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<Unit>("An error occurred while deleting the unit", ex.Message);
        }
    }

    /// <summary>
    /// Get units tree structure
    /// </summary>
    [HttpGet("tree")]
    [ProducesResponseType(typeof(IEnumerable<UnitTreeDto>), 200)]
    public async Task<IActionResult> GetUnitsTree()
    {
        try
        {
            var tree = await _unitService.GetUnitsTreeAsync();
            return Success(tree);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<UnitTreeDto>>("An error occurred while retrieving units tree", ex.Message);
        }
    }

    /// <summary>
    /// Get root units in tree format
    /// </summary>
    [HttpGet("tree/roots")]
    [ProducesResponseType(typeof(IEnumerable<UnitTreeDto>), 200)]
    public async Task<IActionResult> GetRootUnitsTree()
    {
        try
        {
            var rootUnitsTree = await _unitService.GetRootUnitsTreeAsync();
            return Success(rootUnitsTree);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<UnitTreeDto>>("An error occurred while retrieving root units tree", ex.Message);
        }
    }

    /// <summary>
    /// Get root units
    /// </summary>
    [HttpGet("root-units")]
    [ProducesResponseType(typeof(IEnumerable<Unit>), 200)]
    public async Task<IActionResult> GetRootUnits()
    {
        try
        {
            var rootUnits = await _unitService.GetRootUnitsAsync();
            return Success(rootUnits);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Unit>>("An error occurred while retrieving root units", ex.Message);
        }
    }

    /// <summary>
    /// Get unit children
    /// </summary>
    [HttpGet("{id}/children")]
    [ProducesResponseType(typeof(IEnumerable<Unit>), 200)]
    public async Task<IActionResult> GetUnitChildren(int id)
    {
        try
        {
            var children = await _unitService.GetUnitChildrenAsync(id);
            return Success(children);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Unit>>("An error occurred while retrieving unit children", ex.Message);
        }
    }

    /// <summary>
    /// Get unit children in tree format (for lazy loading)
    /// </summary>
    [HttpGet("{id}/children/tree")]
    [ProducesResponseType(typeof(IEnumerable<UnitTreeDto>), 200)]
    public async Task<IActionResult> GetUnitChildrenTree(int id)
    {
        try
        {
            var childrenTree = await _unitService.GetUnitChildrenTreeAsync(id);
            return Success(childrenTree);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<UnitTreeDto>>("An error occurred while retrieving unit children tree", ex.Message);
        }
    }

    /// <summary>
    /// Get unit path (breadcrumb)
    /// </summary>
    [HttpGet("{id}/path")]
    [ProducesResponseType(typeof(IEnumerable<Unit>), 200)]
    public async Task<IActionResult> GetUnitPath(int id)
    {
        try
        {
            var path = await _unitService.GetUnitPathAsync(id);
            return Success(path);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Unit>>("An error occurred while retrieving unit path", ex.Message);
        }
    }

    /// <summary>
    /// Search units
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<Unit>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> SearchUnits([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(Error<IEnumerable<Unit>>("Search query is required", null, 400));
            }

            var searchResults = await _unitService.SearchUnitsAsync(q);
            return Success(new { data = searchResults, searchQuery = q });
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Unit>>("An error occurred while searching units", ex.Message);
        }
    }

    /// <summary>
    /// Get unit statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(UnitStatsDto), 200)]
    public async Task<IActionResult> GetUnitStats()
    {
        try
        {
            var stats = await _unitService.GetUnitStatsAsync();
            return Success(stats);
        }
        catch (Exception ex)
        {
            return Error<UnitStatsDto>("An error occurred while retrieving unit statistics", ex.Message);
        }
    }
}