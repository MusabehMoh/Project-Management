import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Kbd } from "@heroui/kbd";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import {
  Search,
  Filter,
  X,
  User,
  FolderOpen,
  Calendar,
  CheckSquare,
  List,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import {
  GlobalSearchResult,
  SearchFilters,
} from "@/services/globalSearchService";
import { useLanguage } from "@/contexts/LanguageContext";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESULT_TYPE_ICONS = {
  project: FolderOpen,
  user: User,
  timeline: Calendar,
  sprint: Calendar,
  task: CheckSquare,
  subtask: List,
} as const;

const RESULT_TYPE_COLORS = {
  project: "primary",
  user: "success",
  timeline: "warning",
  sprint: "secondary",
  task: "default",
  subtask: "default",
} as const;

const STATUS_COLORS = {
  active: "success",
  planning: "warning",
  "on-hold": "warning",
  completed: "success",
  cancelled: "danger",
  "not-started": "default",
  "in-progress": "primary",
} as const;

export function GlobalSearchModal({
  isOpen,
  onOpenChange,
}: GlobalSearchModalProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    results,
    loading,
    search,
    clearResults,
    suggestions,
    getSuggestions,
  } = useGlobalSearch();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");

    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback(
    (query: string) => {
      if (!query.trim() || query.length < 2) return;

      const updated = [
        query,
        ...recentSearches.filter((s) => s !== query),
      ].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    },
    [recentSearches],
  );

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }, []);

  // Perform search
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        clearResults();

        return;
      }

      const filters: SearchFilters = {};

      if (selectedTypes.length > 0) {
        filters.types = selectedTypes as any[];
      }
      if (selectedStatuses.length > 0) {
        filters.status = selectedStatuses;
      }
      if (selectedDepartments.length > 0) {
        filters.departments = selectedDepartments;
      }

      await search({
        query,
        filters,
        limit: 50,
      });
    },
    [
      search,
      clearResults,
      selectedTypes,
      selectedStatuses,
      selectedDepartments,
    ],
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      performSearch(value);

      // Get suggestions for autocomplete
      if (value.length >= 1) {
        getSuggestions(value);
      }
    },
    [performSearch, getSuggestions],
  );

  // Handle search submission
  const handleSearch = useCallback(
    (query?: string) => {
      const searchTerm = query || searchQuery;

      if (searchTerm.trim()) {
        saveRecentSearch(searchTerm.trim());
        performSearch(searchTerm);
      }
    },
    [searchQuery, saveRecentSearch, performSearch],
  );

  // Handle result click
  const handleResultClick = useCallback(
    (result: GlobalSearchResult) => {
      navigate(result.href);
      onOpenChange(false);
      saveRecentSearch(searchQuery);
    },
    [navigate, onOpenChange, saveRecentSearch, searchQuery],
  );

  // Handle recent search click
  const handleRecentSearchClick = useCallback(
    (query: string) => {
      setSearchQuery(query);
      handleSearch(query);
    },
    [handleSearch],
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedDepartments([]);
  }, []);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, GlobalSearchResult[]> = {};

    results.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });

    return groups;
  }, [results]);

  // Get unique departments from results for filter options
  const availableDepartments = useMemo(() => {
    const departments = new Set<string>();

    results.forEach((result) => {
      if (result.metadata?.department) {
        departments.add(result.metadata.department);
      }
    });

    return Array.from(departments).sort();
  }, [results]);

  // Handle modal close
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSearchQuery("");
    clearResults();
  }, [onOpenChange, clearResults]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      clearResults();
      setShowFilters(false);
    }
  }, [isOpen, clearResults]);

  const ResultItem = ({ result }: { result: GlobalSearchResult }) => {
    const Icon = RESULT_TYPE_ICONS[result.type];
    const typeColor = RESULT_TYPE_COLORS[result.type];
    const statusColor = result.metadata?.status
      ? STATUS_COLORS[result.metadata.status as keyof typeof STATUS_COLORS]
      : "default";

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div
        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-default-100 active:scale-[0.98]"
        onClick={() => handleResultClick(result)}
      >
        <div className={`p-2 rounded-lg bg-${typeColor}/10`}>
          <Icon className={`text-${typeColor}`} size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">
              {result.title}
            </h4>
            <Chip
              className="capitalize"
              color={typeColor as any}
              size="sm"
              variant="flat"
            >
              {result.type}
            </Chip>
          </div>

          {result.subtitle && (
            <p className="text-sm text-default-600 mb-1">{result.subtitle}</p>
          )}

          {result.description && (
            <p className="text-sm text-default-500 line-clamp-2 mb-2">
              {result.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {result.metadata?.status && (
              <Chip color={statusColor as any} size="sm" variant="dot">
                {result.metadata.status}
              </Chip>
            )}
            {result.metadata?.department && (
              <Chip size="sm" variant="flat">
                {result.metadata.department}
              </Chip>
            )}
            {result.metadata?.priority && (
              <Chip
                color={
                  result.metadata.priority === "high"
                    ? "danger"
                    : result.metadata.priority === "medium"
                      ? "warning"
                      : "default"
                }
                size="sm"
                variant="flat"
              >
                {result.metadata.priority} priority
              </Chip>
            )}
            {result.metadata?.progress !== undefined && (
              <Chip size="sm" variant="flat">
                {result.metadata.progress}% complete
              </Chip>
            )}
          </div>
        </div>

        <ArrowRight className="text-default-400 flex-shrink-0" size={16} />
      </div>
    );
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "max-h-[80vh]",
        body: "p-0",
      }}
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeIn" },
          },
        },
      }}
      placement="top"
      size="2xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {() => (
          <>
            {/* Header with search input */}
            <ModalHeader className="pb-0 pr-16 pl-16">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="text-default-400" size={20} />
                  <span className="text-lg font-semibold">
                    {t("search.title")}
                  </span>
                  <div className="flex-1" />
                  <Kbd className="hidden sm:flex" keys={["ctrl"]}>
                    K
                  </Kbd>
                </div>

                <Input
                  classNames={{
                    input: "text-base",
                    inputWrapper:
                      "bg-default-100 border-none hover:bg-default-200 focus-within:bg-default-50",
                  }}
                  endContent={
                    searchQuery && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => {
                          setSearchQuery("");
                          clearResults();
                        }}
                      >
                        <X size={16} />
                      </Button>
                    )
                  }
                  placeholder={t("search.placeholder")}
                  startContent={
                    <Search className="text-default-400" size={18} />
                  }
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />

                {/* Filter toggle */}
                <div className="flex items-center justify-between mt-3">
                  <Button
                    color={showFilters ? "primary" : "default"}
                    size="sm"
                    startContent={<Filter size={16} />}
                    variant={showFilters ? "solid" : "flat"}
                    onPress={() => setShowFilters(!showFilters)}
                  >
                    {t("search.filters")}
                  </Button>

                  {(selectedTypes.length > 0 ||
                    selectedStatuses.length > 0 ||
                    selectedDepartments.length > 0) && (
                    <Button size="sm" variant="light" onPress={clearFilters}>
                      {t("search.clearFilters")}
                    </Button>
                  )}
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <Select
                      label={t("search.type")}
                      placeholder={t("search.selectType")}
                      selectedKeys={selectedTypes}
                      selectionMode="multiple"
                      size="sm"
                      onSelectionChange={(keys) =>
                        setSelectedTypes(Array.from(keys as Set<string>))
                      }
                    >
                      <SelectItem key="project" textValue="Projects">
                        Projects
                      </SelectItem>
                      <SelectItem key="user" textValue="Users">
                        Users
                      </SelectItem>
                      <SelectItem key="timeline" textValue="Timelines">
                        Timelines
                      </SelectItem>
                      <SelectItem key="sprint" textValue="Sprints">
                        Sprints
                      </SelectItem>
                      <SelectItem key="task" textValue="Tasks">
                        Tasks
                      </SelectItem>
                      <SelectItem key="subtask" textValue="Subtasks">
                        Subtasks
                      </SelectItem>
                    </Select>

                    <Select
                      label={t("search.status")}
                      placeholder={t("search.selectStatus")}
                      selectedKeys={selectedStatuses}
                      selectionMode="multiple"
                      size="sm"
                      onSelectionChange={(keys) =>
                        setSelectedStatuses(Array.from(keys as Set<string>))
                      }
                    >
                      <SelectItem key="active" textValue="Active">
                        Active
                      </SelectItem>
                      <SelectItem key="planning" textValue="Planning">
                        Planning
                      </SelectItem>
                      <SelectItem key="on-hold" textValue="On Hold">
                        On Hold
                      </SelectItem>
                      <SelectItem key="completed" textValue="Completed">
                        Completed
                      </SelectItem>
                      <SelectItem key="cancelled" textValue="Cancelled">
                        Cancelled
                      </SelectItem>
                      <SelectItem key="not-started" textValue="Not Started">
                        Not Started
                      </SelectItem>
                      <SelectItem key="in-progress" textValue="In Progress">
                        In Progress
                      </SelectItem>
                    </Select>

                    {availableDepartments.length > 0 && (
                      <Select
                        label={t("search.department")}
                        placeholder={t("search.selectDepartment")}
                        selectedKeys={selectedDepartments}
                        selectionMode="multiple"
                        size="sm"
                        onSelectionChange={(keys) =>
                          setSelectedDepartments(
                            Array.from(keys as Set<string>),
                          )
                        }
                      >
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept} textValue={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </ModalHeader>

            {/* Body with results */}
            <ModalBody className="px-0">
              <div
                className="max-h-[500px] overflow-y-auto pb-4 scroll-smooth"
                style={{ scrollPaddingBottom: "20px" }}
              >
                <div className="px-6 pb-2">
                  {/* Loading state */}
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="md" />
                    </div>
                  )}

                  {/* Results */}
                  {!loading && results.length > 0 && (
                    <div className="space-y-1 pb-6">
                      <div className="text-sm text-default-600 mb-3">
                        {t("search.resultsCount")
                          .replace("{count}", results.length.toString())
                          .replace("{query}", searchQuery)}
                      </div>

                      {Object.entries(groupedResults).map(
                        ([type, typeResults]) => (
                          <div key={type} className="mb-4">
                            <h3 className="text-sm font-medium text-default-700 mb-2 capitalize px-2">
                              {type}s ({typeResults.length})
                            </h3>
                            <div className="space-y-1 mb-6 last:mb-4">
                              {typeResults.map((result, index) => (
                                <div
                                  key={result.id}
                                  className={
                                    index === typeResults.length - 1
                                      ? "mb-2"
                                      : ""
                                  }
                                >
                                  <ResultItem result={result} />
                                </div>
                              ))}
                            </div>
                            <Divider className="mt-3" />
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {/* No results */}
                  {!loading && searchQuery && results.length === 0 && (
                    <div className="text-center py-12">
                      <Search
                        className="mx-auto text-default-300 mb-3"
                        size={48}
                      />
                      <p className="text-default-600 mb-1">
                        {t("search.noResults")}
                      </p>
                      <p className="text-sm text-default-500">
                        {t("search.tryDifferent")}
                      </p>
                    </div>
                  )}

                  {/* Recent searches */}
                  {!loading && !searchQuery && recentSearches.length > 0 && (
                    <div className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-default-700">
                          {t("search.recent")}
                        </h3>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={clearRecentSearches}
                        >
                          {t("search.clear")}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((query) => (
                          <Chip
                            key={query}
                            className="cursor-pointer hover:bg-default-200 transition-colors"
                            startContent={<Clock size={12} />}
                            variant="flat"
                            onClick={() => handleRecentSearchClick(query)}
                          >
                            {query}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {!loading &&
                    searchQuery &&
                    searchQuery.length >= 1 &&
                    suggestions.length > 0 &&
                    results.length === 0 && (
                      <div className="py-4">
                        <h3 className="text-sm font-medium text-default-700 mb-3">
                          {t("search.suggestions")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((suggestion) => (
                            <Chip
                              key={suggestion}
                              className="cursor-pointer hover:bg-primary/20 transition-colors"
                              color="primary"
                              variant="flat"
                              onClick={() =>
                                handleRecentSearchClick(suggestion)
                              }
                            >
                              {suggestion}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Empty state */}
                  {!loading && !searchQuery && recentSearches.length === 0 && (
                    <div className="text-center py-12">
                      <Search
                        className="mx-auto text-default-300 mb-3"
                        size={48}
                      />
                      <p className="text-default-600 mb-1">
                        {t("search.startTyping")}
                      </p>
                      <p className="text-sm text-default-500">
                        {t("search.searchDescription")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default GlobalSearchModal;
