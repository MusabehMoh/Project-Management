using Microsoft.AspNetCore.SignalR;
using PMA.Core.Entities;
using System.Threading.Tasks;

namespace PMA.Api.Hubs;

public class NotificationHub : Hub
{
    public override async System.Threading.Tasks.Task OnConnectedAsync()
    {
        var username = Context.GetHttpContext()?.Request.Query["username"].ToString();
        var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();

        if (!string.IsNullOrEmpty(username))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{username}");
        }

        if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var id))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"userid_{id}");
        }

        await base.OnConnectedAsync();
    }

    public override async System.Threading.Tasks.Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    public async System.Threading.Tasks.Task SendNotification(string type, string message, int? projectId = null, string[]? targetUsernames = null, int[]? targetUserIds = null)
    {
        var notification = new
        {
            type,
            message,
            timestamp = DateTime.Now,
            projectId,
            targetUsernames,
            targetUserIds
        };

        if (targetUsernames != null && targetUsernames.Length > 0)
        {
            foreach (var username in targetUsernames)
            {
                await Clients.Group($"user_{username}").SendAsync("Notification", notification);
            }
        }
        else if (targetUserIds != null && targetUserIds.Length > 0)
        {
            foreach (var userId in targetUserIds)
            {
                await Clients.Group($"userid_{userId}").SendAsync("Notification", notification);
            }
        }
        else
        {
            // Broadcast to all clients
            await Clients.All.SendAsync("Notification", notification);
        }
    }

    public async System.Threading.Tasks.Task Authenticate(string username, int? userId = null)
    {
        if (!string.IsNullOrEmpty(username))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{username}");
        }

        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"userid_{userId.Value}");
        }
    }
}