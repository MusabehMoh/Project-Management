import type {
  CompanyEmployee,
  CreateCompanyEmployeeRequest,
  UpdateCompanyEmployeeRequest,
} from "@/types/companyEmployee";

import { apiClient } from "@/services/api/client";

export class CompanyEmployeeService {
  private readonly basePath = "/company-employees";

  async getCompanyEmployees(
    params: {
      page?: number;
      limit?: number;
      search?: string;
    } = {},
  ): Promise<{
    data: CompanyEmployee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 20, search } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search && search.trim()) {
      searchParams.append("search", search.trim());
    }

    const response = await apiClient.get<CompanyEmployee[]>(
      `${this.basePath}?${searchParams.toString()}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch company employees");
    }

    return {
      data: response.data,
      pagination: response.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  async getCompanyEmployeeById(id: number): Promise<CompanyEmployee> {
    const response = await apiClient.get<CompanyEmployee>(
      `${this.basePath}/${id}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch company employee");
    }

    return response.data;
  }

  async createCompanyEmployee(
    data: CreateCompanyEmployeeRequest,
  ): Promise<CompanyEmployee> {
    const response = await apiClient.post<CompanyEmployee>(
      `${this.basePath}`,
      data,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create company employee");
    }

    return response.data;
  }

  async updateCompanyEmployee(
    id: number,
    data: UpdateCompanyEmployeeRequest,
  ): Promise<CompanyEmployee> {
    const response = await apiClient.put<CompanyEmployee>(
      `${this.basePath}/${id}`,
      data,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update company employee");
    }

    return response.data;
  }

  async deleteCompanyEmployee(id: number): Promise<void> {
    const response = await apiClient.delete<string>(`${this.basePath}/${id}`);

    if (!response.success) {
      throw new Error(response.message || "Failed to delete company employee");
    }
  }
}

export const companyEmployeeService = new CompanyEmployeeService();
