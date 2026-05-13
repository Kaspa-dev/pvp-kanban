export const LEVEL_XP_GAIN_VARIANTS = [
  {
    key: "navbar-profile-pulse",
    label: "Navbar Profile Pulse",
    description: "The existing navbar profile chip confirms XP without opening anything.",
    placement: "Top-right navbar profile chip",
    reuses: "UserProfileChip, AppAvatar",
  },
  {
    key: "profile-popover-xp",
    label: "Profile Popover XP",
    description: "The account progress popover absorbs the reward into the level card.",
    placement: "Inside the profile popover after clicking username",
    reuses: "LevelProgressCard popover surface",
  },
  {
    key: "toast-bottom-right",
    label: "Toast Bottom Right",
    description: "A reward message follows the current global action-toast placement.",
    placement: "Current global toast position, bottom-right",
    reuses: "Radix Toaster visual language",
  },
  {
    key: "toast-bottom-left",
    label: "Toast Bottom Left",
    description: "The same toast treatment moved away from app actions.",
    placement: "Alternative global XP toast, bottom-left",
    reuses: "Radix Toaster visual language",
  },
  {
    key: "top-center-banner",
    label: "Top Center Banner",
    description: "A slim non-modal strip acknowledges XP below the app chrome.",
    placement: "Center-top below navbar",
    reuses: "Existing toast/card styling",
  },
  {
    key: "task-card-reward",
    label: "Task Card Reward",
    description: "The completed board card briefly shows the reward near task metadata.",
    placement: "On a board task card after moving to Done",
    reuses: "KanbanCard, story points and due-date area",
  },
  {
    key: "done-column-header",
    label: "Done Column Header",
    description: "The Done column header reflects the XP event where completion happened.",
    placement: "Board tab, Done column header",
    reuses: "KanbanColumn header/count style",
  },
  {
    key: "sidebar-rail-ticker",
    label: "Sidebar Rail Ticker",
    description: "A compact sidebar rail pulse keeps XP visible but out of the task flow.",
    placement: "Board sidebar rail near utility buttons",
    reuses: "Sidebar, UtilityIconButton",
  },
  {
    key: "task-details-reward-row",
    label: "Task Details Reward Row",
    description: "Task details adds a flat reward row under the existing summary rhythm.",
    placement: "Task details page, below task summary/details",
    reuses: "TaskDetailsSummary row/divider style",
  },
  {
    key: "list-row-reward",
    label: "List Row Reward",
    description: "A table row confirms XP inline where list users are already scanning.",
    placement: "List/Backlog table row after task completion",
    reuses: "ListView table row and chip style",
  },
] as const;

export type LevelXpGainVariant = (typeof LEVEL_XP_GAIN_VARIANTS)[number]["key"];

export type XpGainSample = {
  key: string;
  label: string;
  reason: string;
  xp: number;
  previousLevel: number;
  nextLevel: number;
  progressBefore: number;
  progressAfter: number;
  tasksCompleted?: number;
  streakDays?: number;
  isBatch?: boolean;
  isLevelUp?: boolean;
  isMaxLevel?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
};

export const XP_GAIN_SAMPLES: XpGainSample[] = [
  {
    key: "small-task",
    label: "Small task completion",
    reason: "Checklist item closed",
    xp: 5,
    previousLevel: 8,
    nextLevel: 8,
    progressBefore: 28,
    progressAfter: 31,
    tasksCompleted: 1,
  },
  {
    key: "normal-task",
    label: "Normal completion",
    reason: "Task moved to Done",
    xp: 25,
    previousLevel: 18,
    nextLevel: 18,
    progressBefore: 42,
    progressAfter: 57,
    tasksCompleted: 1,
  },
  {
    key: "high-value",
    label: "High-value task",
    reason: "Critical story completed",
    xp: 80,
    previousLevel: 33,
    nextLevel: 33,
    progressBefore: 71,
    progressAfter: 94,
    tasksCompleted: 1,
  },
  {
    key: "level-up",
    label: "Level-up moment",
    reason: "Review lane cleared",
    xp: 140,
    previousLevel: 24,
    nextLevel: 25,
    progressBefore: 86,
    progressAfter: 12,
    tasksCompleted: 2,
    isLevelUp: true,
  },
  {
    key: "batch",
    label: "Multi-task batch",
    reason: "Queue batch concluded",
    xp: 320,
    previousLevel: 41,
    nextLevel: 43,
    progressBefore: 38,
    progressAfter: 21,
    tasksCompleted: 6,
    isBatch: true,
    isLevelUp: true,
  },
  {
    key: "streak",
    label: "Streak bonus",
    reason: "Daily delivery streak",
    xp: 60,
    previousLevel: 19,
    nextLevel: 19,
    progressBefore: 51,
    progressAfter: 76,
    tasksCompleted: 1,
    streakDays: 7,
  },
  {
    key: "cap",
    label: "Max-level cap state",
    reason: "XP banked at cap",
    xp: 90,
    previousLevel: 150,
    nextLevel: 150,
    progressBefore: 100,
    progressAfter: 100,
    tasksCompleted: 3,
    isMaxLevel: true,
  },
  {
    key: "offline",
    label: "Error / offline state",
    reason: "XP sync pending",
    xp: 0,
    previousLevel: 28,
    nextLevel: 28,
    progressBefore: 64,
    progressAfter: 64,
    hasError: true,
  },
];
