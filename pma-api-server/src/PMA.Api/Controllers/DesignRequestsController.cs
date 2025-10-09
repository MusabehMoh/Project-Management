using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.DTOs.Tasks;
using PMA.Core.DTOs.DesignRequests;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DesignRequestsController : ApiBaseController
{
    private readonly IDesignRequestService _designRequestService;
    private readonly IUserContextAccessor _userContextAccessor;

    public DesignRequestsController(IDesignRequestService designRequestService, IUserContextAccessor userContextAccessor)
    {
        _designRequestService = designRequestService;
        _userContextAccessor = userContextAccessor;
    }

    /// <summary>
    /// Get all design requests with pagination and filtering
    /// </summary>
    [HttpGet]
    [AllowAnonymous] // Temporary for testing - remove in production
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetDesignRequests(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? taskId = null,
        [FromQuery] int? assignedToPrsId = null,
        [FromQuery] int? status = null,
        [FromQuery] bool includeTaskDetails = false,
        [FromQuery] bool includeRequirementDetails = false)
    {
        try
        {
            var (designRequests, totalCount) = await _designRequestService.GetDesignRequestsAsync(
                page, limit, taskId, assignedToPrsId, status, includeTaskDetails, includeRequirementDetails);

            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(designRequests, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<DesignRequestDto>>("An error occurred while retrieving design requests", ex.Message);
        }
    }

    /// <summary>
    /// Get design request by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDesignRequestById(int id)
    {
        try
        {
            var designRequest = await _designRequestService.GetDesignRequestByIdAsync(id);
            if (designRequest == null)
            {
                var notFoundResponse = new ApiResponse<DesignRequestDto>
                {
                    Success = false,
                    Message = "Design request not found"
                };
                return NotFound(notFoundResponse);
            }

            var response = new ApiResponse<DesignRequestDto>
            {
                Success = true,
                Data = designRequest
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<DesignRequestDto>
            {
                Success = false,
                Message = "An error occurred while retrieving the design request",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get design request by task ID
    /// </summary>
    [HttpGet("task/{taskId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetDesignRequestByTaskId(int taskId)
    {
        try
        {
            var designRequest = await _designRequestService.GetDesignRequestByTaskIdAsync(taskId);
            var response = new ApiResponse<DesignRequestDto?>
            {
                Success = true,
                Data = designRequest
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<DesignRequestDto?>
            {
                Success = false,
                Message = "An error occurred while retrieving design request for task",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Check if a design request exists for a task
    /// </summary>
    [HttpGet("task/{taskId}/exists")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> HasDesignRequestForTask(int taskId)
    {
        try
        {
            var exists = await _designRequestService.HasDesignRequestForTaskAsync(taskId);
            var response = new ApiResponse<bool>
            {
                Success = true,
                Data = exists
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while checking design request existence",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Create a new design request
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateDesignRequest([FromBody] CreateDesignRequestDto designRequest)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<DesignRequestDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            // Get current user context
            var userContext = await _userContextAccessor.GetUserContextAsync();
            if (!userContext.IsAuthenticated || string.IsNullOrWhiteSpace(userContext.PrsId))
            {
                var errorResponse = new ApiResponse<DesignRequestDto>
                {
                    Success = false,
                    Message = "Unable to retrieve current user information"
                };
                return Unauthorized(errorResponse);
            }

            designRequest.CreateBy = userContext.UserName;
            var createdDesignRequest = await _designRequestService.CreateDesignRequestAsync(designRequest);
            var response = new ApiResponse<DesignRequestDto>
            {
                Success = true,
                Data = createdDesignRequest
            };

            return CreatedAtAction(nameof(GetDesignRequestById), new { id = createdDesignRequest.Id }, response);
        }
        catch (InvalidOperationException ex)
        {
            var errorResponse = new ApiResponse<DesignRequestDto>
            {
                Success = false,
                Message = ex.Message,
                Error = ex.Message
            };
            return BadRequest(errorResponse);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<DesignRequestDto>
            {
                Success = false,
                Message = "An error occurred while creating the design request",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Update an existing design request
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateDesignRequest(int id, [FromBody] DesignRequestDto designRequest)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<DesignRequestDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != designRequest.Id)
            {
                var mismatchResponse = new ApiResponse<DesignRequestDto>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedDesignRequest = await _designRequestService.UpdateDesignRequestAsync(designRequest);
            var response = new ApiResponse<DesignRequestDto>
            {
                Success = true,
                Data = updatedDesignRequest,
                Message = "Design request updated successfully"
            };

            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            var notFoundResponse = new ApiResponse<DesignRequestDto>
            {
                Success = false,
                Message = "Design request not found"
            };
            return NotFound(notFoundResponse);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<DesignRequestDto>
            {
                Success = false,
                Message = "An error occurred while updating the design request",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Delete a design request
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDesignRequest(int id)
    {
        try
        {
            var result = await _designRequestService.DeleteDesignRequestAsync(id);
            if (!result)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Design request not found"
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
                Message = "An error occurred while deleting the design request",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Assign design request to a designer
    /// </summary>
    [HttpPatch("{id}/assign")]
    [ProducesResponseType(typeof(ApiResponse<DesignRequestDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> AssignDesignRequest(int id, [FromBody] AssignDesignRequestDto assignDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            var designRequest = await _designRequestService.AssignDesignRequestAsync(id, assignDto.AssignedToPrsId, assignDto.Comment);
            if (designRequest == null)
            {
                return Error<object>("Design request not found", status: 404);
            }

            return Success(designRequest, message: "Design request assigned successfully");
        }
        catch (Exception ex)
        {
            return Error<DesignRequestDto>("An error occurred while assigning the design request", ex.Message);
        }
    }
}