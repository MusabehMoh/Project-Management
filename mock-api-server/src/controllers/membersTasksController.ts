import { Request, Response } from 'express';

import { MemberTask, TaskSearchParams, TasksResponse, TaskFiltersData } from '../types/membersTasks.js';

// Mock data generator function
const generateMockTasks = (): MemberTask[] => {
  const statuses = [
    { id: 1, label: 'Not Started', color: 'default' },
    { id: 2, label: 'In Progress', color: 'primary' },
    { id: 3, label: 'Review', color: 'warning' },
    { id: 4, label: 'Completed', color: 'success' },
    { id: 5, label: 'Blocked', color: 'danger' }
  ];

  const priorities = [
    { id: 1, label: 'Low', color: 'default' },
    { id: 2, label: 'Medium', color: 'primary' },
    { id: 3, label: 'High', color: 'warning' },
    { id: 4, label: 'Critical', color: 'danger' }
  ];

  const departments = [
    { id: '1', name: 'Engineering', color: '#3b82f6' },
    { id: '2', name: 'Design', color: '#8b5cf6' },
    { id: '3', name: 'Marketing', color: '#10b981' },
    { id: '4', name: 'Sales', color: '#f59e0b' },
    { id: '5', name: 'HR', color: '#ef4444' },
    { id: '6', name: 'Operations', color: '#6366f1' },
    { id: '7', name: 'Finance', color: '#84cc16' },
    { id: '8', name: 'Support', color: '#06b6d4' }
  ];

  const employees = [
    { id: 1, userName: 'ahmed.hassan', militaryNumber: 'M001', fullName: 'Ahmed Hassan', gradeName: 'Captain', statusId: 1, department: 'Engineering' },
    { id: 2, userName: 'sara.ahmed', militaryNumber: 'M002', fullName: 'Sara Ahmed', gradeName: 'Lieutenant', statusId: 1, department: 'Design' },
    { id: 3, userName: 'mohammed.ali', militaryNumber: 'M003', fullName: 'Mohammed Ali', gradeName: 'Major', statusId: 1, department: 'Engineering' },
    { id: 4, userName: 'fatima.omar', militaryNumber: 'M004', fullName: 'Fatima Omar', gradeName: 'Colonel', statusId: 1, department: 'Marketing' },
    { id: 5, userName: 'khalid.salem', militaryNumber: 'M005', fullName: 'Khalid Salem', gradeName: 'Captain', statusId: 1, department: 'Sales' },
    { id: 6, userName: 'aisha.mahmoud', militaryNumber: 'M006', fullName: 'Aisha Mahmoud', gradeName: 'Lieutenant', statusId: 1, department: 'HR' },
    { id: 7, userName: 'omar.hassan', militaryNumber: 'M007', fullName: 'Omar Hassan', gradeName: 'Major', statusId: 1, department: 'Operations' },
    { id: 8, userName: 'nour.ahmed', militaryNumber: 'M008', fullName: 'Nour Ahmed', gradeName: 'Captain', statusId: 1, department: 'Finance' },
    { id: 9, userName: 'youssef.ali', militaryNumber: 'M009', fullName: 'Youssef Ali', gradeName: 'Lieutenant', statusId: 1, department: 'Support' },
    { id: 10, userName: 'maryam.omar', militaryNumber: 'M010', fullName: 'Maryam Omar', gradeName: 'Colonel', statusId: 1, department: 'Engineering' }
  ];

  const projects = [
    { id: '1', name: 'E-Commerce Platform' },
    { id: '2', name: 'Mobile Banking App' },
    { id: '3', name: 'HR Management System' },
    { id: '4', name: 'Inventory Management' },
    { id: '5', name: 'Customer Portal' }
  ];

  const requirements = [
    { id: '1', name: 'User Authentication' },
    { id: '2', name: 'Payment Gateway' },
    { id: '3', name: 'Data Analytics' },
    { id: '4', name: 'Mobile Responsiveness' },
    { id: '5', name: 'Security Implementation' }
  ];

  const taskNames = [
    'Database Schema Design', 'API Endpoint Development', 'Frontend Component Creation',
    'User Interface Design', 'Payment Integration', 'Security Audit',
    'Performance Optimization', 'Bug Fixes and Testing', 'Documentation Writing',
    'Code Review', 'Deployment Setup', 'Monitoring Implementation',
    'Database Migration', 'Feature Testing', 'User Acceptance Testing',
    'Backend API Development', 'Frontend Integration', 'Mobile App Testing',
    'Security Penetration Testing', 'Performance Load Testing', 'Data Backup Setup',
    'System Configuration', 'Third-party Integration', 'Error Handling',
    'Responsive Design Implementation', 'Accessibility Compliance', 'SEO Optimization',
    'Cache Implementation', 'Email Service Setup', 'Notification System'
  ];

  const tags = [
    'Backend', 'Frontend', 'Database', 'Security', 'Testing', 'Performance',
    'Mobile', 'API', 'UI/UX', 'Integration', 'Documentation', 'DevOps'
  ];

  const tasks: MemberTask[] = [];
  
  for (let i = 1; i <= 85; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 5);
    
    const isOverdue = Math.random() < 0.15 && endDate < new Date();
    const progress = Math.floor(Math.random() * 101);
    
    const department = departments[Math.floor(Math.random() * departments.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const project = projects[Math.floor(Math.random() * projects.length)];
    const requirement = requirements[Math.floor(Math.random() * requirements.length)];
    
    // Assign 1-4 members to each task (weighted towards 1-2)
    const numAssignees = Math.random() < 0.6 ? 1 : 
                        Math.random() < 0.8 ? 2 : 
                        Math.random() < 0.95 ? 3 : 4;
    
    const shuffledEmployees = [...employees].sort(() => Math.random() - 0.5);
    const assignedMembers = shuffledEmployees.slice(0, numAssignees);
    const primaryAssignee = assignedMembers[0];
    
    const taskTagCount = Math.floor(Math.random() * 4) + 1;
    const taskTags = [...tags].sort(() => Math.random() - 0.5).slice(0, taskTagCount);
    
    const timeSpent = Math.floor(Math.random() * 40) + 1;
    const estimatedTime = timeSpent + Math.floor(Math.random() * 20) + 5;

    tasks.push({
      id: i.toString(),
      name: taskNames[Math.floor(Math.random() * taskNames.length)],
      description: `Detailed description for task ${i}. This task involves implementing specific functionality that requires careful attention to detail and collaboration with team members.`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      progress,
      status,
      priority,
      department,
      assignedMembers,
      primaryAssignee,
      memberIds: assignedMembers.map(m => m.id),
      project,
      requirement,
      timeSpent,
      estimatedTime,
      tags: taskTags,
      isOverdue,
      createdAt: new Date(startDate.getTime() - Math.random() * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return tasks;
};

// Global tasks array (in a real app, this would be in a database)
let mockTasks = generateMockTasks();

// Filter tasks based on search parameters
const filterTasks = (tasks: MemberTask[], params: TaskSearchParams): MemberTask[] => {
  let filtered = [...tasks];
  
  // Search by name
  if (params.search) {
    filtered = filtered.filter(task => 
      task.name.toLowerCase().includes(params.search!.toLowerCase()) ||
      task.description.toLowerCase().includes(params.search!.toLowerCase())
    );
  }
  
  // Filter by members
  if (params.memberIds && params.memberIds.length > 0) {
    filtered = filtered.filter(task => {
      if (params.memberFilterMode === 'all') {
        // Task must have ALL selected members
        return params.memberIds!.every(id => task.memberIds.includes(id));
      } else {
        // Task must have ANY of the selected members
        return params.memberIds!.some(id => task.memberIds.includes(id));
      }
    });
  }
  
  // Filter by departments
  if (params.departmentIds && params.departmentIds.length > 0) {
    filtered = filtered.filter(task => 
      params.departmentIds!.includes(task.department.id.toString())
    );
  }
  
  // Filter by statuses
  if (params.statusIds && params.statusIds.length > 0) {
    filtered = filtered.filter(task => 
      params.statusIds!.includes(task.status.id)
    );
  }
  
  // Filter by priorities
  if (params.priorityIds && params.priorityIds.length > 0) {
    filtered = filtered.filter(task => 
      params.priorityIds!.includes(task.priority.id)
    );
  }
  
  // Filter by overdue
  if (params.isOverdue) {
    filtered = filtered.filter(task => task.isOverdue);
  }
  
  // Filter by date range
  if (params.dateRange) {
    const startDate = new Date(params.dateRange.start);
    const endDate = new Date(params.dateRange.end);
    filtered = filtered.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return (taskStart >= startDate && taskStart <= endDate) ||
             (taskEnd >= startDate && taskEnd <= endDate) ||
             (taskStart <= startDate && taskEnd >= endDate);
    });
  }
  
  return filtered;
};

// Sort tasks
const sortTasks = (tasks: MemberTask[], sortBy: string = 'startDate', sortOrder: 'asc' | 'desc' = 'asc'): MemberTask[] => {
  return [...tasks].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'startDate':
        aVal = new Date(a.startDate);
        bVal = new Date(b.startDate);
        break;
      case 'endDate':
        aVal = new Date(a.endDate);
        bVal = new Date(b.endDate);
        break;
      case 'priority':
        aVal = a.priority.id;
        bVal = b.priority.id;
        break;
      case 'progress':
        aVal = a.progress;
        bVal = b.progress;
        break;
      default:
        aVal = new Date(a.startDate);
        bVal = new Date(b.startDate);
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

// Get all tasks with pagination and filtering
export const getAllMembersTasks = async (req: Request, res: Response) => {
  try {
    const params: TaskSearchParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string,
      memberIds: req.query.memberIds ? 
        (req.query.memberIds as string).split(',').map(id => parseInt(id)) : undefined,
      memberFilterMode: (req.query.memberFilterMode as 'any' | 'all') || 'any',
      departmentIds: req.query.departmentIds ? 
        (req.query.departmentIds as string).split(',') : undefined,
      statusIds: req.query.statusIds ? 
        (req.query.statusIds as string).split(',').map(id => parseInt(id)) : undefined,
      priorityIds: req.query.priorityIds ? 
        (req.query.priorityIds as string).split(',').map(id => parseInt(id)) : undefined,
      isOverdue: req.query.isOverdue === 'true',
      dateRange: req.query.dateRangeStart && req.query.dateRangeEnd ? {
        start: req.query.dateRangeStart as string,
        end: req.query.dateRangeEnd as string
      } : undefined,
      sortBy: (req.query.sortBy as any) || 'startDate',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
    };

    // Filter tasks
    let filtered = filterTasks(mockTasks, params);
    
    // Sort tasks
    filtered = sortTasks(filtered, params.sortBy, params.sortOrder);
    
    // Pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / params.limit!);
    const skip = (params.page! - 1) * params.limit!;
    const paginatedTasks = filtered.slice(skip, skip + params.limit!);
    
    const response: TasksResponse = {
      tasks: paginatedTasks,
      totalCount,
      totalPages,
      currentPage: params.page!,
      hasNextPage: params.page! < totalPages,
      hasPrevPage: params.page! > 1
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching members tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get filter options
export const getTaskFilters = async (req: Request, res: Response) => {
  try {
    const filtersData: TaskFiltersData = {
      statuses: [
        { id: 1, label: 'Not Started', color: 'default' },
        { id: 2, label: 'In Progress', color: 'primary' },
        { id: 3, label: 'Review', color: 'warning' },
        { id: 4, label: 'Completed', color: 'success' },
        { id: 5, label: 'Blocked', color: 'danger' }
      ],
      priorities: [
        { id: 1, label: 'Low', color: 'default' },
        { id: 2, label: 'Medium', color: 'primary' },
        { id: 3, label: 'High', color: 'warning' },
        { id: 4, label: 'Critical', color: 'danger' }
      ],
      departments: [
        { id: '1', name: 'Engineering', color: '#3b82f6' },
        { id: '2', name: 'Design', color: '#8b5cf6' },
        { id: '3', name: 'Marketing', color: '#10b981' },
        { id: '4', name: 'Sales', color: '#f59e0b' },
        { id: '5', name: 'HR', color: '#ef4444' },
        { id: '6', name: 'Operations', color: '#6366f1' },
        { id: '7', name: 'Finance', color: '#84cc16' },
        { id: '8', name: 'Support', color: '#06b6d4' }
      ],
      members: [
        { id: 1, userName: 'ahmed.hassan', militaryNumber: 'M001', fullName: 'Ahmed Hassan', gradeName: 'Captain', statusId: 1, department: 'Engineering' },
        { id: 2, userName: 'sara.ahmed', militaryNumber: 'M002', fullName: 'Sara Ahmed', gradeName: 'Lieutenant', statusId: 1, department: 'Design' },
        { id: 3, userName: 'mohammed.ali', militaryNumber: 'M003', fullName: 'Mohammed Ali', gradeName: 'Major', statusId: 1, department: 'Engineering' },
        { id: 4, userName: 'fatima.omar', militaryNumber: 'M004', fullName: 'Fatima Omar', gradeName: 'Colonel', statusId: 1, department: 'Marketing' },
        { id: 5, userName: 'khalid.salem', militaryNumber: 'M005', fullName: 'Khalid Salem', gradeName: 'Captain', statusId: 1, department: 'Sales' },
        { id: 6, userName: 'aisha.mahmoud', militaryNumber: 'M006', fullName: 'Aisha Mahmoud', gradeName: 'Lieutenant', statusId: 1, department: 'HR' },
        { id: 7, userName: 'omar.hassan', militaryNumber: 'M007', fullName: 'Omar Hassan', gradeName: 'Major', statusId: 1, department: 'Operations' },
        { id: 8, userName: 'nour.ahmed', militaryNumber: 'M008', fullName: 'Nour Ahmed', gradeName: 'Captain', statusId: 1, department: 'Finance' },
        { id: 9, userName: 'youssef.ali', militaryNumber: 'M009', fullName: 'Youssef Ali', gradeName: 'Lieutenant', statusId: 1, department: 'Support' },
        { id: 10, userName: 'maryam.omar', militaryNumber: 'M010', fullName: 'Maryam Omar', gradeName: 'Colonel', statusId: 1, department: 'Engineering' }
      ]
    };
    
    res.json(filtersData);
  } catch (error) {
    console.error('Error fetching task filters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export tasks
export const exportMembersTasks = async (req: Request, res: Response) => {
  try {
    const format = req.query.format as string || 'csv';
    
    // Get filtered tasks (same logic as getAllMembersTasks)
    const params: TaskSearchParams = {
      page: 1,
      limit: 1000, // Get all for export
      search: req.query.search as string,
      memberIds: req.query.memberIds ? 
        (req.query.memberIds as string).split(',').map(id => parseInt(id)) : undefined,
      memberFilterMode: (req.query.memberFilterMode as 'any' | 'all') || 'any',
      departmentIds: req.query.departmentIds ? 
        (req.query.departmentIds as string).split(',') : undefined,
      statusIds: req.query.statusIds ? 
        (req.query.statusIds as string).split(',').map(id => parseInt(id)) : undefined,
      priorityIds: req.query.priorityIds ? 
        (req.query.priorityIds as string).split(',').map(id => parseInt(id)) : undefined,
      isOverdue: req.query.isOverdue === 'true',
      dateRange: req.query.dateRangeStart && req.query.dateRangeEnd ? {
        start: req.query.dateRangeStart as string,
        end: req.query.dateRangeEnd as string
      } : undefined,
      sortBy: (req.query.sortBy as any) || 'startDate',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
    };

    let filtered = filterTasks(mockTasks, params);
    filtered = sortTasks(filtered, params.sortBy, params.sortOrder);

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Task Name,Description,Primary Assignee,All Assignees,Department,Status,Priority,Progress,Start Date,End Date,Time Spent,Estimated Time,Overdue,Tags\n';
      const csvData = filtered.map(task => {
        const primaryAssignee = task.primaryAssignee ? `${task.primaryAssignee.gradeName} ${task.primaryAssignee.fullName}` : 'N/A';
        const allAssignees = task.assignedMembers.map(m => `${m.gradeName} ${m.fullName}`).join('; ');
        
        return [
          `"${task.name}"`,
          `"${task.description}"`,
          `"${primaryAssignee}"`,
          `"${allAssignees}"`,
          `"${task.department.name}"`,
          `"${task.status.label}"`,
          `"${task.priority.label}"`,
          `${task.progress}%`,
          task.startDate,
          task.endDate,
          `${task.timeSpent}h`,
          `${task.estimatedTime}h`,
          task.isOverdue ? 'Yes' : 'No',
          `"${task.tags.join(', ')}"`
        ].join(',');
      }).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="members-tasks-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      // For PDF and Excel, return JSON for now (would implement actual generation in real app)
      res.json({ 
        message: `Export format ${format} not implemented yet`,
        data: filtered
      });
    }
  } catch (error) {
    console.error('Error exporting tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
