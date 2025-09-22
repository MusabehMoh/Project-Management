using Microsoft.AspNetCore.Mvc;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

public abstract class ApiBaseController : ControllerBase
{
    // Global helper for success response
    protected IActionResult Success<T>(T data, PaginationInfo? pagination = null, string? message = null)
        => Ok(new ApiResponse<T> { Success = true, Data = data, Pagination = pagination, Message = message });

    // Global helper for created response
    protected IActionResult Created<T>(T data, string actionName, object routeValues, string? message = null)
        => CreatedAtAction(actionName, routeValues, new ApiResponse<T> { Success = true, Data = data, Message = message });

    // Global helper for error response
    protected IActionResult Error<T>(string message, string? error = null, int status = 500)
        => StatusCode(status, new ApiResponse<T> { Success = false, Message = message, Error = error });
}
