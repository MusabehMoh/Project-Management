# Global Pagination Component - Usage Guide

## Overview

The `GlobalPagination` component provides a consistent, translatable pagination solution across the entire PMA application. It uses the default HeroUI design with clean, centered styling and full Arabic translation support.

## Component Features

✅ **Default HeroUI Design**: Uses `<Pagination initialPage={1} total={10} />` pattern
✅ **Fully Translatable**: Supports both English and Arabic
✅ **Centered Layout**: Clean, centered design for better UX
✅ **Reusable**: Works with any paginated data across the app
✅ **RTL Support**: Automatically adapts to Arabic layout

## Basic Usage

```tsx
import { GlobalPagination } from "@/components/GlobalPagination";

// In your component
<GlobalPagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={pageSize}
  onPageChange={handlePageChange}
  isLoading={loading}
  showInfo={true}
/>
```

## Implementation Examples

### 1. Projects Page (Already Implemented)

```tsx
// src/pages/projects.tsx
import { GlobalPagination } from "@/components/GlobalPagination";

export default function ProjectsPage() {
  const {
    projects,
    currentPage,
    totalPages,
    totalProjects,
    pageSize,
    handlePageChange,
    loading,
  } = useProjects();

  return (
    <div>
      {/* Your content */}
      
      {/* Centered Pagination */}
      <div className="flex justify-center py-6">
        <GlobalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalProjects}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          isLoading={loading}
          showInfo={true}
          className="w-full max-w-md"
        />
      </div>
    </div>
  );
}
```

### 2. Users Page Implementation

```tsx
// src/pages/users.tsx
import { GlobalPagination } from "@/components/GlobalPagination";

export default function UsersPage() {
  const { users, pagination, loading, handlePageChange } = useUsers();

  return (
    <div>
      {/* Users Table */}
      <Table>
        {/* Your table content */}
      </Table>

      {/* Centered Pagination */}
      <div className="flex justify-center py-6">
        <GlobalPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          isLoading={loading}
          showInfo={true}
        />
      </div>
    </div>
  );
}
```

### 3. Tasks Page Implementation

```tsx
// src/pages/tasks.tsx
import { GlobalPagination } from "@/components/GlobalPagination";

export default function TasksPage() {
  const { tasks, currentPage, totalPages, totalTasks, pageSize, setPage, loading } = useTasks();

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  return (
    <div>
      {/* Tasks Content */}
      
      {/* Simple Centered Pagination */}
      <div className="flex justify-center py-6">
        <GlobalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalTasks}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
```

### 4. Reports Page Implementation

```tsx
// src/pages/reports.tsx
import { GlobalPagination } from "@/components/GlobalPagination";

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const pageSize = 15; // Custom page size

  return (
    <div>
      {/* Reports Content */}
      
      {/* Pagination with custom styling */}
      <div className="flex justify-center py-8">
        <GlobalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={reports.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          isLoading={loading}
          showInfo={true}
          className="bg-default-50 p-4 rounded-lg"
        />
      </div>
    </div>
  );
}
```

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentPage` | `number` | ✅ | - | Current active page |
| `totalPages` | `number` | ✅ | - | Total number of pages |
| `totalItems` | `number` | ✅ | - | Total number of items |
| `pageSize` | `number` | ✅ | - | Items per page |
| `onPageChange` | `(page: number) => void` | ✅ | - | Page change handler |
| `isLoading` | `boolean` | ❌ | `false` | Disable pagination during loading |
| `showInfo` | `boolean` | ❌ | `true` | Show pagination info text |
| `className` | `string` | ❌ | `""` | Additional CSS classes |

## Translation Keys

The component uses these translation keys:

### English
```json
{
  "pagination.showing": "Showing",
  "pagination.to": "to",
  "pagination.of": "of",
  "pagination.items": "items",
  "pagination.page": "Page",
  "pagination.perPage": "per page"
}
```

### Arabic
```json
{
  "pagination.showing": "عرض",
  "pagination.to": "إلى",
  "pagination.of": "من",
  "pagination.items": "عنصر",
  "pagination.page": "صفحة",
  "pagination.perPage": "لكل صفحة"
}
```

## Styling Options

### Default Centered
```tsx
<div className="flex justify-center py-6">
  <GlobalPagination {...props} />
</div>
```

### With Background
```tsx
<div className="flex justify-center py-6">
  <GlobalPagination 
    {...props} 
    className="bg-default-50 p-4 rounded-lg w-full max-w-lg"
  />
</div>
```

### Compact Version
```tsx
<GlobalPagination 
  {...props} 
  showInfo={false}
  className="py-2"
/>
```

## Hook Integration Pattern

Each hook should return pagination data in this format:

```tsx
// useYourData.ts
export const useYourData = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Fetch new data for the page
    fetchData(page, pageSize);
  }, [pageSize]);

  return {
    // Data
    data,
    loading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    handlePageChange,
  };
};
```

## RTL Support

The component automatically supports RTL layout for Arabic:

- Text alignment adjusts automatically
- Pagination controls adapt to RTL flow
- All translations are contextually correct

## Responsive Design

The component is fully responsive:

- **Mobile**: Stacked layout with smaller text
- **Tablet**: Balanced horizontal layout
- **Desktop**: Full horizontal layout with optimal spacing

## Best Practices

1. **Consistent Placement**: Always center pagination below content
2. **Loading States**: Always pass `isLoading` prop
3. **Page Size**: Use consistent page sizes across similar content types
4. **Spacing**: Use consistent padding (`py-6`) around pagination
5. **Maximum Width**: Consider setting max-width for better readability

## Migration from Old Pagination

Replace complex pagination implementations with the simple GlobalPagination:

```tsx
// ❌ Old complex implementation
<div className="complex-pagination-wrapper">
  <div className="pagination-info">...</div>
  <Pagination total={pages} page={current} onChange={onChange} showControls showShadow />
  <div className="page-jump">...</div>
</div>

// ✅ New simple implementation
<div className="flex justify-center py-6">
  <GlobalPagination
    currentPage={current}
    totalPages={pages}
    totalItems={total}
    pageSize={size}
    onPageChange={onChange}
    isLoading={loading}
  />
</div>
```

This provides a consistent, maintainable, and fully localized pagination solution across your entire application!
