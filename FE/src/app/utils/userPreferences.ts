import { apiJson } from "./auth";

export type CoachmarkFlowId =
  | "board-no-active-sprint"
  | "board-active-sprint"
  | "staging-planning"
  | "staging-active-sprint"
  | "projects-empty-state"
  | "projects-board-list";

export interface UserPreferences {
  coachmarksEnabled: boolean;
  completedFlows: CoachmarkFlowId[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  coachmarksEnabled: true,
  completedFlows: [],
};

function normalizePreferences(preferences: Partial<UserPreferences> | null | undefined): UserPreferences {
  const completedFlows = Array.from(
    new Set((preferences?.completedFlows ?? []).filter(Boolean)),
  ) as CoachmarkFlowId[];

  return {
    coachmarksEnabled: preferences?.coachmarksEnabled ?? DEFAULT_USER_PREFERENCES.coachmarksEnabled,
    completedFlows,
  };
}

export async function fetchUserPreferences(): Promise<UserPreferences> {
  const preferences = await apiJson<UserPreferences>(
    "/api/users/me/preferences",
    { method: "GET" },
    "Unable to load your hint preferences right now.",
  );

  return normalizePreferences(preferences);
}

export async function updateUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
  const savedPreferences = await apiJson<UserPreferences>(
    "/api/users/me/preferences",
    {
      method: "PUT",
      body: JSON.stringify(normalizePreferences(preferences)),
    },
    "Unable to save your hint preferences right now.",
  );

  return normalizePreferences(savedPreferences);
}

export function getNextCompletedFlows(
  completedFlows: CoachmarkFlowId[],
  flowId: CoachmarkFlowId,
): CoachmarkFlowId[] {
  return Array.from(new Set([...completedFlows, flowId])) as CoachmarkFlowId[];
}
