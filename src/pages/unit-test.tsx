import type { Unit } from "@/types/unit";

import React from "react";
import { Card, CardHeader, CardBody, Divider } from "@heroui/react";
import { useState } from "react";

import { UnitSelector } from "@/components/UnitSelector";
import { UnitTreeDebug } from "@/components/debug/UnitTreeDebug";

export default function UnitTestPage() {
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">
            🧪 Unit Selector Lazy Loading Test
          </h1>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">
                1. Unit Selector Component
              </h2>
              <div className="max-w-md">
                <UnitSelector
                  label="Test Unit Selection"
                  selectedUnit={selectedUnit}
                  onUnitSelect={(unit) => {
                    console.log("🎯 Unit selected:", unit);
                    setSelectedUnit(unit);
                  }}
                />
              </div>
              {selectedUnit && (
                <div className="mt-4 p-4 bg-green-50 rounded">
                  <strong>Selected:</strong> {selectedUnit.name} (ID:{" "}
                  {selectedUnit.id})
                </div>
              )}
            </div>

            <Divider />

            <div>
              <h2 className="text-lg font-semibold mb-4">
                2. Debug Information
              </h2>
              <UnitTreeDebug />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
