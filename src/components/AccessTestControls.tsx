import React from "react";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";

export const AccessTestControls: React.FC = () => {
  const setTestScenario = (scenario: string) => {
    localStorage.setItem("test_access_scenario", scenario);
    window.location.reload(); // Reload to apply the test scenario
  };

  const clearTestScenario = () => {
    localStorage.removeItem("test_access_scenario");
    window.location.reload();
  };

  const currentScenario =
    localStorage.getItem("test_access_scenario") || "normal";

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <h3 className="text-lg font-semibold">Access Test Controls</h3>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current scenario: <strong>{currentScenario}</strong>
        </p>

        <div className="space-y-2">
          <Button
            className="w-full"
            color="primary"
            size="sm"
            variant={currentScenario === "normal" ? "solid" : "bordered"}
            onClick={() => clearTestScenario()}
          >
            Normal User (Has Roles)
          </Button>

          <Button
            className="w-full"
            color="danger"
            size="sm"
            variant={currentScenario === "no_user" ? "solid" : "bordered"}
            onClick={() => setTestScenario("no_user")}
          >
            No User (Null)
          </Button>

          <Button
            className="w-full"
            color="warning"
            size="sm"
            variant={currentScenario === "no_roles" ? "solid" : "bordered"}
            onClick={() => setTestScenario("no_roles")}
          >
            User with No Roles
          </Button>

          <Button
            className="w-full"
            color="secondary"
            size="sm"
            variant={
              currentScenario === "inactive_roles" ? "solid" : "bordered"
            }
            onClick={() => setTestScenario("inactive_roles")}
          >
            User with Inactive Roles
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Note: Page will reload when you select a test scenario
        </p>
      </CardBody>
    </Card>
  );
};

export default AccessTestControls;
