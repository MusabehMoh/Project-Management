import type { Unit, UnitTreeNode, UnitFilters } from "@/types/unit";

import { useState, useEffect } from "react";

import { unitService } from "@/services/api";

export const useUnits = (filters?: UnitFilters) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await unitService.getUnits(filters);

      if (response.success) {
        setUnits(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to fetch units");
      console.error("Error fetching units:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [JSON.stringify(filters)]);

  return {
    units,
    loading,
    error,
    refetch: fetchUnits,
  };
};

export const useUnitsTree = () => {
  const [unitsTree, setUnitsTree] = useState<UnitTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnitsTree = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await unitService.getUnitsTree();

      if (response.success) {
        setUnitsTree(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to fetch units tree");
      console.error("Error fetching units tree:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitsTree();
  }, []);

  const toggleExpand = (unitId: number) => {
    const updateNodes = (nodes: UnitTreeNode[]): UnitTreeNode[] => {
      return nodes.map((node) => {
        if (node.id === unitId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children.length > 0) {
          return { ...node, children: updateNodes(node.children) };
        }

        return node;
      });
    };

    setUnitsTree(updateNodes(unitsTree));
  };

  const expandAll = () => {
    const expandNodes = (nodes: UnitTreeNode[]): UnitTreeNode[] => {
      return nodes.map((node) => ({
        ...node,
        isExpanded: true,
        children: expandNodes(node.children),
      }));
    };

    setUnitsTree(expandNodes(unitsTree));
  };

  const collapseAll = () => {
    const collapseNodes = (nodes: UnitTreeNode[]): UnitTreeNode[] => {
      return nodes.map((node) => ({
        ...node,
        isExpanded: false,
        children: collapseNodes(node.children),
      }));
    };

    setUnitsTree(collapseNodes(unitsTree));
  };

  return {
    unitsTree,
    loading,
    error,
    refetch: fetchUnitsTree,
    toggleExpand,
    expandAll,
    collapseAll,
  };
};

// New: Lazy-loading units tree hook for performance optimization
export const useUnitsTreeLazy = () => {
  const [unitsTree, setUnitsTree] = useState<UnitTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load root units initially
  const fetchRootUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🌳 Fetching root units...");
      const response = await unitService.getRootUnits();

      console.log("📡 Root units response:", response);

      if (response.success) {
        console.log("✅ Root units loaded:", response.data);
        setUnitsTree(response.data);
      } else {
        console.error("❌ Failed to load root units:", response.message);
        setError(response.message);
      }
    } catch (err) {
      console.error("💥 Error fetching root units:", err);
      setError("Failed to fetch root units");
    } finally {
      setLoading(false);
    }
  };

  // Load children when a node is expanded
  const loadChildren = async (parentId: number) => {
    try {
      console.log("⏳ Loading children for parent ID:", parentId);

      // Set loading state for the parent node
      setUnitsTree((prevTree) =>
        updateNodeInTree(prevTree, parentId, { isLoading: true }),
      );

      const response = await unitService.getUnitChildren(parentId);

      console.log("📡 Children response for parent", parentId, ":", response);

      if (response.success) {
        console.log("✅ Children loaded:", response.data.length, "children");
        // Update the parent node with loaded children
        setUnitsTree((prevTree) =>
          updateNodeInTree(prevTree, parentId, {
            children: response.data,
            isExpanded: true,
            isLoading: false,
          }),
        );
      } else {
        console.error("❌ Failed to load children:", response.message);
        // Handle error
        setUnitsTree((prevTree) =>
          updateNodeInTree(prevTree, parentId, { isLoading: false }),
        );
      }
    } catch (err) {
      console.error("💥 Error loading children:", err);
      setUnitsTree((prevTree) =>
        updateNodeInTree(prevTree, parentId, { isLoading: false }),
      );
    }
  };

  // Helper function to update a specific node in the tree
  const updateNodeInTree = (
    nodes: UnitTreeNode[],
    targetId: number,
    updates: Partial<UnitTreeNode>,
  ): UnitTreeNode[] => {
    return nodes.map((node) => {
      if (node.id === targetId) {
        return { ...node, ...updates };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, targetId, updates),
        };
      }

      return node;
    });
  };

  // Toggle expand/collapse with lazy loading
  const toggleExpand = async (unitId: number) => {
    console.log("🔄 Toggle expand called for unit ID:", unitId);
    const node = findNodeInTree(unitsTree, unitId);

    if (!node) {
      console.warn("⚠️ Node not found for ID:", unitId);

      return;
    }

    console.log("🔍 Found node:", {
      id: node.id,
      name: node.name,
      hasChildren: node.hasChildren,
      isExpanded: node.isExpanded,
      childrenLoaded: node.children.length,
    });

    if (!node.isExpanded) {
      // Expanding: load children if not already loaded
      if (node.hasChildren && node.children.length === 0) {
        console.log("👶 Loading children for unit:", unitId);
        await loadChildren(unitId);
      } else {
        // Just toggle expand state
        console.log("📤 Just expanding node (children already loaded)");
        setUnitsTree((prevTree) =>
          updateNodeInTree(prevTree, unitId, { isExpanded: true }),
        );
      }
    } else {
      // Collapsing: just toggle expand state
      console.log("📥 Collapsing node");
      setUnitsTree((prevTree) =>
        updateNodeInTree(prevTree, unitId, { isExpanded: false }),
      );
    }
  };

  // Helper function to find a node in the tree
  const findNodeInTree = (
    nodes: UnitTreeNode[],
    targetId: number,
  ): UnitTreeNode | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeInTree(node.children, targetId);

        if (found) return found;
      }
    }

    return null;
  };

  // Load all expanded nodes (for expand all functionality)
  const expandAll = async () => {
    const loadAllChildren = async (
      nodes: UnitTreeNode[],
    ): Promise<UnitTreeNode[]> => {
      const updatedNodes = [];

      for (const node of nodes) {
        let updatedNode = { ...node, isExpanded: true };

        if (node.hasChildren && node.children.length === 0) {
          // Load children
          try {
            const response = await unitService.getUnitChildren(node.id);

            if (response.success) {
              updatedNode.children = await loadAllChildren(response.data);
            }
          } catch (err) {
            console.error(`Failed to load children for unit ${node.id}:`, err);
          }
        } else if (node.children.length > 0) {
          updatedNode.children = await loadAllChildren(node.children);
        }

        updatedNodes.push(updatedNode);
      }

      return updatedNodes;
    };

    try {
      setLoading(true);
      const expandedTree = await loadAllChildren(unitsTree);

      setUnitsTree(expandedTree);
    } catch (err) {
      console.error("Failed to expand all:", err);
    } finally {
      setLoading(false);
    }
  };

  // Collapse all nodes
  const collapseAll = () => {
    const collapseNodes = (nodes: UnitTreeNode[]): UnitTreeNode[] => {
      return nodes.map((node) => ({
        ...node,
        isExpanded: false,
        children: collapseNodes(node.children),
      }));
    };

    setUnitsTree(collapseNodes(unitsTree));
  };

  useEffect(() => {
    fetchRootUnits();
  }, []);

  return {
    unitsTree,
    loading,
    error,
    refetch: fetchRootUnits,
    toggleExpand,
    expandAll,
    collapseAll,
    loadChildren, // Expose for manual loading if needed
  };
};

export const useUnitSearch = () => {
  const [searchResults, setSearchResults] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUnits = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);

      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await unitService.searchUnits(term);

      // Handle different response structures
      let units: Unit[] = [];

      if (Array.isArray(response.data)) {
        units = response.data;
      } else if (response.data && typeof response.data === "object") {
        // Check common nested array patterns
        if (Array.isArray((response.data as any).units)) {
          units = (response.data as any).units;
        } else if (Array.isArray((response.data as any).data)) {
          units = (response.data as any).data;
        } else if (Array.isArray((response.data as any).items)) {
          units = (response.data as any).items;
        }
      }

      console.log("🔍 Extracted units:", units);
      console.log("🔍 Units count:", units.length);

      if (response.success && units.length > 0) {
        console.log("✅ Setting search results:", units.length, "units");
        setSearchResults(units);
      } else {
        console.log("❌ No valid data, response:", response);
        setError(response.message);
        setSearchResults([]);
      }
    } catch (err) {
      setError("Search failed");
      setSearchResults([]);
      console.error("Error searching units:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setError(null);
  };

  return {
    searchResults,
    loading,
    error,
    searchUnits,
    clearSearch,
  };
};

export const useUnitPath = (unitId?: number) => {
  const [path, setPath] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unitId) {
      setPath([]);

      return;
    }

    const fetchPath = async () => {
      try {
        setLoading(true);
        const response = await unitService.getUnitPath(unitId);

        if (response.success) {
          setPath(response.data);
        }
      } catch (err) {
        console.error("Error fetching unit path:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPath();
  }, [unitId]);

  return { path, loading };
};
