import type { Unit, UnitTreeNode } from "@/types/unit";

import React, { useState } from "react";
import { Card, CardBody, Button, Input, Spinner, Chip } from "@heroui/react";

import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  SearchIcon,
} from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUnitsTreeLazy, useUnitSearch, useUnitPath } from "@/hooks/useUnits";

interface UnitTreeViewProps {
  /** Selected unit ID */
  selectedUnitId?: number;
  /** Callback when unit is selected */
  onUnitSelect?: (unit: Unit) => void;
  /** Whether to show search functionality */
  showSearch?: boolean;
  /** Whether to show expand/collapse all buttons */
  showExpandControls?: boolean;
  /** Maximum height for the tree container */
  maxHeight?: string;
  /** Custom CSS class */
  className?: string;
  /** Whether component is in selection mode */
  selectionMode?: boolean;
}

interface UnitTreeNodeProps {
  node: UnitTreeNode;
  level: number;
  selectedUnitId?: number;
  onSelect?: (unit: Unit) => void;
  onToggleExpand?: (unitId: number) => Promise<void> | void;
}

const UnitTreeNodeComponent: React.FC<UnitTreeNodeProps> = ({
  node,
  level,
  selectedUnitId,
  onSelect,
  onToggleExpand,
}) => {
  const { t, language } = useLanguage();
  // ✨ Use hasChildren property from node instead of checking loaded children
  const hasChildren = node.hasChildren; // This indicates if node CAN have children (lazy loading)
  const isSelected = selectedUnitId === node.id;
  const paddingLeft = level * 20;

  console.log(`🔍 Rendering node: ${node.name}`, {
    id: node.id,
    hasChildren,
    loadedChildren: node.children?.length || 0,
    isExpanded: node.isExpanded,
    isLoading: node.isLoading,
  });

  // Define colors for each level
  const getLevelColor = (level: number) => {
    const colors = [
      "primary", // Level 1 - Root (Ministry)
      "secondary", // Level 2 - Commands (Land, Air, Navy)
      "success", // Level 3 - Regional Commands/Fleets
      "warning", // Level 4 - Brigades/Squadrons
      "danger", // Level 5 - Battalions/Companies
    ] as const;

    return colors[Math.min(level - 1, colors.length - 1)] || "default";
  };

  const getLevelColorClasses = (level: number, isRTL: boolean = false) => {
    const colorMap = {
      1: isRTL
        ? "border-r-4 border-r-primary-500"
        : "border-l-4 border-l-primary-500", // Ministry
      2: isRTL
        ? "border-r-4 border-r-secondary-500"
        : "border-l-4 border-l-secondary-500", // Commands
      3: isRTL
        ? "border-r-4 border-r-success-500"
        : "border-l-4 border-l-success-500", // Regional
      4: isRTL
        ? "border-r-4 border-r-warning-500"
        : "border-l-4 border-l-warning-500", // Brigades
      5: isRTL
        ? "border-r-4 border-r-danger-500"
        : "border-l-4 border-l-danger-500", // Battalions
    } as const;

    return (
      colorMap[level as keyof typeof colorMap] ||
      (isRTL
        ? "border-r-4 border-r-default-300"
        : "border-l-4 border-l-default-300")
    );
  };

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren && onToggleExpand) {
      await onToggleExpand(node.id);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(node);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-default-100 transition-colors ${
          isSelected ? "bg-primary-100 border border-primary-300" : ""
        } ${getLevelColorClasses(node.level, language === "ar")} ${language === "ar" ? "rtl" : "ltr"}`}
        style={{
          paddingLeft: language === "ar" ? `${12}px` : `${12}px`,
          paddingRight: language === "ar" ? `${12}px` : `${12}px`,
          marginLeft: language === "ar" ? "0" : `${level * 20}px`,
          marginRight: language === "ar" ? `${level * 20}px` : "0",
          direction: language === "ar" ? "rtl" : "ltr",
        }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Button */}
        <div className="w-6 h-6 flex items-center justify-center">
          {hasChildren ? (
            <Button
              isIconOnly
              className="min-w-unit-6 w-6 h-6"
              isDisabled={node.isLoading}
              isLoading={node.isLoading} // ✨ Show loading spinner when fetching children
              size="sm"
              variant="light"
              onClick={handleToggleExpand}
            >
              {!node.isLoading &&
                (node.isExpanded ? (
                  <ChevronDownIcon size={14} />
                ) : language === "ar" ? (
                  <ChevronLeftIcon size={14} />
                ) : (
                  <ChevronRightIcon size={14} />
                ))}
            </Button>
          ) : (
            <div className="w-6 h-6" />
          )}
        </div>

        {/* Unit Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium truncate ${isSelected ? "text-primary-800" : ""}`}
            >
              {language === "ar" ? node.name : node.name}
            </span>
            {!node.isActive && (
              <Chip color="warning" size="sm" variant="flat">
                {t("common.inactive")}
              </Chip>
            )}
          </div>
        </div>

        {/* Level indicator with color */}
        <Chip color={getLevelColor(node.level)} size="sm" variant="dot">
          L{node.level}
        </Chip>
      </div>

      {/* Children */}
      {hasChildren && node.isExpanded && (
        <div className="mt-1">
          {node.children.map((child) => (
            <UnitTreeNodeComponent
              key={child.id}
              level={level + 1}
              node={child}
              selectedUnitId={selectedUnitId}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const UnitTreeView: React.FC<UnitTreeViewProps> = ({
  selectedUnitId,
  onUnitSelect,
  showSearch = true,
  showExpandControls = true,
  maxHeight = "400px",
  className = "",
  selectionMode = false,
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [useSearchMode, setUseSearchMode] = useState(false);

  // Define the same color functions for search results
  const getLevelColor = (level: number) => {
    const colors = [
      "primary", // Level 1 - Root (Ministry)
      "secondary", // Level 2 - Commands (Land, Air, Navy)
      "success", // Level 3 - Regional Commands/Fleets
      "warning", // Level 4 - Brigades/Squadrons
      "danger", // Level 5 - Battalions/Companies
    ] as const;

    return colors[Math.min(level - 1, colors.length - 1)] || "default";
  };

  const getLevelColorClasses = (level: number, isRTL: boolean = false) => {
    const colorMap = {
      1: isRTL
        ? "border-r-4 border-r-primary-500"
        : "border-l-4 border-l-primary-500", // Ministry
      2: isRTL
        ? "border-r-4 border-r-secondary-500"
        : "border-l-4 border-l-secondary-500", // Commands
      3: isRTL
        ? "border-r-4 border-r-success-500"
        : "border-l-4 border-l-success-500", // Regional
      4: isRTL
        ? "border-r-4 border-r-warning-500"
        : "border-l-4 border-l-warning-500", // Brigades
      5: isRTL
        ? "border-r-4 border-r-danger-500"
        : "border-l-4 border-l-danger-500", // Battalions
    } as const;

    return (
      colorMap[level as keyof typeof colorMap] ||
      (isRTL
        ? "border-r-4 border-r-default-300"
        : "border-l-4 border-l-default-300")
    );
  };

  const {
    unitsTree,
    loading: treeLoading,
    error: treeError,
    toggleExpand,
    expandAll,
    collapseAll,
  } = useUnitsTreeLazy(); // ✨ Using lazy loading hook

  const {
    searchResults,
    loading: searchLoading,
    searchUnits,
    clearSearch,
  } = useUnitSearch();

  const { path } = useUnitPath(selectedUnitId);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length >= 3) {
      setUseSearchMode(true);
      searchUnits(value);
    } else if (!value.trim()) {
      setUseSearchMode(false);
      clearSearch();
    }
  };

  const handleUnitSelect = (unit: Unit) => {
    if (onUnitSelect) {
      onUnitSelect(unit);
    }
    if (useSearchMode) {
      setUseSearchMode(false);
      setSearchTerm("");
      clearSearch();
    }
  };

  if (treeError) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center text-danger p-4">
            <p>{treeError}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardBody className="p-4">
        {/* Search Input */}
        {showSearch && (
          <div className="mb-4">
            <Input
              isClearable
              placeholder={t("units.searchUnits")}
              startContent={<SearchIcon size={18} />}
              value={searchTerm}
              onClear={() => handleSearch("")}
              onValueChange={handleSearch}
            />
          </div>
        )}

        {/* Breadcrumb for selected unit */}
        {path.length > 0 && selectionMode && (
          <div className="mb-4 p-3 bg-default-50 dark:bg-default-100/10 rounded-lg border border-default-200">
            <div
              className={`text-xs text-default-500 mb-2 ${language === "ar" ? "text-right" : "text-left"}`}
            >
              {t("units.selectedPath")}:
            </div>
            <div
              className={`flex items-center gap-1 flex-wrap`}
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              {path.map((unit, index, array) => {
                // Get level-based color matching UnitTreeView
                const getLevelColorValue = (level: number) => {
                  const colorMap: Record<number, string> = {
                    0: "#71717A", // default/grey - Root (L0)
                    1: "#006FEE", // primary - Ministry
                    2: "#9353D3", // secondary - Commands
                    3: "#17C964", // success - Regional
                    4: "#F5A524", // warning - Brigades
                    5: "#F31260", // danger - Battalions
                  };
                  return colorMap[level] || "#71717A";
                };

                return (
                  <React.Fragment key={unit.id}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: getLevelColorValue(unit.level),
                        }}
                      />
                      <span className="text-sm text-default-700 font-medium">
                        {unit.name}
                      </span>
                      <span className="text-xs text-default-400">
                        L{unit.level}
                      </span>
                    </div>
                    {index < array.length - 1 && (
                      language === "ar" ? (
                        <ChevronLeftIcon className="text-default-400" size={14} />
                      ) : (
                        <ChevronRightIcon className="text-default-400" size={14} />
                      )
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        {/* {showExpandControls && !useSearchMode && (
          <div className="flex gap-2 mb-4">
            <Button
              isLoading={treeLoading}
              size="sm"
              variant="flat"
              onPress={async () => await expandAll()}
            >
              {t("units.expandAll")}
            </Button>
            <Button size="sm" variant="flat" onPress={collapseAll}>
              {t("units.collapseAll")}
            </Button>
          </div>
        )} */}

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight }}>
          {/* Loading States */}
          {(treeLoading || searchLoading) && (
            <div className="flex justify-center items-center p-8">
              <Spinner size="lg" />
            </div>
          )}

          {/* Search Results */}
          {useSearchMode && !searchLoading && (
            <div className="space-y-1">
              {!Array.isArray(searchResults) || searchResults.length === 0 ? (
                <div className="text-center text-default-500 p-4">
                  {t("units.noSearchResults")}
                </div>
              ) : (
                searchResults.map((unit) => (
                  <div
                    key={unit.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-default-100 transition-colors ${
                      selectedUnitId === unit.id
                        ? "bg-primary-100 border border-primary-300"
                        : ""
                    } ${getLevelColorClasses(unit.level, language === "ar")} ${language === "ar" ? "rtl" : "ltr"}`}
                    style={{ direction: language === "ar" ? "rtl" : "ltr" }}
                    onClick={() => handleUnitSelect(unit)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {language === "ar" ? unit.name : unit.name}
                        </span>
                      </div>
                      <div className="text-sm text-default-500">
                        {language === "ar" ? unit.name : unit.name}
                      </div>
                    </div>
                    <Chip
                      color={getLevelColor(unit.level)}
                      size="sm"
                      variant="dot"
                    >
                      L{unit.level}
                    </Chip>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tree View */}
          {!useSearchMode && !treeLoading && (
            <div className="space-y-1">
              {unitsTree.length === 0 ? (
                <div className="text-center text-default-500 p-4">
                  {t("units.noUnits")}
                </div>
              ) : (
                unitsTree.map((node) => (
                  <UnitTreeNodeComponent
                    key={node.id}
                    level={0}
                    node={node}
                    selectedUnitId={selectedUnitId}
                    onSelect={handleUnitSelect}
                    onToggleExpand={toggleExpand}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default UnitTreeView;
