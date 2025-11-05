// TypeScript interfaces for CompanyEmployee functionality
export interface CompanyEmployee {
  id: number;
  userName?: string;
  militaryNumber?: number;
  fullName: string;
  gradeName?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyEmployeeRequest {
  userName?: string;
  fullName: string;
  gradeName?: string;
}

export interface UpdateCompanyEmployeeRequest {
  userName?: string;
  fullName: string;
  gradeName?: string;
}

export interface CompanyEmployeeFormData {
  userName: string;
  fullName: string;
  gradeName?: string;
}

// API Response types
export interface CompanyEmployeesResponse {
  success: boolean;
  data: CompanyEmployee[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  error?: string;
}

export interface CompanyEmployeeResponse {
  success: boolean;
  data: CompanyEmployee;
  error?: string;
}
