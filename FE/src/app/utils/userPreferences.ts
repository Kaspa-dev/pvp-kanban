import { apiJson } from "./auth";

export type CoachmarkFlowId =
  | "board-no-active-sprint"
  | "board-active-sprint"
  | "list-no-active-sprint"
  | "list-active-sprint"
  | "staging-planning"
  | "staging-active-sprint"
  | "backlog-overview"
  | "history-overview"
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

const LEGACY_COACHMARK_FLOW_ALIASES: Record<string, CoachmarkFlowId> = {
  "backlog-planning": "staging-planning",
  "backlog-active-sprint": "staging-active-sprint",
};

const ALLOWED_COACHMARK_FLOWS = new Set<CoachmarkFlowId>([
  "board-no-active-sprint",
  "board-active-sprint",
  "list-no-active-sprint",
  "list-active-sprint",
  "staging-planning",
  "staging-active-sprint",
  "backlog-overview",
  "history-overview",
  "projects-empty-state",
  "projects-board-list",
]);

function normalizeCompletedFlows(completedFlows: string[] | null | undefined): CoachmarkFlowId[] {
  return Array.from(
    new Set(
      (completedFlows ?? [])
        .map((flowId) => LEGACY_COACHMARK_FLOW_ALIASES[flowId] ?? flowId)
        .filter((flowId): flowId is CoachmarkFlowId => ALLOWED_COACHMARK_FLOWS.has(flowId as CoachmarkFlowId)),
    ),
  );
}

function normalizePreferences(preferences: Partial<UserPreferences> | null | undefined): UserPreferences {
  return {
    coachmarksEnabled: preferences?.coachmarksEnabled ?? DEFAULT_USER_PREFERENCES.coachmarksEnabled,
    completedFlows: normalizeCompletedFlows(preferences?.completedFlows),
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
  return normalizeCompletedFlows([...completedFlows, flowId]);
}
