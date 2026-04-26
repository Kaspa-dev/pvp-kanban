import { apiJson } from "./auth";

export interface GamificationSummary {
  lifetimeXp: number;
  currentLevel: number;
  currentLevelName: string;
  currentLevelXp: number;
  xpForNextLevel: number;
  xpRemainingForNextLevel: number;
  progressPercent: number;
  weeklyXp: number;
  monthlyXp: number;
  tasksCompleted: number;
  prestige: number;
}

export const STORY_POINTS_OPTIONS = [1, 2, 3, 5, 8, 13, 20, 40];

export const STORY_POINTS_MIN = 1;
export const STORY_POINTS_MAX = 100;

export function getXPForStoryPoints(storyPoints: number): number {
  return storyPoints * 10;
}

export async function fetchCurrentUserGamificationSummary(): Promise<GamificationSummary> {
  return apiJson<GamificationSummary>(
    "/api/users/me/gamification-summary",
    { method: "GET" },
    "Unable to load your progress right now.",
  );
}

export function getDefaultGamificationSummary(): GamificationSummary {
  return {
    lifetimeXp: 0,
    currentLevel: 1,
    currentLevelName: "Beginner",
    currentLevelXp: 0,
    xpForNextLevel: 20,
    xpRemainingForNextLevel: 20,
    progressPercent: 0,
    weeklyXp: 0,
    monthlyXp: 0,
    tasksCompleted: 0,
    prestige: 0,
  };
}
