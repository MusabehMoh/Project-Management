using PMA.Core.Entities;
using PMA.Core.Interfaces;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Notification>> GetAllNotificationsAsync()
    {
        return await _notificationRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Notification?> GetNotificationByIdAsync(int id)
    {
        return await _notificationRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Notification> CreateNotificationAsync(Notification notification)
    {
        return await _notificationRepository.AddAsync(notification);
    }

    public async Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsAsync(int page, int limit, int? userId = null, bool? isRead = null)
    {
        return await _notificationRepository.GetNotificationsAsync(page, limit, userId, isRead);
    }

    public async Task<Notification> UpdateNotificationAsync(Notification notification)
    {
        await _notificationRepository.UpdateAsync(notification);
        return notification;
    }

    public async Task<IEnumerable<Notification>> GetNotificationsByUserAsync(int userId)
    {
        return await _notificationRepository.GetNotificationsByUserAsync(userId);
    }

    public async Task<bool> MarkAsReadAsync(int notificationId)
    {
        await _notificationRepository.MarkAsReadAsync(notificationId);
        return true;
    }

    public async Task<bool> DeleteNotificationAsync(int id)
    {
        var notification = await _notificationRepository.GetByIdAsync(id);
        if (notification != null)
        {
            await _notificationRepository.DeleteAsync(notification);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(int userId)
    {
        return await _notificationRepository.GetUnreadNotificationsAsync(userId);
    }

    public async System.Threading.Tasks.Task MarkAllAsReadAsync(int userId)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId);
    }
}


