// Unit-related types
export interface Unit {
  id: number;
  name: string;
  nameAr: string;
  code: string;
  parentId?: number;
  level: number;
  description?: string;
  isActive: boolean;
  children?: Unit[];
  createdAt: string;
  updatedAt: string;
}

export interface UnitTreeNode extends Unit {
  children: UnitTreeNode[];
  hasChildren: boolean;
  isExpanded?: boolean;
  isLoading?: boolean; // New: for lazy loading state
}

export interface CreateUnitRequest {
  name: string;
  nameAr: string;
  code: string;
  parentId?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateUnitRequest extends CreateUnitRequest {
  id: number;
}

export interface UnitFilters {
  search?: string;
  parentId?: number;
  isActive?: boolean;
}

export interface UnitStats {
  totalUnits: number;
  activeUnits: number;
  inactiveUnits: number;
  rootUnits: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  totalCount?: number;
  totalPages?: number;
}
