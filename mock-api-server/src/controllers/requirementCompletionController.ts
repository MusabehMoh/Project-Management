import { Request, Response } from "express";

import { mockProjectRequirements } from "../data/mockProjectRequirements.js";
import { logger } from "../utils/logger.js";
import { mockDelayHandler } from "../utils/mockDelay.js";

export class RequirementCompletionController {
  /**
   * Get requirement completion time analytics
   */
  async getCompletionAnalytics(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Fetching requirement completion analytics");

      const now = new Date();
      const requirements = mockProjectRequirements;

      // Calculate completion metrics
      const completedRequirements = requirements.filter(
        (req) => req.status === "completed",
      );
      const inDevelopmentRequirements = requirements.filter(
        (req) => req.status === "in-development",
      );
      const approvedRequirements = requirements.filter(
        (req) => req.status === "approved",
      );

      // On-time completion analysis
      const onTimeCompleted = completedRequirements.filter((req) => {
        const expectedDate = new Date(req.expectedCompletionDate);
        const updatedDate = new Date(req.updatedAt);

        return updatedDate <= expectedDate;
      });

      // Late completion analysis
      const lateCompleted = completedRequirements.filter((req) => {
        const expectedDate = new Date(req.expectedCompletionDate);
        const updatedDate = new Date(req.updatedAt);

        return updatedDate > expectedDate;
      });

      // Overdue (still in development past expected date)
      const overdueRequirements = inDevelopmentRequirements.filter((req) => {
        const expectedDate = new Date(req.expectedCompletionDate);

        return now > expectedDate;
      });

      // At risk (approaching deadline within 7 days)
      const atRiskRequirements = [
        ...inDevelopmentRequirements,
        ...approvedRequirements,
      ].filter((req) => {
        const expectedDate = new Date(req.expectedCompletionDate);
        const daysUntilDeadline = Math.ceil(
          (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
      });

      // Calculate average completion time
      const avgCompletionTime =
        lateCompleted.length > 0
          ? lateCompleted.reduce((sum, req) => {
              const expectedDate = new Date(req.expectedCompletionDate);
              const completedDate = new Date(req.updatedAt);
              const daysLate = Math.ceil(
                (completedDate.getTime() - expectedDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              );

              return sum + daysLate;
            }, 0) / lateCompleted.length
          : 0;

      // Priority breakdown
      const byPriority = {
        high: {
          total: requirements.filter((req) => req.priority === "high").length,
          onTime: onTimeCompleted.filter((req) => req.priority === "high")
            .length,
          late: lateCompleted.filter((req) => req.priority === "high").length,
          overdue: overdueRequirements.filter((req) => req.priority === "high")
            .length,
        },
        medium: {
          total: requirements.filter((req) => req.priority === "medium").length,
          onTime: onTimeCompleted.filter((req) => req.priority === "medium")
            .length,
          late: lateCompleted.filter((req) => req.priority === "medium").length,
          overdue: overdueRequirements.filter(
            (req) => req.priority === "medium",
          ).length,
        },
        low: {
          total: requirements.filter((req) => req.priority === "low").length,
          onTime: onTimeCompleted.filter((req) => req.priority === "low")
            .length,
          late: lateCompleted.filter((req) => req.priority === "low").length,
          overdue: overdueRequirements.filter((req) => req.priority === "low")
            .length,
        },
      };

      // Monthly trend (last 6 months)
      const monthlyTrend = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          1,
        );

        const monthRequirements = completedRequirements.filter((req) => {
          const completedDate = new Date(req.updatedAt);

          return completedDate >= monthDate && completedDate < nextMonthDate;
        });

        const monthOnTime = monthRequirements.filter((req) => {
          const expectedDate = new Date(req.expectedCompletionDate);
          const completedDate = new Date(req.updatedAt);

          return completedDate <= expectedDate;
        });

        monthlyTrend.push({
          month: monthDate.toISOString().slice(0, 7), // YYYY-MM format
          total: monthRequirements.length,
          onTime: monthOnTime.length,
          onTimeRate:
            monthRequirements.length > 0
              ? Math.round(
                  (monthOnTime.length / monthRequirements.length) * 100,
                )
              : 0,
        });
      }

      const analytics = {
        summary: {
          totalRequirements: requirements.length,
          completedRequirements: completedRequirements.length,
          onTimeCompleted: onTimeCompleted.length,
          lateCompleted: lateCompleted.length,
          overdueRequirements: overdueRequirements.length,
          atRiskRequirements: atRiskRequirements.length,
          onTimeRate:
            completedRequirements.length > 0
              ? Math.round(
                  (onTimeCompleted.length / completedRequirements.length) * 100,
                )
              : 0,
          avgDelayDays: Math.round(avgCompletionTime * 10) / 10, // Round to 1 decimal
        },
        byPriority,
        monthlyTrend,
        overdueItems: overdueRequirements.map((req) => ({
          id: req.id,
          name: req.name,
          priority: req.priority,
          expectedDate: req.expectedCompletionDate,
          daysOverdue: Math.ceil(
            (now.getTime() - new Date(req.expectedCompletionDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          assignedAnalyst: req.assignedAnalyst,
          projectName: req.project?.applicationName,
        })),
        atRiskItems: atRiskRequirements.map((req) => ({
          id: req.id,
          name: req.name,
          priority: req.priority,
          expectedDate: req.expectedCompletionDate,
          daysUntilDeadline: Math.ceil(
            (new Date(req.expectedCompletionDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          assignedAnalyst: req.assignedAnalyst,
          projectName: req.project?.applicationName,
        })),
      };

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error("Error fetching completion analytics:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch completion analytics",
          code: "COMPLETION_ANALYTICS_ERROR",
        },
      });
    }
  }

  /**
   * Get detailed completion metrics for a specific time period
   */
  async getCompletionMetrics(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { period = "month", analystId } = req.query;

      logger.info(
        `Fetching completion metrics for period: ${period}, analyst: ${analystId}`,
      );

      let requirements = mockProjectRequirements;

      // Filter by analyst if specified
      if (analystId) {
        requirements = requirements.filter(
          (req) => req.assignedAnalyst === parseInt(analystId as string),
        );
      }

      const now = new Date();
      let startDate: Date;

      // Determine date range based on period
      switch (period) {
        case "week":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 7,
          );
          break;
        case "quarter":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            now.getDate(),
          );
          break;
        case "year":
          startDate = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate(),
          );
          break;
        default: // month
          startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate(),
          );
      }

      // Filter requirements by time period
      const periodRequirements = requirements.filter((req) => {
        const updatedDate = new Date(req.updatedAt);

        return updatedDate >= startDate;
      });

      const completedInPeriod = periodRequirements.filter(
        (req) => req.status === "completed",
      );
      const onTimeInPeriod = completedInPeriod.filter((req) => {
        const expectedDate = new Date(req.expectedCompletionDate);
        const completedDate = new Date(req.updatedAt);

        return completedDate <= expectedDate;
      });

      const metrics = {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        totalRequirements: periodRequirements.length,
        completedRequirements: completedInPeriod.length,
        onTimeCompleted: onTimeInPeriod.length,
        completionRate:
          periodRequirements.length > 0
            ? Math.round(
                (completedInPeriod.length / periodRequirements.length) * 100,
              )
            : 0,
        onTimeRate:
          completedInPeriod.length > 0
            ? Math.round(
                (onTimeInPeriod.length / completedInPeriod.length) * 100,
              )
            : 0,
      };

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error("Error fetching completion metrics:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch completion metrics",
          code: "COMPLETION_METRICS_ERROR",
        },
      });
    }
  }
}

export const requirementCompletionController =
  new RequirementCompletionController();
