export const LEVEL_XP_GAIN_VARIANTS = [
  {
    key: "corner-glass-burst",
    label: "Corner Glass Burst",
    description: "A corner notification blooms, counts XP, then sheds tiny sparks.",
  },
  {
    key: "navbar-comet",
    label: "Navbar Comet",
    description: "XP travels like a comet into the profile avatar and level badge.",
  },
  {
    key: "task-card-flare",
    label: "Task Card Flare",
    description: "A completed task card throws streaks into a compact XP receipt.",
  },
  {
    key: "avatar-halo-pulse",
    label: "Avatar Halo Pulse",
    description: "The identicon becomes the reward surface with a level halo surge.",
  },
  {
    key: "timeline-ribbon",
    label: "Timeline Ribbon",
    description: "XP is shown as a sweeping work-history ribbon with proof ticks.",
  },
  {
    key: "command-receipt",
    label: "Command Receipt",
    description: "A technical ledger logs task, multiplier, and final XP lock-in.",
  },
  {
    key: "orbital-counter",
    label: "Orbital Counter",
    description: "XP ticks orbit into a circular next-level progress counter.",
  },
  {
    key: "board-column-shimmer",
    label: "Board Column Shimmer",
    description: "A Done column header glows as XP rises from completed cards.",
  },
  {
    key: "sidebar-rail-ticker",
    label: "Sidebar Rail Ticker",
    description: "A compact sidebar rail ticker flashes XP without stealing space.",
  },
  {
    key: "toast-stack-wave",
    label: "Toast Stack Wave",
    description: "Several small XP fragments merge into one premium corner toast.",
  },
  {
    key: "spotlight-drop",
    label: "Spotlight Drop",
    description: "A non-modal spotlight drops in, rewards, then compresses away.",
  },
  {
    key: "streak-lantern",
    label: "Streak Lantern",
    description: "A warm streak lantern focuses on momentum and bonus continuity.",
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
    key: "loading",
    label: "Loading / syncing",
    reason: "Confirming XP event",
    xp: 0,
    previousLevel: 28,
    nextLevel: 28,
    progressBefore: 64,
    progressAfter: 64,
    isLoading: true,
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
