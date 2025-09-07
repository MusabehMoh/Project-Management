import { createContext, useContext, ReactNode, useState } from "react";

interface SearchProviderProps {
  children: ReactNode;
}

interface SearchContextType {
  initialized: boolean;
  initializeSearch: () => Promise<void>;
}

const SearchContext = createContext<SearchContextType>({
  initialized: false,
  initializeSearch: async () => {},
});

export function SearchProvider({ children }: SearchProviderProps) {
  const [initialized, setInitialized] = useState(false);

  const initializeSearch = async () => {
    if (initialized) return;

    try {
      // Lazy load search data only when search is actually used
      console.log("🔍 Lazy loading search data...");

      // This would be called only when user starts searching
      // For now, just mark as initialized without loading heavy data
      setInitialized(true);
      console.log("🚀 Search service ready (lazy mode)");
    } catch (error) {
      console.error("Failed to initialize search:", error);
    }
  };

  return (
    <SearchContext.Provider value={{ initialized, initializeSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }

  return context;
}

export default SearchProvider;
