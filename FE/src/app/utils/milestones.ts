import { CardsThree } from "@phosphor-icons/react/CardsThree";
import { ChatsTeardrop } from "@phosphor-icons/react/ChatsTeardrop";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Checks } from "@phosphor-icons/react/Checks";
import { Confetti } from "@phosphor-icons/react/Confetti";
import { Crown } from "@phosphor-icons/react/Crown";
import { FlagBanner } from "@phosphor-icons/react/FlagBanner";
import { Folders } from "@phosphor-icons/react/Folders";
import { Kanban } from "@phosphor-icons/react/Kanban";
import { ListChecks } from "@phosphor-icons/react/ListChecks";
import { Medal } from "@phosphor-icons/react/Medal";
import { Sparkle } from "@phosphor-icons/react/Sparkle";
import { UserPlus } from "@phosphor-icons/react/UserPlus";
import { UsersThree } from "@phosphor-icons/react/UsersThree";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
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

export function getMilestoneIcon(iconKey: string): Icon {
  switch (iconKey) {
    case "check-circle-2":
      return CheckCircle;
    case "check-check":
      return Checks;
    case "list-checks":
      return ListChecks;
    case "flag":
      return FlagBanner;
    case "layout-dashboard":
      return Kanban;
    case "folder-kanban":
      return Folders;
    case "user-plus":
      return UserPlus;
    case "sparkles":
      return Sparkle;
    case "users":
      return UsersThree;
    case "message-square":
    case "messages-square":
      return ChatsTeardrop;
    case "cards":
      return CardsThree;
    case "award":
      return Medal;
    case "trophy":
      return Crown;
    default:
      return Confetti;
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
