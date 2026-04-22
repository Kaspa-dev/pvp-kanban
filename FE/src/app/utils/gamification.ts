import { apiJson } from "./auth";

// XP and Level System

export interface UserProgress {
  username: string;
  email: string;
  avatar?: string;
  xp: number;
  level: number;
  tasksCompleted: number;
}

export const LEVEL_NAMES = [
  "Beginner",          // Level 1
  "Trainee",           // Level 2
  "Contributor",       // Level 3
  "Organizer",         // Level 4
  "Flow Runner",       // Level 5
  "Task Slayer",       // Level 6
  "Flow Master",       // Level 7
  "Board Wizard",      // Level 8
  "Agile Champion",    // Level 9
  "Jira Master",       // Level 10
  "Kanban Legend",     // Level 11
  "Productivity Guru", // Level 12
  "Velocity King",     // Level 13
  "Epic Closer",       // Level 14
  "Kanban Champion",   // Level 15
];

// XP required for each level (cumulative)
// Progressive curve: starts easy, gets harder
export const XP_PER_LEVEL = [
  0,     // Level 1 (start)
  20,    // Level 2 (need 20 XP)
  60,    // Level 3 (need 40 more)
  130,   // Level 4 (need 70 more)
  240,   // Level 5 (need 110 more)
  400,   // Level 6 (need 160 more)
  620,   // Level 7 (need 220 more)
  910,   // Level 8 (need 290 more)
  1280,  // Level 9 (need 370 more)
  1740,  // Level 10 (need 460 more)
  2300,  // Level 11 (need 560 more)
  2970,  // Level 12 (need 670 more)
  3760,  // Level 13 (need 790 more)
  4680,  // Level 14 (need 920 more)
  5740,  // Level 15 (need 1060 more)
];

export const STORY_POINTS_OPTIONS = [1, 2, 3, 5, 8, 13, 20, 40];

export const STORY_POINTS_MIN = 1;
export const STORY_POINTS_MAX = 100;

export function getXPForStoryPoints(storyPoints: number): number {
  return storyPoints * 10; // 1 SP = 10 XP
}

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (xp >= XP_PER_LEVEL[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level - 1] || `Level ${level}`;
}

export function getXPForCurrentLevel(xp: number, level: number): number {
  const currentLevelXP = XP_PER_LEVEL[level - 1] || 0;
  return xp - currentLevelXP;
}

export function getXPNeededForNextLevel(level: number): number {
  const currentLevelXP = XP_PER_LEVEL[level - 1] || 0;
  const nextLevelXP = XP_PER_LEVEL[level] || currentLevelXP + 1000;
  return nextLevelXP - currentLevelXP;
}

export function getProgressPercent(xp: number, level: number): number {
  const xpInCurrentLevel = getXPForCurrentLevel(xp, level);
  const xpNeeded = getXPNeededForNextLevel(level);
  return Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));
}

export function getXPRemainingForNextLevel(xp: number, level: number): number {
  const xpInCurrentLevel = getXPForCurrentLevel(xp, level);
  const xpNeeded = getXPNeededForNextLevel(level);
  return xpNeeded - xpInCurrentLevel;
}

export async function fetchCurrentUserProgress(): Promise<Pick<UserProgress, "xp" | "level" | "tasksCompleted">> {
  return apiJson<Pick<UserProgress, "xp" | "level" | "tasksCompleted">>(
    "/api/users/me/progress",
    { method: "GET" },
    "Unable to load your progress right now.",
  );
}

export function getDefaultUserProgress(): UserProgress {
  return {
    username: "Player",
    email: "",
    xp: 0,
    level: 1,
    tasksCompleted: 0,
  };
}
