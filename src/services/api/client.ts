import { ApiResponse } from "@/types/project";

// Base API configuration
export const API_CONFIG = {
  // Check runtime config first, then environment variables
  BASE_URL:
    (window as any).PMA_CONFIG?.apiUrl ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3002/api",
  WS_URL:
    (window as any).PMA_CONFIG?.wsUrl ||
    import.meta.env.VITE_WS_URL ||
    "http://localhost:52246/notificationHub",
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "40000"),
  HEADERS: {
    Accept: "application/json",
  },
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === "true",
  ENABLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === "true",
  ENABLE_SIGNALR:
    (window as any).PMA_CONFIG?.enableSignalR !== undefined
      ? (window as any).PMA_CONFIG.enableSignalR
      : import.meta.env.VITE_ENABLE_SIGNALR === "true",
};

// HTTP methods enum
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

// API Error class
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Generic API client
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = API_CONFIG.HEADERS;
  }

  // Get authorization header (for when auth is implemented)
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem("authToken");

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Make HTTP request
  async request<T>(
    endpoint: string,
    method: HttpMethod = HttpMethod.GET,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      ...this.defaultHeaders,
      ...this.getAuthHeader(),
      ...headers,
    };

    // Debug logging for API calls
    if (API_CONFIG.ENABLE_LOGS) {
      if (data) {
      }
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: "include",
      signal: AbortSignal.timeout(this.timeout),
    };

    if (data && method !== HttpMethod.GET) {
      if (data instanceof FormData) {
        config.body = data;
        // Don't set Content-Type for FormData - let browser set it with boundary
      } else {
        config.body = JSON.stringify(data);
        requestHeaders["Content-Type"] = "application/json";
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          // Try to parse as JSON first
          const responseText = await response.text();
          
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              // Handle structured error responses
              errorMessage =
                errorData.error ||
                errorData.message ||
                errorData.title ||
                errorMessage;
            } catch {
              // If not valid JSON, treat as plain text error message
              errorMessage = responseText;
            }
          }
        } catch {
          // If reading response fails, use default message
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {
          success: true,
          data: null,
          message: "Operation completed successfully",
          timestamp: new Date().toISOString(),
        } as ApiResponse<T>;
      }

      const result = await response.json();

      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors, timeouts, etc.
      throw new ApiError(
        error instanceof Error ? error.message : "Network error occurred",
        0,
      );
    }
  }

  // Convenience methods
  async get<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.GET, undefined, headers);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.POST, data, headers);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.PUT, data, headers);
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.PATCH, data, headers);
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.DELETE, undefined, headers);
  }
}

export const apiClient = new ApiClient();
