import type { ApiResponse } from "@/types/user";

import { apiClient } from "./client";

export interface ImpersonationStatus {
  isImpersonating: boolean;
  realUserName: string;
  impersonatedUserName?: string;
  startTime?: string;
}

/**
 * User Impersonation Service
 * Handles impersonation requests and status checks
 */
export class ImpersonationService {
  private baseUrl = "/users/impersonate";

  /**
   * Start impersonating a user
   */
  async startImpersonation(
    userNameToImpersonate: string,
  ): Promise<ApiResponse<object>> {
    return apiClient.post<object>(`${this.baseUrl}`, {
      userNameToImpersonate,
    });
  }

  /**
   * Stop impersonating a user
   */
  async stopImpersonation(): Promise<ApiResponse<object>> {
    return apiClient.post<object>(`${this.baseUrl}/stop`);
  }

  /**
   * Get current impersonation status
   */
  async getImpersonationStatus(): Promise<ApiResponse<ImpersonationStatus>> {
    return apiClient.get<ImpersonationStatus>(`${this.baseUrl}/status`);
  }
}

export const impersonationService = new ImpersonationService();
