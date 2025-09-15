using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookupsController : ApiBaseController
{
    private readonly ILookupService _lookupService;

    public LookupsController(ILookupService lookupService)
    {
        _lookupService = lookupService;
    }

    /// <summary>
    /// Get all lookups with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetLookups(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var (lookups, totalCount) = await _lookupService.GetLookupsAsync(page, limit, category, isActive);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(lookups, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Lookup>>("An error occurred while retrieving lookups", ex.Message);
        }
    }

    /// <summary>
    /// Get lookup by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetLookupById(int id)
    {
        try
        {
            var lookup = await _lookupService.GetLookupByIdAsync(id);
            if (lookup == null)
            {
                var notFoundResponse = new ApiResponse<Lookup>
                {
                    Success = false,
                    Message = "Lookup not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<Lookup>
            {
                Success = true,
                Data = lookup
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<Lookup>
            {
                Success = false,
                Message = "An error occurred while retrieving the lookup",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get lookups by category
    /// </summary>
    [HttpGet("category/{category}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetLookupsByCategory(string category)
    {
        try
        {
            var lookups = await _lookupService.GetLookupsByCategoryAsync(category);
            var response = new ApiResponse<IEnumerable<Lookup>>
            {
                Success = true,
                Data = lookups
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<Lookup>>
            {
                Success = false,
                Message = "An error occurred while retrieving lookups by category",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Create a new lookup
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateLookup([FromBody] Lookup lookup)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<Lookup>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            var createdLookup = await _lookupService.CreateLookupAsync(lookup);
            var response = new ApiResponse<Lookup>
            {
                Success = true,
                Data = createdLookup,
                Message = "Lookup created successfully"
            };
            
            return CreatedAtAction(nameof(GetLookupById), new { id = createdLookup.Id }, response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<Lookup>
            {
                Success = false,
                Message = "An error occurred while creating the lookup",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Update an existing lookup
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateLookup(int id, [FromBody] Lookup lookup)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<Lookup>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != lookup.Id)
            {
                var mismatchResponse = new ApiResponse<Lookup>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedLookup = await _lookupService.UpdateLookupAsync(lookup);
            if (updatedLookup == null)
            {
                var notFoundResponse = new ApiResponse<Lookup>
                {
                    Success = false,
                    Message = "Lookup not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<Lookup>
            {
                Success = true,
                Data = updatedLookup,
                Message = "Lookup updated successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<Lookup>
            {
                Success = false,
                Message = "An error occurred while updating the lookup",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Delete a lookup
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteLookup(int id)
    {
        try
        {
            var result = await _lookupService.DeleteLookupAsync(id);
            if (!result)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lookup not found"
                };
                return NotFound(notFoundResponse);
            }
            
            return NoContent();
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the lookup",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }
}