// Centralized pagination options and helpers
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export function normalizePageSize(size: number, defaultSize = 10) {
  return PAGE_SIZE_OPTIONS.includes(size) ? size : defaultSize;
}
