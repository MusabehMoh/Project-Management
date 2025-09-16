import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Re-export types from other modules
export * from "./user";
export * from "./timeline";
export * from "./quickActions";

// Unit types (excluding ApiResponse to avoid conflicts)
export type {
  Unit,
  UnitTreeNode,
  CreateUnitRequest,
  UpdateUnitRequest,
  UnitFilters,
  UnitStats,
} from "./unit";

// Export specific department types to avoid conflicts
export type {
  Department,
  DepartmentMember,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  AddDepartmentMemberRequest,
  UpdateDepartmentMemberRequest,
  DepartmentFilters,
  DepartmentStats,
} from "./department";
