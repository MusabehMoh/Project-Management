// Calendar event interface for mock data
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'project' | 'requirement' | 'meeting' | 'deadline' | 'milestone';
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: number;
  requirementId?: number;
  assignedTo?: number[];
  location?: string;
  isAllDay?: boolean;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// Mock calendar events data
export const mockCalendarEvents: CalendarEvent[] = [
  // Meeting with LOW priority and UPCOMING status
  {
    id: 101,
    title: "Coffee Chat with Team",
    description: "Informal team building coffee session",
    startDate: "2025-09-28T10:00:00Z",
    endDate: "2025-09-28T10:30:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "low",
    assignedTo: [4, 5, 6],
    location: "Cafeteria",
    isAllDay: false,
    createdBy: 4,
    createdAt: "2025-09-25T08:00:00Z",
    updatedAt: "2025-09-25T08:00:00Z"
  },
  
  // Meeting with MEDIUM priority and IN-PROGRESS status
  {
    id: 102,
    title: "Sprint Planning Session",
    description: "Planning meeting for the next development sprint",
    startDate: "2025-09-27T14:00:00Z",
    endDate: "2025-09-27T16:00:00Z",
    type: "meeting",
    status: "in-progress",
    priority: "medium",
    assignedTo: [4, 5, 6, 7],
    location: "Meeting Room B",
    isAllDay: false,
    createdBy: 5,
    createdAt: "2025-09-20T08:00:00Z",
    updatedAt: "2025-09-27T14:00:00Z"
  },

  // Meeting with HIGH priority and COMPLETED status
  {
    id: 103,
    title: "Client Presentation Review",
    description: "Final review of presentation materials before client meeting",
    startDate: "2025-09-25T09:00:00Z",
    endDate: "2025-09-25T11:00:00Z",
    type: "meeting",
    status: "completed",
    priority: "high",
    assignedTo: [4, 5, 6, 8],
    location: "Executive Conference Room",
    isAllDay: false,
    createdBy: 6,
    createdAt: "2025-09-20T10:00:00Z",
    updatedAt: "2025-09-25T11:00:00Z"
  },

  // Meeting with CRITICAL priority and OVERDUE status
  {
    id: 104,
    title: "Emergency Security Briefing",
    description: "Urgent security incident response meeting",
    startDate: "2025-09-26T08:00:00Z",
    endDate: "2025-09-26T09:00:00Z",
    type: "meeting",
    status: "overdue",
    priority: "critical",
    assignedTo: [4, 5, 6, 7, 8, 9],
    location: "Secure Conference Room",
    isAllDay: false,
    createdBy: 7,
    createdAt: "2025-09-26T07:30:00Z",
    updatedAt: "2025-09-26T09:30:00Z"
  },

  // Additional meeting with LOW priority and COMPLETED status
  {
    id: 105,
    title: "Monthly Newsletter Review",
    description: "Review content for the monthly company newsletter",
    startDate: "2025-09-24T15:00:00Z",
    endDate: "2025-09-24T15:30:00Z",
    type: "meeting",
    status: "completed",
    priority: "low",
    assignedTo: [5, 9],
    location: "Marketing Office",
    isAllDay: false,
    createdBy: 9,
    createdAt: "2025-09-20T12:00:00Z",
    updatedAt: "2025-09-24T15:30:00Z"
  },

  // Meeting with MEDIUM priority and OVERDUE status
  {
    id: 106,
    title: "Budget Review Meeting",
    description: "Quarterly budget review and planning session",
    startDate: "2025-09-25T13:00:00Z",
    endDate: "2025-09-25T14:30:00Z",
    type: "meeting",
    status: "overdue",
    priority: "medium",
    assignedTo: [4, 6, 8],
    location: "Finance Conference Room",
    isAllDay: false,
    createdBy: 8,
    createdAt: "2025-09-18T10:00:00Z",
    updatedAt: "2025-09-25T15:00:00Z"
  },

  // Meeting with HIGH priority and UPCOMING status
  {
    id: 107,
    title: "Product Launch Strategy",
    description: "Strategic planning for upcoming product launch",
    startDate: "2025-09-30T10:00:00Z",
    endDate: "2025-09-30T12:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "high",
    assignedTo: [4, 5, 6, 7, 8],
    location: "Executive Boardroom",
    isAllDay: false,
    createdBy: 4,
    createdAt: "2025-09-22T09:00:00Z",
    updatedAt: "2025-09-22T09:00:00Z"
  },

  // Meeting with CRITICAL priority and IN-PROGRESS status
  {
    id: 108,
    title: "System Outage Response",
    description: "Critical incident response for system outage",
    startDate: "2025-09-27T16:00:00Z",
    endDate: "2025-09-27T18:00:00Z",
    type: "meeting",
    status: "in-progress",
    priority: "critical",
    assignedTo: [4, 5, 7, 8],
    location: "IT Operations Center",
    isAllDay: false,
    createdBy: 7,
    createdAt: "2025-09-27T15:45:00Z",
    updatedAt: "2025-09-27T16:00:00Z"
  },

  // Project milestones and deadlines (original data)
  {
    id: 1,
    title: "Project Alpha Requirements Review",
    description: "Review and approve all functional requirements for Project Alpha before development phase",
    startDate: "2025-09-12T09:00:00Z",
    endDate: "2025-09-12T11:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "high",
    projectId: 1,
    assignedTo: [4, 5, 6],
    location: "Conference Room A",
    isAllDay: false,
    createdBy: 4,
    createdAt: "2025-09-10T08:00:00Z",
    updatedAt: "2025-09-10T08:00:00Z"
  },
  {
    id: 2,
    title: "Beta System Deployment",
    description: "Deploy Beta version to production environment",
    startDate: "2025-09-15T00:00:00Z",
    endDate: "2025-09-15T23:59:59Z",
    type: "milestone",
    status: "upcoming",
    priority: "critical",
    projectId: 2,
    assignedTo: [7, 8],
    isAllDay: true,
    createdBy: 5,
    createdAt: "2025-09-08T10:00:00Z",
    updatedAt: "2025-09-10T15:30:00Z"
  },
  {
    id: 3,
    title: "Requirements Submission Deadline - Gamma Project",
    description: "Final deadline for submitting all requirements for Gamma project",
    startDate: "2025-09-13T17:00:00Z",
    type: "deadline",
    status: "upcoming",
    priority: "high",
    projectId: 3,
    assignedTo: [4, 9],
    isAllDay: false,
    createdBy: 6,
    createdAt: "2025-09-05T12:00:00Z",
    updatedAt: "2025-09-09T14:20:00Z"
  },
  {
    id: 4,
    title: "Weekly Team Standup",
    description: "Weekly progress review and planning session",
    startDate: "2025-09-16T10:00:00Z",
    endDate: "2025-09-16T11:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "medium",
    assignedTo: [4, 5, 6, 7, 8, 9],
    location: "Virtual - Teams",
    isAllDay: false,
    recurring: {
      frequency: "weekly",
      interval: 1,
      endDate: "2025-12-31T23:59:59Z"
    },
    createdBy: 5,
    createdAt: "2025-09-01T09:00:00Z",
    updatedAt: "2025-09-10T08:45:00Z"
  },
  {
    id: 5,
    title: "Delta Requirements Analysis",
    description: "Complete requirements analysis for Delta project phase 1",
    startDate: "2025-09-14T09:00:00Z",
    endDate: "2025-09-14T17:00:00Z",
    type: "requirement",
    status: "in-progress",
    priority: "high",
    projectId: 4,
    requirementId: 15,
    assignedTo: [4],
    isAllDay: false,
    createdBy: 4,
    createdAt: "2025-09-11T08:00:00Z",
    updatedAt: "2025-09-11T16:30:00Z"
  },
  {
    id: 6,
    title: "Security Requirements Workshop",
    description: "Workshop to define security requirements for all active projects",
    startDate: "2025-09-18T13:00:00Z",
    endDate: "2025-09-18T16:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "medium",
    assignedTo: [4, 5, 6, 10],
    location: "Training Room B",
    isAllDay: false,
    createdBy: 6,
    createdAt: "2025-09-09T11:00:00Z",
    updatedAt: "2025-09-10T13:15:00Z"
  },
  {
    id: 7,
    title: "Epsilon Project Kickoff",
    description: "Project kickoff meeting for new Epsilon initiative",
    startDate: "2025-09-20T10:00:00Z",
    endDate: "2025-09-20T12:00:00Z",
    type: "project",
    status: "upcoming",
    priority: "high",
    projectId: 5,
    assignedTo: [5, 6, 7, 11],
    location: "Executive Conference Room",
    isAllDay: false,
    createdBy: 5,
    createdAt: "2025-09-08T14:00:00Z",
    updatedAt: "2025-09-10T09:30:00Z"
  },
  {
    id: 8,
    title: "Alpha Testing Completion",
    description: "Complete all alpha testing activities and compile test report",
    startDate: "2025-09-17T00:00:00Z",
    endDate: "2025-09-17T23:59:59Z",
    type: "milestone",
    status: "upcoming",
    priority: "high",
    projectId: 1,
    assignedTo: [7, 8],
    isAllDay: true,
    createdBy: 7,
    createdAt: "2025-09-07T10:00:00Z",
    updatedAt: "2025-09-10T11:20:00Z"
  },
  {
    id: 9,
    title: "Requirements Validation Session - Beta",
    description: "Validate all requirements with stakeholders before final approval",
    startDate: "2025-09-19T14:00:00Z",
    endDate: "2025-09-19T16:30:00Z",
    type: "requirement",
    status: "upcoming",
    priority: "high",
    projectId: 2,
    requirementId: 8,
    assignedTo: [4, 6],
    location: "Client Site - Building C",
    isAllDay: false,
    createdBy: 4,
    createdAt: "2025-09-10T09:00:00Z",
    updatedAt: "2025-09-10T15:45:00Z"
  },
  {
    id: 10,
    title: "Monthly Requirements Report Due",
    description: "Submit monthly progress report on all requirements activities",
    startDate: "2025-09-30T17:00:00Z",
    type: "deadline",
    status: "upcoming",
    priority: "medium",
    assignedTo: [4, 5, 6],
    isAllDay: false,
    recurring: {
      frequency: "monthly",
      interval: 1,
      endDate: "2025-12-31T23:59:59Z"
    },
    createdBy: 5,
    createdAt: "2025-09-01T08:00:00Z",
    updatedAt: "2025-09-10T10:00:00Z"
  },
  // Past/Completed events
  {
    id: 11,
    title: "Gamma Requirements Workshop",
    description: "Completed requirements gathering workshop for Gamma project",
    startDate: "2025-09-09T09:00:00Z",
    endDate: "2025-09-09T17:00:00Z",
    type: "meeting",
    status: "completed",
    priority: "high",
    projectId: 3,
    assignedTo: [4, 5, 9],
    location: "Workshop Room 1",
    isAllDay: false,
    createdBy: 4,
    createdAt: "2025-09-05T14:00:00Z",
    updatedAt: "2025-09-09T18:00:00Z"
  },
  {
    id: 12,
    title: "System Architecture Review",
    description: "Review system architecture documents for compliance",
    startDate: "2025-09-08T14:00:00Z",
    endDate: "2025-09-08T16:00:00Z",
    type: "requirement",
    status: "completed",
    priority: "medium",
    projectId: 1,
    requirementId: 3,
    assignedTo: [6, 7],
    location: "Technical Review Room",
    isAllDay: false,
    createdBy: 6,
    createdAt: "2025-09-06T10:00:00Z",
    updatedAt: "2025-09-08T16:30:00Z"
  },
  // Overdue events
  {
    id: 13,
    title: "Database Schema Review - OVERDUE",
    description: "Review database schema requirements - this was due yesterday",
    startDate: "2025-09-10T15:00:00Z",
    endDate: "2025-09-10T17:00:00Z",
    type: "requirement",
    status: "overdue",
    priority: "critical",
    projectId: 2,
    requirementId: 12,
    assignedTo: [4, 8],
    location: "Dev Lab 2",
    isAllDay: false,
    createdBy: 4,
    createdAt: "2025-09-08T08:00:00Z",
    updatedAt: "2025-09-10T18:00:00Z"
  },
  {
    id: 14,
    title: "Client Feedback Collection - OVERDUE",
    description: "Collect and document client feedback on current requirements",
    startDate: "2025-09-09T10:00:00Z",
    type: "deadline",
    status: "overdue",
    priority: "high",
    projectId: 3,
    assignedTo: [5, 9],
    isAllDay: false,
    createdBy: 5,
    createdAt: "2025-09-07T12:00:00Z",
    updatedAt: "2025-09-11T08:00:00Z"
  },
  // Future events
  {
    id: 15,
    title: "Q4 Requirements Planning",
    description: "Plan requirements activities for Q4 2025",
    startDate: "2025-09-25T09:00:00Z",
    endDate: "2025-09-25T17:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "medium",
    assignedTo: [4, 5, 6],
    location: "Strategic Planning Room",
    isAllDay: false,
    createdBy: 5,
    createdAt: "2025-09-10T12:00:00Z",
    updatedAt: "2025-09-10T12:00:00Z"
  },
  {
    id: 16,
    title: "Performance Requirements Testing",
    description: "Conduct performance testing against defined requirements",
    startDate: "2025-09-22T08:00:00Z",
    endDate: "2025-09-22T18:00:00Z",
    type: "requirement",
    status: "upcoming",
    priority: "high",
    projectId: 1,
    requirementId: 20,
    assignedTo: [7, 8],
    location: "Testing Lab",
    isAllDay: false,
    createdBy: 7,
    createdAt: "2025-09-10T14:00:00Z",
    updatedAt: "2025-09-10T14:00:00Z"
  },
  {
    id: 17,
    title: "Stakeholder Requirements Sign-off",
    description: "Final sign-off meeting with stakeholders for all project requirements",
    startDate: "2025-09-28T14:00:00Z",
    endDate: "2025-09-28T16:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "critical",
    projectId: 4,
    assignedTo: [4, 5, 6, 10, 11],
    location: "Executive Boardroom",
    isAllDay: false,
    createdBy: 6,
    createdAt: "2025-09-10T16:00:00Z",
    updatedAt: "2025-09-10T16:00:00Z"
  }
];

// Helper function to get events by date range
export const getEventsByDateRange = (startDate: string, endDate: string): CalendarEvent[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return mockCalendarEvents.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
    
    return eventStart <= end && eventEnd >= start;
  });
};

// Helper function to get events by type
export const getEventsByType = (type: CalendarEvent['type']): CalendarEvent[] => {
  return mockCalendarEvents.filter(event => event.type === type);
};

// Helper function to get events by status
export const getEventsByStatus = (status: CalendarEvent['status']): CalendarEvent[] => {
  return mockCalendarEvents.filter(event => event.status === status);
};

// Helper function to get events by priority
export const getEventsByPriority = (priority: CalendarEvent['priority']): CalendarEvent[] => {
  return mockCalendarEvents.filter(event => event.priority === priority);
};

// Helper function to get upcoming events
export const getUpcomingEvents = (limit: number = 10): CalendarEvent[] => {
  const now = new Date();
  return mockCalendarEvents
    .filter(event => new Date(event.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, limit);
};

// Helper function to get overdue events
export const getOverdueEvents = (): CalendarEvent[] => {
  return mockCalendarEvents.filter(event => event.status === 'overdue');
};

// Helper function to calculate calendar stats
export const calculateCalendarStats = () => {
  const totalEvents = mockCalendarEvents.length;
  const upcomingEvents = mockCalendarEvents.filter(e => e.status === 'upcoming').length;
  const overdueEvents = mockCalendarEvents.filter(e => e.status === 'overdue').length;
  
  // Events completed this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedThisWeek = mockCalendarEvents.filter(e => 
    e.status === 'completed' && new Date(e.updatedAt) >= oneWeekAgo
  ).length;
  
  const criticalDeadlines = mockCalendarEvents.filter(e => 
    e.priority === 'critical' && (e.status === 'upcoming' || e.status === 'in-progress')
  ).length;
  
  // Group by type
  const eventsByType = mockCalendarEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<CalendarEvent['type'], number>);
  
  // Ensure all types are represented
  const allTypes: CalendarEvent['type'][] = ['project', 'requirement', 'meeting', 'deadline', 'milestone'];
  allTypes.forEach(type => {
    if (!(type in eventsByType)) {
      eventsByType[type] = 0;
    }
  });
  
  // Group by status
  const eventsByStatus = mockCalendarEvents.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] || 0) + 1;
    return acc;
  }, {} as Record<CalendarEvent['status'], number>);
  
  // Ensure all statuses are represented
  const allStatuses: CalendarEvent['status'][] = ['upcoming', 'in-progress', 'completed', 'overdue'];
  allStatuses.forEach(status => {
    if (!(status in eventsByStatus)) {
      eventsByStatus[status] = 0;
    }
  });
  
  return {
    totalEvents,
    upcomingEvents,
    overdueEvents,
    completedThisWeek,
    criticalDeadlines,
    eventsByType,
    eventsByStatus
  };
};
