import type {
  CompanyEmployee,
  CreateCompanyEmployeeRequest,
  UpdateCompanyEmployeeRequest,
} from "@/types/companyEmployee";

import { useState, useEffect, useCallback, useRef } from "react";

import { companyEmployeeService } from "@/services/api/companyEmployeeService";

interface UseCompanyEmployeesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
}

interface UseCompanyEmployeesResult {
  companyEmployees: CompanyEmployee[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  pageSize: number;
  createCompanyEmployee: (
    data: CreateCompanyEmployeeRequest,
  ) => Promise<CompanyEmployee>;
  updateCompanyEmployee: (
    id: number,
    data: UpdateCompanyEmployeeRequest,
  ) => Promise<CompanyEmployee>;
  deleteCompanyEmployee: (id: number) => Promise<void>;
}

export function useCompanyEmployees(
  options: UseCompanyEmployeesOptions = {},
): UseCompanyEmployeesResult {
  const { initialPage = 1, initialLimit = 20, initialSearch = "" } = options;

  const [companyEmployees, setCompanyEmployees] = useState<CompanyEmployee[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [pageSize, setPageSize] = useState<number>(initialLimit);
  const isInitialMount = useRef(true);

  const fetchCompanyEmployees = useCallback(
    async (page: number, search: string, limit: number) => {
      setLoading(true);
      setError(null);

      try {
        const result = await companyEmployeeService.getCompanyEmployees({
          page,
          limit,
          search: search.trim() || undefined,
        });

        setCompanyEmployees(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
        setCurrentPage(page);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch company employees";

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [], // Empty dependency array to prevent recreations
  );

  const refetch = useCallback(() => {
    return fetchCompanyEmployees(currentPage, searchQuery, pageSize);
  }, [fetchCompanyEmployees, currentPage, searchQuery, pageSize]);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchCompanyEmployees(page, searchQuery, pageSize);
    },
    [fetchCompanyEmployees, searchQuery, pageSize],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1); // Reset to first page when changing page size
      fetchCompanyEmployees(1, searchQuery, newSize);
    },
    [fetchCompanyEmployees, searchQuery],
  );

  const createCompanyEmployee = useCallback(
    async (data: CreateCompanyEmployeeRequest): Promise<CompanyEmployee> => {
      setError(null);
      try {
        const newEmployee =
          await companyEmployeeService.createCompanyEmployee(data);

        await refetch(); // Refresh the list

        return newEmployee;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create company employee";

        setError(errorMessage);
        throw err;
      }
    },
    [refetch],
  );

  const updateCompanyEmployee = useCallback(
    async (
      id: number,
      data: UpdateCompanyEmployeeRequest,
    ): Promise<CompanyEmployee> => {
      setError(null);
      try {
        const updatedEmployee =
          await companyEmployeeService.updateCompanyEmployee(id, data);

        await refetch(); // Refresh the list

        return updatedEmployee;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update company employee";

        setError(errorMessage);
        throw err;
      }
    },
    [refetch],
  );

  const deleteCompanyEmployee = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await companyEmployeeService.deleteCompanyEmployee(id);
        await refetch(); // Refresh the list
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete company employee";

        setError(errorMessage);
        throw err;
      }
    },
    [refetch],
  );

  // Search effect with debouncing - only for search query changes
  useEffect(() => {
    // Skip the search effect on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;

      return;
    }

    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      // Call the service directly to avoid dependency issues
      const fetchSearch = async () => {
        setLoading(true);
        setError(null);

        try {
          const result = await companyEmployeeService.getCompanyEmployees({
            page: 1,
            limit: pageSize,
            search: searchQuery.trim() || undefined,
          });

          setCompanyEmployees(result.data);
          setTotalPages(result.pagination.totalPages);
          setTotalCount(result.pagination.total);
          setCurrentPage(1);
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to fetch company employees";

          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      fetchSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]); // Only depend on searchQuery - pageSize changes handled by handlePageSizeChange

  // Initial fetch
  useEffect(() => {
    fetchCompanyEmployees(initialPage, initialSearch, initialLimit);
  }, []); // Only run once on mount

  return {
    companyEmployees,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    searchQuery,
    setSearchQuery,
    refetch,
    goToPage,
    setPageSize: handlePageSizeChange,
    pageSize,
    createCompanyEmployee,
    updateCompanyEmployee,
    deleteCompanyEmployee,
  };
}
