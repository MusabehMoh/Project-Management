/**
 * Utility functions for translating backend error messages
 */

export interface TranslateFunction {
  (key: string): string;
}

/**
 * Translates backend error messages to localized versions
 * @param errorMessage - The error message from the backend
 * @param t - Translation function from LanguageContext
 * @returns Translated error message
 */
export function translateBackendError(
  errorMessage: string,
  t: TranslateFunction,
): string {
  if (!errorMessage) return errorMessage;

  // Handle "Cannot delete user. User is referenced in: X Task Assignment(s), Y Notification(s), etc."
  if (errorMessage.includes("Cannot delete user")) {
    const match = errorMessage.match(
      /Cannot delete user\. User is referenced in: (.+)/,
    );
    if (match) {
      const dependencies = match[1];
      const translatedDeps = translateDependencies(dependencies, t);
      return `${t("users.error.cannotDelete")}. ${t("users.error.referencedIn")}: ${translatedDeps}`;
    }
  }

  // Handle "User with username 'xxx' already exists."
  const usernameMatch = errorMessage.match(
    /User with username '(.+)' already exists/,
  );
  if (usernameMatch) {
    return t("users.error.usernameExists").replace("{0}", usernameMatch[1]);
  }

  // Handle "User with PRS ID 'xxx' already exists."
  const prsIdMatch = errorMessage.match(/User with PRS ID '(.+)' already exists/);
  if (prsIdMatch) {
    return t("users.error.prsIdExists").replace("{0}", prsIdMatch[1]);
  }

  // Handle "User already exists"
  if (errorMessage.includes("User already exists")) {
    return t("users.error.userExists");
  }

  // Return original message if no pattern matches
  return errorMessage;
}

/**
 * Translates dependency list from backend
 * @param dependencies - Comma-separated list of dependencies (e.g., "11 Task Assignment(s), 7 Notification(s)")
 * @param t - Translation function
 * @returns Translated dependencies string
 */
function translateDependencies(
  dependencies: string,
  t: TranslateFunction,
): string {
  const parts = dependencies.split(",").map((part) => part.trim());

  const translated = parts.map((part) => {
    // Extract number and type
    const match = part.match(/^(\d+)\s+(.+)$/);
    if (!match) return part;

    const count = match[1];
    const type = match[2];

    // Map English types to translation keys
    const typeMap: Record<string, string> = {
      "Task Assignment(s)": "users.error.taskAssignments",
      "Project Requirement(s) as Creator": "users.error.projectRequirementsCreator",
      "Project Requirement(s) as Analyst": "users.error.projectRequirementsAnalyst",
      "Design Request(s)": "users.error.designRequests",
      "Sub Task(s)": "users.error.subTasks",
      "Calendar Event(s)": "users.error.calendarEvents",
      "Calendar Event Assignment(s)": "users.error.calendarEventAssignments",
      "Notification(s)": "users.error.notifications",
      "Team(s) Created": "users.error.teamsCreated",
    };

    const translationKey = typeMap[type];
    if (translationKey) {
      return `${count} ${t(translationKey)}`;
    }

    return part;
  });

  return translated.join("، "); // Use Arabic comma separator
}
