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
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var (units, totalCount) = await _unitService.GetUnitsAsync(page, limit, isActive);
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
}