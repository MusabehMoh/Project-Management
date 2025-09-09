import { Notification } from '@/hooks/useNotifications';

// Mock urgent notifications for development purposes
export const mockUrgentNotifications: Notification[] = [
  {
    id: '1',
    type: 'URGENT_TASK_OVERDUE',
    message: 'Project "Website Redesign" has 2 overdue tasks that need your attention',
    timestamp: new Date(),
    read: false,
    projectId: 1
  },
  {
    id: '2',
    type: 'HIGH_PRIORITY_REVIEW',
    message: 'Your approval is required for critical project milestone',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    read: false,
    projectId: 2
  },
  {
    id: '3',
    type: 'CRITICAL_SYSTEM_UPDATE',
    message: 'System maintenance scheduled in 30 minutes - save all work',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    read: false
  },
  {
    id: '4',
    type: 'DEADLINE_APPROACHING',
    message: 'Project "Mobile App Development" deadline is tomorrow',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    read: false,
    projectId: 2
  }
];

// For testing integration with the notifications hook
export const injectMockUrgentNotifications = (existingNotifications: Notification[]): Notification[] => {
  // Add mock urgent notifications to the existing notifications
  return [...mockUrgentNotifications, ...existingNotifications];
};
