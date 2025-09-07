import type {
  Unit,
  UnitTreeNode,
  UnitFilters,
  UnitStats,
  ApiResponse,
} from "@/types/unit";

import { apiClient } from "./client";

export interface UnitService {
  getUnits(filters?: UnitFilters): Promise<ApiResponse<Unit[]>>;
  getUnitsTree(): Promise<ApiResponse<UnitTreeNode[]>>;
  getRootUnits(): Promise<ApiResponse<UnitTreeNode[]>>;
  getUnitChildren(parentId: number): Promise<ApiResponse<UnitTreeNode[]>>;
  getUnit(id: number): Promise<ApiResponse<Unit>>;
  getUnitPath(unitId: number): Promise<ApiResponse<Unit[]>>;
  searchUnits(term: string): Promise<ApiResponse<Unit[]>>;
  getUnitStats(): Promise<ApiResponse<UnitStats>>;
}

// Real API implementation
class RealUnitService implements UnitService {
  async getUnits(filters?: UnitFilters): Promise<ApiResponse<Unit[]>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.parentId)
        params.append("parentId", filters.parentId.toString());
      if (filters.isActive !== undefined)
        params.append("isActive", filters.isActive.toString());
    }

    const queryString = params.toString();
    const url = `/units${queryString ? `?${queryString}` : ""}`;

    try {
      const response = await apiClient.get<Unit[]>(url);

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Units retrieved successfully",
      } as ApiResponse<Unit[]>;
    } catch (error) {
      throw error;
    }
  }

  async getUnitsTree(): Promise<ApiResponse<UnitTreeNode[]>> {
    try {
      const response = await apiClient.get<UnitTreeNode[]>("/units/tree");

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Units tree retrieved successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async getRootUnits(): Promise<ApiResponse<UnitTreeNode[]>> {
    try {
      const response = await apiClient.get<UnitTreeNode[]>("/units/tree/roots");

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Root units retrieved successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async getUnitChildren(
    parentId: number,
  ): Promise<ApiResponse<UnitTreeNode[]>> {
    try {
      const response = await apiClient.get<UnitTreeNode[]>(
        `/units/${parentId}/children`,
      );

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Unit children retrieved successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async getUnit(id: number): Promise<ApiResponse<Unit>> {
    try {
      const response = await apiClient.get<Unit>(`/units/${id}`);

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Unit retrieved successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async getUnitPath(unitId: number): Promise<ApiResponse<Unit[]>> {
    try {
      const response = await apiClient.get<Unit[]>(`/units/${unitId}/path`);

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Unit path retrieved successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async searchUnits(term: string): Promise<ApiResponse<Unit[]>> {
    const params = new URLSearchParams({ q: term });

    try {
      const response = await apiClient.get<Unit[]>(`/units/search?${params}`);

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Unit search completed successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async getUnitStats(): Promise<ApiResponse<UnitStats>> {
    try {
      const response = await apiClient.get<UnitStats>("/units/stats");

      return {
        success: response.success,
        data: response.data,
        message: response.message || "Unit statistics retrieved successfully",
      };
    } catch (error) {
      throw error;
    }
  }
}

export const realUnitService = new RealUnitService();
