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
    /// Get all lookups with optional filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetLookups(
        [FromQuery] string? code = null)
    {
        try
        {
            var lookups = await _lookupService.GetLookupsAsync(code);
            var response = new ApiResponse<IEnumerable<LookupDto>>
            {
                Success = true,
                Data = lookups
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<LookupDto>>("An error occurred while retrieving lookups", ex.Message);
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
                var notFoundResponse = new ApiResponse<LookupDto>
                {
                    Success = false,
                    Message = "Lookup not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<LookupDto>
            {
                Success = true,
                Data = lookup
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<LookupDto>
            {
                Success = false,
                Message = "An error occurred while retrieving the lookup",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get lookups by code
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetLookupsByCategory(string code)
    {
        try
        {
            var lookups = await _lookupService.GetLookupsByCategoryAsync(code);
            var response = new ApiResponse<IEnumerable<LookupDto>>
            {
                Success = true,
                Data = lookups
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<LookupDto>>
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
                var validationResponse = new ApiResponse<LookupDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            var createdLookup = await _lookupService.CreateLookupAsync(lookup);
            var response = new ApiResponse<LookupDto>
            {
                Success = true,
                Data = createdLookup,
                Message = "Lookup created successfully"
            };
            
            return CreatedAtAction(nameof(GetLookupById), new { id = createdLookup.Id }, response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<LookupDto>
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
                var validationResponse = new ApiResponse<LookupDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != lookup.Id)
            {
                var mismatchResponse = new ApiResponse<LookupDto>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedLookup = await _lookupService.UpdateLookupAsync(lookup);
            if (updatedLookup == null)
            {
                var notFoundResponse = new ApiResponse<LookupDto>
                {
                    Success = false,
                    Message = "Lookup not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<LookupDto>
            {
                Success = true,
                Data = updatedLookup,
                Message = "Lookup updated successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<LookupDto>
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