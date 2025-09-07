import { Request, Response } from "express";
import { mockTimelineRequirements } from "../data/mockTimelineRequirements.js";
import { mockTimelines } from "../data/mockTimelines.js";
import { 
  TimelineRequirement, 
  CreateTimelineFromRequirementRequest,
  UpdateTimelineRequirementRequest 
} from "../types/timelineRequirement.js";

let timelineRequirements = [...mockTimelineRequirements];
let nextId = Math.max(...timelineRequirements.map(tr => tr.id)) + 1;

// Get all timeline requirements with filters
export const getTimelineRequirements = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      priority, 
      projectId, 
      assignedManager,
      page = "1", 
      pageSize = "20" 
    } = req.query;

    let filtered = timelineRequirements;

    // Apply filters
    if (status) {
      const statusArray = (status as string).split(',');
      filtered = filtered.filter(tr => statusArray.includes(tr.status));
    }

    if (priority && tr.requirement) {
      const priorityArray = (priority as string).split(',');
      filtered = filtered.filter(tr => 
        tr.requirement && priorityArray.includes(tr.requirement.priority)
      );
    }

    if (projectId) {
      filtered = filtered.filter(tr => 
        tr.requirement?.project?.id === parseInt(projectId as string)
      );
    }

    if (assignedManager) {
      filtered = filtered.filter(tr => 
        tr.assignedManager === parseInt(assignedManager as string)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedResults = filtered.slice(startIndex, endIndex);

    // Stats
    const stats = {
      total: filtered.length,
      pending: filtered.filter(tr => tr.status === 'pending').length,
      timelineCreated: filtered.filter(tr => tr.status === 'timeline_created').length,
      inProgress: filtered.filter(tr => tr.status === 'in_progress').length,
      completed: filtered.filter(tr => tr.status === 'completed').length,
    };

    res.json({
      success: true,
      data: paginatedResults,
      stats,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(filtered.length / pageSizeNum),
        totalItems: filtered.length,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch timeline requirements" 
    });
  }
};

// Get timeline requirement by ID
export const getTimelineRequirementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timelineRequirement = timelineRequirements.find(
      tr => tr.id === parseInt(id)
    );

    if (!timelineRequirement) {
      return res.status(404).json({ 
        success: false, 
        message: "Timeline requirement not found" 
      });
    }

    res.json({
      success: true,
      data: timelineRequirement,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch timeline requirement" 
    });
  }
};

// Create timeline from requirement
export const createTimelineFromRequirement = async (req: Request, res: Response) => {
  try {
    const data: CreateTimelineFromRequirementRequest = req.body;

    // Find the timeline requirement
    const timelineRequirement = timelineRequirements.find(
      tr => tr.requirementId === data.requirementId
    );

    if (!timelineRequirement) {
      return res.status(404).json({ 
        success: false, 
        message: "Timeline requirement not found" 
      });
    }

    if (timelineRequirement.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: "Timeline already created for this requirement" 
      });
    }

    // Create new timeline (simplified for mock)
    const newTimeline = {
      id: mockTimelines.length + 1,
      treeId: `timeline-${mockTimelines.length + 1}`,
      projectId: timelineRequirement.requirement?.project?.id || 1,
      projectRequirementId: data.requirementId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sprints: [],
    };

    // Update timeline requirement status
    const updatedTimelineRequirement = {
      ...timelineRequirement,
      timelineId: newTimeline.id,
      status: 'timeline_created' as const,
      assignedManager: data.assignedManager,
      updatedAt: new Date().toISOString(),
      timeline: {
        id: newTimeline.id,
        name: newTimeline.name,
        description: newTimeline.description,
        startDate: newTimeline.startDate,
        endDate: newTimeline.endDate,
        projectId: newTimeline.projectId,
      },
    };

    // Update in memory storage
    const index = timelineRequirements.findIndex(tr => tr.id === timelineRequirement.id);
    timelineRequirements[index] = updatedTimelineRequirement;

    res.status(201).json({
      success: true,
      data: {
        timelineRequirement: updatedTimelineRequirement,
        timeline: newTimeline,
      },
      message: "Timeline created successfully from requirement",
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to create timeline from requirement" 
    });
  }
};

// Update timeline requirement
export const updateTimelineRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateTimelineRequirementRequest = req.body;

    const index = timelineRequirements.findIndex(tr => tr.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Timeline requirement not found" 
      });
    }

    const updatedTimelineRequirement = {
      ...timelineRequirements[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    timelineRequirements[index] = updatedTimelineRequirement;

    res.json({
      success: true,
      data: updatedTimelineRequirement,
      message: "Timeline requirement updated successfully",
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to update timeline requirement" 
    });
  }
};

// Delete timeline requirement
export const deleteTimelineRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = timelineRequirements.findIndex(tr => tr.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Timeline requirement not found" 
      });
    }

    timelineRequirements.splice(index, 1);

    res.json({
      success: true,
      message: "Timeline requirement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete timeline requirement" 
    });
  }
};
