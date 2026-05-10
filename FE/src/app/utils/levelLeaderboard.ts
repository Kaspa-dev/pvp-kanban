export const LEADERBOARD_PERIODS = ["day", "week", "month", "year"] as const;

export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export const LEADERBOARD_PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  day: "24h",
  week: "7d",
  month: "30d",
  year: "365d",
};

export type LevelLeaderboardMember = {
  userId: number;
  username: string;
  displayName: string;
  level: number;
  xpByPeriod: Record<LeaderboardPeriod, number>;
};

export type LevelLeaderboardBoard = {
  id: number;
  name: string;
  description: string;
  logoIconKey: string;
  logoColorKey: string;
  currentUserId: number;
  members: LevelLeaderboardMember[];
};

export const LEVEL_LEADERBOARD_VARIANTS = [
  {
    key: "podium-rail",
    label: "Podium Rail",
    description: "A strong three-place podium with ranks as structural blocks.",
  },
  {
    key: "orbit-stack",
    label: "Orbit Stack",
    description: "A central XP core with avatar satellites around the winner.",
  },
  {
    key: "xp-ticker",
    label: "XP Ticker",
    description: "A compact scoreboard strip with sharp mono readouts.",
  },
  {
    key: "signal-strips",
    label: "Signal Strips",
    description: "Layered XP bars that feel like telemetry channels.",
  },
  {
    key: "crown-deck",
    label: "Crown Deck",
    description: "Winner-forward cards with premium stacked depth.",
  },
  {
    key: "crown-stack",
    label: "Crown Stack",
    description: "A vertical medal stack where each rank steps down in scale.",
  },
  {
    key: "pulse-terminal",
    label: "Pulse Terminal",
    description: "A system-console treatment for operational score state.",
  },
  {
    key: "glass-ladder",
    label: "Glass Ladder",
    description: "Soft translucent ladder rows with gentle elevation.",
  },
  {
    key: "neon-bracket",
    label: "Neon Bracket",
    description: "Rank connectors and bracket-like accent geometry.",
  },
  {
    key: "ledger-chips",
    label: "Ledger Chips",
    description: "Precise compact chips for a calmer, audit-like read.",
  },
  {
    key: "constellation-map",
    label: "Constellation Map",
    description: "Avatar nodes connected as a small leaderboard star map.",
  },
] as const;

export type LevelLeaderboardVariant = (typeof LEVEL_LEADERBOARD_VARIANTS)[number]["key"];
