import type { Unit } from "@/types/unit";

import React, { useState } from "react";
import { Card, CardBody, CardHeader, Button, Divider } from "@heroui/react";

import { UnitSelector } from "@/components/UnitSelector";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Example component demonstrating the lazy-loading UnitSelector
 * Shows performance improvements with large organizational hierarchies
 */
export const LazyUnitSelectorExample: React.FC = () => {
  const { t } = useLanguage();
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(undefined);
  const [selectedUnit2, setSelectedUnit2] = useState<Unit | undefined>(
    undefined,
  );

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">
            🚀 Lazy-Loading Unit Selector Demo
          </h2>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Example 1: Basic Unit Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Unit Selection</h3>
              <UnitSelector
                isRequired
                label={t("projects.owningUnit")}
                placeholder={t("units.selectUnit")}
                selectedUnit={selectedUnit}
                onUnitSelect={setSelectedUnit}
              />
              {selectedUnit && (
                <div className="p-3 bg-success-50 rounded-lg border border-success-200">
                  <p className="text-success-800">
                    <strong>Selected Unit:</strong> {selectedUnit.name}
                  </p>
                  <p className="text-sm text-success-600">
                    ID: {selectedUnit.id} | Level: {selectedUnit.level} | Code:{" "}
                    {selectedUnit.code}
                  </p>
                </div>
              )}
            </div>

            {/* Example 2: Alternative Owner Unit */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Alternative Unit Selection
              </h3>
              <UnitSelector
                allowClear
                label="Alternative Owning Unit"
                placeholder="Select alternative unit..."
                selectedUnit={selectedUnit2}
                onUnitSelect={setSelectedUnit2}
              />
              {selectedUnit2 && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-primary-800">
                    <strong>Alternative Unit:</strong> {selectedUnit2.name}
                  </p>
                  <p className="text-sm text-primary-600">
                    Arabic: {selectedUnit2.nameAr} | Active:{" "}
                    {selectedUnit2.isActive ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Divider />

          {/* Performance Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              🎯 Performance Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">⚡</div>
                <h4 className="font-medium">Faster Initial Load</h4>
                <p className="text-sm text-gray-600">
                  Loads only root units first, reducing initial API response
                  size by ~80%
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">📡</div>
                <h4 className="font-medium">On-Demand Loading</h4>
                <p className="text-sm text-gray-600">
                  Children loaded only when parent nodes are expanded
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">🌐</div>
                <h4 className="font-medium">Reduced Server Load</h4>
                <p className="text-sm text-gray-600">
                  Smaller, targeted API calls instead of massive tree queries
                </p>
              </div>
            </div>
          </div>

          {/* Usage Guide */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📚 How It Works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <strong>Initial Load:</strong> Only root units (level 1) are
                  fetched - Ministry of Defense, etc.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <strong>Expand Node:</strong> When you click the expand arrow,
                  children are loaded via API call
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <strong>Loading State:</strong> Spinner shows while fetching
                  children from server
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <strong>Caching:</strong> Once loaded, children are cached in
                  memory for instant re-expansion
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              color="primary"
              onClick={() => {
                setSelectedUnit(undefined);
                setSelectedUnit2(undefined);
              }}
            >
              Clear Selections
            </Button>
            <Button
              variant="bordered"
              onClick={() => {
                console.log("Selected Units:", { selectedUnit, selectedUnit2 });
              }}
            >
              Log Selections
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LazyUnitSelectorExample;
