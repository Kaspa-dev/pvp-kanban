import {
  Award,
  Flag,
  ListChecks,
  LucideIcon,
  MessageSquareMore,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { apiJson } from "./auth";

export interface UserMilestone {
  key: string;
  title: string;
  description: string;
  category: string;
  iconKey: string;
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAtUtc: string | null;
  sortOrder: number;
}

export interface UserMilestoneSummary {
  unlockedCount: number;
  totalCount: number;
  recentUnlocked: UserMilestone[];
  upcoming: UserMilestone[];
}

export interface UserMilestonesResponse {
  summary: UserMilestoneSummary;
  milestones: UserMilestone[];
}

export const milestoneCategoryOrder = ["tasks", "boards", "collaboration", "planning-poker"] as const;

export function fetchCurrentUserMilestones(): Promise<UserMilestonesResponse> {
  return apiJson<UserMilestonesResponse>(
    "/api/users/me/milestones",
    { method: "GET" },
    "Unable to load your milestones right now.",
  );
}

export function getDefaultUserMilestonesResponse(): UserMilestonesResponse {
  return {
    summary: {
      unlockedCount: 0,
      totalCount: 0,
      recentUnlocked: [],
      upcoming: [],
    },
    milestones: [],
  };
}

export function getMilestoneCategoryLabel(category: string) {
  switch (category) {
    case "tasks":
      return "Tasks";
    case "boards":
      return "Boards";
    case "collaboration":
      return "Collaboration";
    case "planning-poker":
      return "Planning Poker";
    default:
      return "Achievements";
  }
}

export function getMilestoneCategoryDescription(category: string) {
  switch (category) {
    case "tasks":
      return "Track the work you move to done and the momentum you build over time.";
    case "boards":
      return "Celebrate creating and shaping the spaces where work happens.";
    case "collaboration":
      return "Reward the teamwork signals that make boards feel shared instead of solo.";
    case "planning-poker":
      return "Capture facilitation moments that help the team estimate together.";
    default:
      return "A place to celebrate progress across the workspace.";
  }
}

export function getMilestoneIcon(iconKey: string): LucideIcon {
  switch (iconKey) {
    case "flag":
      return Flag;
    case "sparkles":
      return Sparkles;
    case "users":
      return Users;
    case "message-square":
      return MessageSquareMore;
    case "award":
      return Award;
    case "trophy":
      return Trophy;
    default:
      return ListChecks;
  }
}

export function groupMilestonesByCategory(milestones: UserMilestone[]) {
  const grouped = new Map<string, UserMilestone[]>();

  for (const category of milestoneCategoryOrder) {
    grouped.set(category, []);
  }

  milestones.forEach((milestone) => {
    const existing = grouped.get(milestone.category);
    if (existing) {
      existing.push(milestone);
      return;
    }

    grouped.set(milestone.category, [milestone]);
  });

  return Array.from(grouped.entries())
    .filter(([, categoryMilestones]) => categoryMilestones.length > 0)
    .map(([category, categoryMilestones]) => ({
      category,
      milestones: [...categoryMilestones].sort((left, right) => left.sortOrder - right.sortOrder),
    }));
}

export function getUnlockedMilestones(milestones: UserMilestone[]) {
  return milestones.filter((milestone) => milestone.isUnlocked);
}

export function getInProgressMilestones(milestones: UserMilestone[]) {
  return milestones.filter((milestone) => !milestone.isUnlocked && milestone.currentValue > 0);
}

export function getComingSoonMilestones(milestones: UserMilestone[]) {
  return milestones.filter((milestone) => !milestone.isUnlocked && milestone.currentValue <= 0);
}

export function getMilestoneProgressPercent(milestone: UserMilestone) {
  if (milestone.targetValue <= 0) {
    return milestone.isUnlocked ? 100 : 0;
  }

  return Math.max(0, Math.min(100, Math.round((milestone.currentValue / milestone.targetValue) * 100)));
}

export function formatMilestoneDate(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
