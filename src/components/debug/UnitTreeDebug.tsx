import { Card, CardBody, Button } from "@heroui/react";
import { useEffect } from "react";

import { useUnitsTreeLazy } from "@/hooks/useUnits";

export function UnitTreeDebug() {
  const { unitsTree, loading, error, toggleExpand, loadChildren } =
    useUnitsTreeLazy();

  useEffect(() => {
    console.log("🌳 Units Tree Debug - Tree loaded:", unitsTree);
    console.log("📊 Tree length:", unitsTree.length);
    console.log("⏳ Loading:", loading);
    console.log("❌ Error:", error);
  }, [unitsTree, loading, error]);

  const handleTestExpand = async () => {
    if (unitsTree.length > 0) {
      const firstUnit = unitsTree[0];

      console.log("🔄 Testing expand for unit:", firstUnit);
      await toggleExpand(firstUnit.id);
    }
  };

  const handleTestLoadChildren = async () => {
    if (unitsTree.length > 0) {
      const firstUnit = unitsTree[0];

      console.log("👶 Testing load children for unit:", firstUnit.id);
      await loadChildren(firstUnit.id);
    }
  };

  return (
    <Card className="m-4">
      <CardBody>
        <h3 className="text-lg font-bold mb-4">
          🔍 Unit Tree Lazy Loading Debug
        </h3>

        <div className="space-y-4">
          <div>
            <strong>Loading:</strong> {loading ? "Yes" : "No"}
          </div>

          <div>
            <strong>Error:</strong> {error || "None"}
          </div>

          <div>
            <strong>Root Units Count:</strong> {unitsTree.length}
          </div>

          {unitsTree.length > 0 && (
            <div>
              <strong>First Unit:</strong>
              <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
                {JSON.stringify(
                  {
                    id: unitsTree[0].id,
                    name: unitsTree[0].name,
                    hasChildren: unitsTree[0].hasChildren,
                    isExpanded: unitsTree[0].isExpanded,
                    childrenCount: unitsTree[0].children.length,
                    isLoading: unitsTree[0].isLoading,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              color="primary"
              isDisabled={unitsTree.length === 0}
              size="sm"
              onPress={handleTestExpand}
            >
              Test Toggle Expand
            </Button>
            <Button
              color="secondary"
              isDisabled={unitsTree.length === 0}
              size="sm"
              onPress={handleTestLoadChildren}
            >
              Test Load Children
            </Button>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">All Root Units:</h4>
            {unitsTree.map((unit) => (
              <div key={unit.id} className="p-2 border rounded my-2">
                <div>
                  <strong>Name:</strong> {unit.name}
                </div>
                <div>
                  <strong>Has Children:</strong>{" "}
                  {unit.hasChildren ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Children Loaded:</strong> {unit.children.length}
                </div>
                <div>
                  <strong>Is Expanded:</strong> {unit.isExpanded ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Is Loading:</strong> {unit.isLoading ? "Yes" : "No"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
