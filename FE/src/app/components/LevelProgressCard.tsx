import { ArrowRight, LoaderCircle } from "lucide-react";
import { AppAvatar } from "./AppAvatar";
import { LevelNumberBadge } from "./LevelNumberBadge";
import { getThemeColors, useTheme, type Theme } from "../contexts/ThemeContext";
import type { GamificationSummary } from "../utils/gamification";
import { getLevelTier } from "../utils/levelBadges";
import { getPanelEyebrowClassName } from "./typographyStyles";

export const LEVEL_PROGRESS_CARD_VARIANTS = [
  {
    key: "console-strip",
    label: "Console Strip",
    description: "Current compact popover card with a cleaned-up instrument panel.",
  },
  {
    key: "meter-slab",
    label: "Meter Slab",
    description: "A strong horizontal meter block with level metadata stacked above.",
  },
  {
    key: "orbit-gauge",
    label: "Orbit Gauge",
    description: "Circular level dial paired with a compact XP track.",
  },
  {
    key: "terminal-readout",
    label: "Terminal Readout",
    description: "Dense technical readout with mono-style labels and grid energy.",
  },
  {
    key: "soft-glass",
    label: "Soft Glass",
    description: "A calmer translucent card with a low-contrast progress glow.",
  },
  {
    key: "progress-core",
    label: "Progress Core",
    description: "Centered level core with the meter radiating underneath.",
  },
  {
    key: "badge-stack",
    label: "Badge Stack",
    description: "Large rank tile stacked above a quiet XP receipt.",
  },
  {
    key: "capsule-meter",
    label: "Capsule Meter",
    description: "Huge rounded capsule meter that emphasizes the XP fill.",
  },
  {
    key: "blueprint-orbit",
    label: "Blueprint Orbit",
    description: "Blueprint grid plus an orbit gauge for the level number.",
  },
  {
    key: "terminal-blueprint",
    label: "Terminal Blueprint",
    description: "Terminal readout merged with blueprint measurement lines.",
  },
  {
    key: "neon-blueprint",
    label: "Neon Blueprint",
    description: "Neon Lane energy over a technical grid base.",
  },
  {
    key: "capsule-core",
    label: "Capsule Core",
    description: "Centered progress core with a large capsule fill underneath.",
  },
  {
    key: "stacked-meter",
    label: "Stacked Meter",
    description: "Badge Stack hierarchy with a stronger slab meter.",
  },
  {
    key: "soft-circuit",
    label: "Soft Circuit",
    description: "Soft Glass with tiny circuit pips and a quiet XP rail.",
  },
  {
    key: "console-core-orbit",
    label: "Console Core Orbit",
    description: "Console Strip identity with a compact orbit gauge docked beside a core slab.",
  },
  {
    key: "soft-orbit-slab",
    label: "Soft Orbit Slab",
    description: "Soft Glass atmosphere, row identity, and a calmer gauge-plus-meter module.",
  },
  {
    key: "blueprint-core-orbit",
    label: "Blueprint Core Orbit",
    description: "Blueprint Orbit texture with Console Strip header and Progress Core meter weight.",
  },
  {
    key: "orbit-ribbon-console",
    label: "Orbit Ribbon Console",
    description: "Console glow with a floating gauge stitched into the right side of the meter.",
  },
  {
    key: "glass-core-readout",
    label: "Glass Core Readout",
    description: "Soft Glass and Console Strip backgrounds with the gauge reduced to a readout companion.",
  },
] as const;

export type LevelProgressCardVariant = (typeof LEVEL_PROGRESS_CARD_VARIANTS)[number]["key"];

export const LEVEL_PROGRESS_DATA_VARIANTS = [
  {
    key: "xp-balance",
    label: "XP Balance",
    description: "Current XP, target XP, percent, and remaining XP.",
  },
  {
    key: "next-level",
    label: "Next Level",
    description: "Frames the card around the next level checkpoint.",
  },
  {
    key: "percent-readout",
    label: "Percent Readout",
    description: "Large completion percentage with XP as supporting detail.",
  },
  {
    key: "level-title",
    label: "Level Title",
    description: "Highlights the level title as the emotional reward.",
  },
  {
    key: "lifetime-ledger",
    label: "Lifetime Ledger",
    description: "Lifetime XP paired with current-level progress.",
  },
  {
    key: "momentum-strip",
    label: "Momentum Strip",
    description: "Weekly and monthly XP as activity momentum.",
  },
  {
    key: "task-proof",
    label: "Task Proof",
    description: "Task completions used as the concrete progress proof.",
  },
  {
    key: "checkpoint-path",
    label: "Checkpoint Path",
    description: "Shows current level moving toward the next checkpoint.",
  },
  {
    key: "compact-receipt",
    label: "Compact Receipt",
    description: "Dense receipt-style rows for a precise utility panel.",
  },
  {
    key: "cap-status",
    label: "Cap Status",
    description: "Max-level aware status text for capped and uncapped states.",
  },
] as const;

export type LevelProgressDataVariant = (typeof LEVEL_PROGRESS_DATA_VARIANTS)[number]["key"];

interface LevelProgressCardProps {
  username: string;
  fullName: string;
  level: number | null;
  summary: GamificationSummary | null;
  variant?: LevelProgressCardVariant;
  dataVariant?: LevelProgressDataVariant;
  isLoading?: boolean;
  hasError?: boolean;
  onViewProfile?: () => void;
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

function getProgressAccentPalette(theme: Theme, isDarkMode: boolean) {
  const palettes: Record<Theme, { color: string; colorStrong: string; glow: string }> = {
    purple: { color: "#a855f7", colorStrong: "#ec4899", glow: "rgba(168,85,247,0.34)" },
    ocean: { color: "#3b82f6", colorStrong: "#06b6d4", glow: "rgba(59,130,246,0.34)" },
    sunset: { color: "#f97316", colorStrong: "#ef4444", glow: "rgba(249,115,22,0.34)" },
    forest: { color: "#16a34a", colorStrong: "#10b981", glow: "rgba(22,163,74,0.34)" },
    mono: {
      color: isDarkMode ? "#d4d4d8" : "#4b5563",
      colorStrong: isDarkMode ? "#a1a1aa" : "#111827",
      glow: isDarkMode ? "rgba(212,212,216,0.18)" : "rgba(75,85,99,0.2)",
    },
    berry: { color: "#c026d3", colorStrong: "#f43f5e", glow: "rgba(192,38,211,0.34)" },
    lagoon: { color: "#14b8a6", colorStrong: "#0ea5e9", glow: "rgba(20,184,166,0.34)" },
    citrus: { color: "#84cc16", colorStrong: "#f59e0b", glow: "rgba(132,204,22,0.34)" },
    cobalt: { color: "#6366f1", colorStrong: "#2563eb", glow: "rgba(99,102,241,0.34)" },
  };

  return palettes[theme];
}

export function LevelProgressCard({
  username,
  fullName,
  level,
  summary,
  variant = "console-strip",
  dataVariant = "checkpoint-path",
  isLoading = false,
  hasError = false,
  onViewProfile,
}: LevelProgressCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const panelEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);
  const displayName = fullName.trim() || username;
  const currentLevel = summary?.currentLevel ?? level;
  const tier = getLevelTier(currentLevel ?? 1);
  const progressPercent = Math.max(0, Math.min(100, summary?.progressPercent ?? 0));
  const roundedProgressPercent = Math.round(progressPercent);
  const xpForNextLevel = summary?.xpForNextLevel ?? 0;
  const nextLevel = currentLevel && xpForNextLevel > 0 ? currentLevel + 1 : null;
  const xpText = summary && xpForNextLevel > 0
    ? `${formatNumber(summary.currentLevelXp)} / ${formatNumber(xpForNextLevel)} XP`
    : "Max level reached";
  const remainingXpText = summary && xpForNextLevel > 0
    ? `${formatNumber(summary.xpRemainingForNextLevel)} XP until next level`
    : "You are at the current level cap";
  const progressAccent = getProgressAccentPalette(theme, isDarkMode);
  const accentGradient = `linear-gradient(90deg, ${progressAccent.color}, ${progressAccent.colorStrong})`;
  const accentSoftGradient = `linear-gradient(135deg, ${progressAccent.glow}, transparent 64%)`;
  const cardSurfaceClassName = isDarkMode ? "bg-zinc-950/96" : "bg-white/96";
  const quietSurfaceClassName = isDarkMode ? "bg-zinc-900/92" : "bg-slate-50/96";
  const railClassName = isDarkMode ? "bg-zinc-800" : "bg-slate-200";

  const rootShapeClassName =
    variant === "meter-slab" ||
    variant === "terminal-blueprint" ||
    variant === "blueprint-orbit"
      ? "rounded-[1.35rem]"
      : "rounded-3xl";

  function renderHeader(mode: "row" | "center" | "dial" = "row", options?: { showLevelChip?: boolean }) {
    const showLevelChip = options?.showLevelChip ?? true;

    if (mode === "center") {
      return (
        <div className="relative flex flex-col items-center text-center">
          <AppAvatar
            username={username}
            fullName={fullName}
            size={58}
            level={currentLevel}
            className="shadow-sm"
          />
          <p className={`mt-3 max-w-full truncate text-sm font-semibold ${currentTheme.text}`}>{displayName}</p>
          <p className={`text-xs ${currentTheme.textMuted}`}>@{username}</p>
        </div>
      );
    }

    if (mode === "dial") {
      return (
        <div className="relative flex items-center gap-6">
          <div className="relative grid size-[4.25rem] place-items-center rounded-full" style={{ background: accentSoftGradient }}>
            <div
              className="absolute inset-1 rounded-full"
              style={{ background: `conic-gradient(${progressAccent.colorStrong} ${progressPercent}%, rgba(148,163,184,0.24) 0)` }}
            />
            <div className={`relative grid size-12 place-items-center rounded-full ${cardSurfaceClassName}`}>
              <span className={`font-due-date text-lg font-semibold ${currentTheme.text}`}>{currentLevel ?? "-"}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{displayName}</p>
            <p className={`truncate text-xs ${currentTheme.textMuted}`}>@{username}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex items-start gap-6">
        <AppAvatar
          username={username}
          fullName={fullName}
          size={56}
          level={currentLevel}
          className="shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{displayName}</p>
          <p className={`truncate text-xs ${currentTheme.textMuted}`}>@{username}</p>
          {showLevelChip && (
            <div className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${currentTheme.border} ${quietSurfaceClassName} ${currentTheme.textSecondary}`}>
              {summary ? `Level ${summary.currentLevel} - ${summary.currentLevelName}` : currentLevel ? `Level ${currentLevel}` : "Level loading"}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderMiniGauge(size: "small" | "medium" = "medium") {
    const outerClassName = size === "small" ? "size-12" : "size-14";
    const innerClassName = size === "small" ? "size-8" : "size-10";
    const textClassName = size === "small" ? "text-[0.72rem]" : "text-xs";

    return (
      <div
        className={`relative grid ${outerClassName} shrink-0 place-items-center rounded-full border ${currentTheme.border}`}
        style={{ background: accentSoftGradient }}
      >
        <div
          className="absolute inset-1 rounded-full"
          style={{ background: `conic-gradient(${progressAccent.colorStrong} ${progressPercent}%, rgba(148,163,184,0.24) 0)` }}
        />
        <div className={`relative grid ${innerClassName} place-items-center rounded-full ${cardSurfaceClassName}`}>
          <span className={`font-due-date ${textClassName} font-semibold ${currentTheme.text}`}>{roundedProgressPercent}%</span>
        </div>
      </div>
    );
  }

  function renderGaugeCoreMeter(mode: "console" | "soft" | "blueprint" | "ribbon" | "readout" = "console") {
    if (!summary) {
      return renderProgressBlock();
    }

    if (mode === "ribbon") {
      return renderRibbonDataPreview();
    }

    const isReadout = mode === "readout";
    const label = mode === "blueprint" ? "XP VECTOR" : mode === "soft" ? "XP Flow" : "XP Meter";

    return (
      <div
        className={`relative overflow-hidden rounded-2xl border ${currentTheme.border} ${quietSurfaceClassName}`}
      >
        {mode === "blueprint" && (
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage: `linear-gradient(90deg, ${progressAccent.color} 1px, transparent 1px)`,
              backgroundSize: "18px 100%",
            }}
          />
        )}
        <div
          className="relative h-2.5"
          style={{ background: accentGradient, width: `${progressPercent}%` }}
        />
        <div className={`relative grid gap-3 p-3.5 ${isReadout ? "grid-cols-[1fr_auto]" : "grid-cols-[auto_1fr]"} items-center`}>
          {!isReadout && renderMiniGauge("medium")}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className={`truncate ${panelEyebrowClassName}`}>{label}</p>
              <span className={`font-due-date text-xs font-semibold ${currentTheme.text}`}>LVL {currentLevel ?? "-"}</span>
            </div>
            <p className={`font-due-date mt-1 truncate text-lg font-semibold ${currentTheme.text}`}>{xpText}</p>
            <div className={`mt-2 h-2 overflow-hidden rounded-full ${railClassName}`}>
              <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accentGradient }} />
            </div>
            <p className={`mt-2 truncate text-xs ${currentTheme.textMuted}`}>{remainingXpText}</p>
          </div>
          {isReadout && renderMiniGauge("small")}
        </div>
      </div>
    );
  }

  function renderRibbonDataPreview() {
    if (!summary) {
      return renderProgressBlock();
    }

    const smallMetricClassName = `rounded-xl border px-3 py-2 ${currentTheme.border} ${isDarkMode ? "bg-black/16" : "bg-white/64"}`;

    const renderMiniBar = () => (
      <div className={`mt-3 h-2 overflow-hidden rounded-full ${railClassName}`}>
        <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accentGradient }} />
      </div>
    );

    const contentByVariant: Record<LevelProgressDataVariant, JSX.Element> = {
      "xp-balance": (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className={panelEyebrowClassName}>XP Meter</p>
              <p className={`font-due-date mt-1 truncate text-lg font-semibold ${currentTheme.text}`}>{xpText}</p>
            </div>
            <span className={`font-due-date text-2xl font-semibold ${currentTheme.text}`}>{roundedProgressPercent}%</span>
          </div>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{remainingXpText}</p>
        </>
      ),
      "next-level": (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={panelEyebrowClassName}>Next checkpoint</p>
              <p className={`font-ui-condensed mt-1 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                {nextLevel ? `Level ${nextLevel}` : "Level cap"}
              </p>
            </div>
            <span className={`font-due-date rounded-full px-2.5 py-1 text-xs font-semibold ${quietSurfaceClassName} ${currentTheme.textSecondary}`}>
              {roundedProgressPercent}%
            </span>
          </div>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{nextLevel ? remainingXpText : "No further checkpoint available"}</p>
        </>
      ),
      "percent-readout": (
        <>
          <div className="grid grid-cols-[auto_1fr] items-end gap-4">
            <span className={`font-due-date text-4xl font-semibold leading-none ${currentTheme.text}`}>{roundedProgressPercent}%</span>
            <div className="min-w-0">
              <p className={`font-due-date mt-1 truncate text-sm font-semibold ${currentTheme.textSecondary}`}>{xpText}</p>
            </div>
          </div>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{remainingXpText}</p>
        </>
      ),
      "level-title": (
        <>
          <p className={panelEyebrowClassName}>Current title</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p className={`font-ui-condensed truncate text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              {summary.currentLevelName}
            </p>
            <span className={`font-due-date text-sm font-semibold ${currentTheme.textSecondary}`}>L{summary.currentLevel}</span>
          </div>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{xpText}</p>
        </>
      ),
      "lifetime-ledger": (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className={smallMetricClassName}>
              <p className={panelEyebrowClassName}>Lifetime</p>
              <p className={`font-due-date mt-1 text-base font-semibold ${currentTheme.text}`}>{formatNumber(summary.lifetimeXp)} XP</p>
            </div>
            <div className={smallMetricClassName}>
              <p className={panelEyebrowClassName}>This level</p>
              <p className={`font-due-date mt-1 text-base font-semibold ${currentTheme.text}`}>{formatNumber(summary.currentLevelXp)} XP</p>
            </div>
          </div>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{remainingXpText}</p>
        </>
      ),
      "momentum-strip": (
        <>
          <p className={panelEyebrowClassName}>Momentum</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className={smallMetricClassName}>
              <p className={panelEyebrowClassName}>Week</p>
              <p className={`font-due-date mt-1 text-base font-semibold ${currentTheme.text}`}>+{formatNumber(summary.weeklyXp)} XP</p>
            </div>
            <div className={smallMetricClassName}>
              <p className={panelEyebrowClassName}>Month</p>
              <p className={`font-due-date mt-1 text-base font-semibold ${currentTheme.text}`}>+{formatNumber(summary.monthlyXp)} XP</p>
            </div>
          </div>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{xpText}</p>
        </>
      ),
      "task-proof": (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className={panelEyebrowClassName}>Completed work</p>
              <p className={`font-due-date mt-1 text-3xl font-semibold leading-none ${currentTheme.text}`}>{formatNumber(summary.tasksCompleted)}</p>
            </div>
            <p className={`max-w-[9rem] text-right text-xs leading-5 ${currentTheme.textMuted}`}>tasks converted into {formatNumber(summary.lifetimeXp)} lifetime XP</p>
          </div>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{remainingXpText}</p>
        </>
      ),
      "checkpoint-path": (
        <>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <LevelNumberBadge level={summary.currentLevel} size="sm" />
            <div className={`h-1.5 overflow-hidden rounded-full ${railClassName}`}>
              <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accentGradient }} />
            </div>
            {nextLevel ? (
              <LevelNumberBadge level={nextLevel} size="sm" />
            ) : (
              <span className={`font-due-date rounded-full px-3 py-1.5 text-xs font-semibold ${quietSurfaceClassName} ${currentTheme.text}`}>
                CAP
              </span>
            )}
          </div>
          <p className={`mt-3 text-xs ${currentTheme.textMuted}`}>{remainingXpText}</p>
        </>
      ),
      "compact-receipt": (
        <div className="space-y-2">
          {[
            ["LEVEL", String(summary.currentLevel)],
            ["TITLE", summary.currentLevelName],
            ["XP", xpText],
            ["LEFT", remainingXpText],
          ].map(([label, value]) => (
            <div key={label} className={`flex items-center justify-between gap-3 border-b pb-1.5 text-xs ${currentTheme.border}`}>
              <span className={panelEyebrowClassName}>{label}</span>
              <span className={`font-due-date truncate text-right font-semibold ${currentTheme.text}`}>{value}</span>
            </div>
          ))}
        </div>
      ),
      "cap-status": (
        <>
          <p className={panelEyebrowClassName}>Status</p>
          <p className={`font-ui-condensed mt-1 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
            {nextLevel ? `${formatNumber(summary.xpRemainingForNextLevel)} XP to Level ${nextLevel}` : "Max level reached"}
          </p>
          {renderMiniBar()}
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
            {nextLevel ? `${xpText} completed for this level` : `${formatNumber(summary.lifetimeXp)} lifetime XP secured`}
          </p>
        </>
      ),
    };

    return (
      <div className={`relative overflow-hidden rounded-2xl border ${currentTheme.border} ${quietSurfaceClassName}`}>
        <div className="relative p-3.5">{contentByVariant[dataVariant]}</div>
      </div>
    );
  }

  function renderProgressBlock(mode: "standard" | "slab" | "rail" | "ledger" = "standard") {
    if (isLoading && !summary) {
      return (
        <div className={`relative rounded-2xl border p-4 ${currentTheme.border} ${quietSurfaceClassName}`}>
          <div className={`flex items-center gap-2 text-sm ${currentTheme.textMuted}`}>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading progress...
          </div>
        </div>
      );
    }

    if (!summary) {
      return (
        <div className={`relative rounded-2xl border p-4 ${currentTheme.border} ${quietSurfaceClassName}`}>
          <p className={`text-sm ${hasError ? "text-red-500" : currentTheme.textMuted}`}>
            Progress unavailable right now.
          </p>
        </div>
      );
    }

    if (mode === "slab") {
      return (
        <div className={`relative overflow-hidden rounded-2xl border ${currentTheme.border} ${quietSurfaceClassName}`}>
          <div className="h-3" style={{ background: accentGradient, width: `${progressPercent}%` }} />
          <div className="p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className={panelEyebrowClassName}>XP Meter</p>
                <p className={`font-due-date mt-1 text-lg font-semibold ${currentTheme.text}`}>{xpText}</p>
              </div>
              <span className={`font-due-date text-2xl font-semibold ${currentTheme.text}`}>{roundedProgressPercent}%</span>
            </div>
            <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{remainingXpText}</p>
          </div>
        </div>
      );
    }

    if (mode === "rail") {
      return (
        <div className={`relative rounded-2xl border p-4 ${currentTheme.border} ${quietSurfaceClassName}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={panelEyebrowClassName}>Rail load</span>
            <span className={`font-due-date text-xs font-semibold ${currentTheme.text}`}>{roundedProgressPercent}%</span>
          </div>
          <div className={`mt-3 grid h-5 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-full px-2 ${railClassName}`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: progressAccent.colorStrong }} />
            <div className={`h-1.5 overflow-hidden rounded-full ${isDarkMode ? "bg-black/50" : "bg-white/80"}`}>
              <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accentGradient }} />
            </div>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: progressAccent.color }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className={`font-due-date ${currentTheme.textSecondary}`}>{xpText}</span>
            <span className={currentTheme.textMuted}>{remainingXpText}</span>
          </div>
        </div>
      );
    }

    if (mode === "ledger") {
      return (
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className={panelEyebrowClassName}>XP Progress</span>
            <span className={`font-due-date text-xs font-semibold ${currentTheme.text}`}>{roundedProgressPercent}%</span>
          </div>
          <div className={`mt-3 h-2 overflow-hidden rounded-full ${railClassName}`}>
            <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accentGradient }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className={`font-due-date ${currentTheme.textSecondary}`}>{xpText}</span>
            <span className={currentTheme.textMuted}>{remainingXpText}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative rounded-2xl border p-4 ${currentTheme.border} ${quietSurfaceClassName}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={panelEyebrowClassName}>XP Progress</span>
          <span className={`font-due-date text-xs font-semibold ${currentTheme.text}`}>{roundedProgressPercent}%</span>
        </div>
        <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${railClassName}`}>
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accentGradient }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className={`font-due-date ${currentTheme.textSecondary}`}>{xpText}</span>
          <span className={currentTheme.textMuted}>{remainingXpText}</span>
        </div>
      </div>
    );
  }

  function renderVariantContent() {
    if (variant === "meter-slab") {
      return (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{displayName}</p>
              <p className={`text-xs ${currentTheme.textMuted}`}>Level <span className="font-due-date">{currentLevel ?? "-"}</span> - {summary?.currentLevelName ?? tier.name}</p>
            </div>
            <AppAvatar username={username} fullName={fullName} size={44} level={currentLevel} className="shadow-sm" />
          </div>
          <div className="mt-4">{renderProgressBlock("slab")}</div>
        </>
      );
    }

    if (variant === "orbit-gauge") {
      return (
        <>
          {renderHeader("dial")}
          <div className="mt-5">{renderProgressBlock("standard")}</div>
        </>
      );
    }

    if (variant === "terminal-readout") {
      return (
        <>
          <div className={`font-system-signal mb-4 flex items-center justify-between border-b pb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${currentTheme.border} ${currentTheme.textMuted}`}>
            <span>XP_CONSOLE</span>
            <span>LVL_{currentLevel ?? "..."}</span>
          </div>
          {renderHeader("row")}
          <div className="mt-5">{renderProgressBlock("rail")}</div>
        </>
      );
    }

    if (variant === "soft-glass") {
      return (
        <>
          <div className="absolute inset-0 opacity-70" style={{ background: accentSoftGradient }} />
          <div className="relative">
            {renderHeader("row")}
            <div className="mt-5">{renderProgressBlock("standard")}</div>
          </div>
        </>
      );
    }

    if (variant === "progress-core") {
      return (
        <>
          {renderHeader("center")}
          <div className="mt-5">{renderProgressBlock("slab")}</div>
        </>
      );
    }

    if (variant === "badge-stack") {
      return (
        <>
          <div className="flex items-center gap-4">
            <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-3xl border ${currentTheme.border}`} style={{ background: accentSoftGradient }}>
              <span className={`font-due-date text-3xl font-semibold ${currentTheme.text}`}>{currentLevel ?? "-"}</span>
            </div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{displayName}</p>
              <p className={`text-xs ${currentTheme.textMuted}`}>{summary?.currentLevelName ?? tier.name}</p>
            </div>
          </div>
          <div className="mt-5">{renderProgressBlock("standard")}</div>
        </>
      );
    }

    if (variant === "capsule-meter") {
      return (
        <>
          {renderHeader("row")}
          <div className={`relative mt-5 overflow-hidden rounded-full border p-1 ${currentTheme.border} ${railClassName}`}>
            <div
              className="font-due-date min-h-12 rounded-full px-4 py-3 text-right text-sm font-semibold text-white transition-[width]"
              style={{ width: `${Math.max(18, progressPercent)}%`, background: accentGradient }}
            >
              {roundedProgressPercent}%
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className={`font-due-date ${currentTheme.textSecondary}`}>{xpText}</span>
            <span className={currentTheme.textMuted}>{remainingXpText}</span>
          </div>
        </>
      );
    }

    if (variant === "blueprint-orbit") {
      return (
        <>
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at center, ${progressAccent.color} 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative">{renderHeader("dial")}</div>
          <div className="relative mt-5">{renderProgressBlock("standard")}</div>
        </>
      );
    }

    if (variant === "terminal-blueprint") {
      return (
        <>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(${progressAccent.color} 1px, transparent 1px), linear-gradient(90deg, ${progressAccent.color} 1px, transparent 1px)`,
              backgroundSize: "14px 14px",
            }}
          />
          <div className={`font-system-signal relative mb-4 border-b pb-3 text-xs ${currentTheme.border}`}>
            <p className={currentTheme.textMuted}>scan --xp @{username}</p>
            <p className={`mt-1 font-bold ${currentTheme.text}`}>LVL:{currentLevel ?? "UNKNOWN"} PROGRESS:{roundedProgressPercent}%</p>
          </div>
          <div className="relative">{renderProgressBlock("rail")}</div>
        </>
      );
    }

    if (variant === "neon-blueprint") {
      return (
        <>
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `linear-gradient(${progressAccent.color} 1px, transparent 1px), linear-gradient(90deg, ${progressAccent.color} 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: accentGradient }} />
          <div className="relative">{renderHeader("row")}</div>
          <div className="relative mt-5">{renderProgressBlock("slab")}</div>
        </>
      );
    }

    if (variant === "capsule-core") {
      return (
        <>
          {renderHeader("center")}
          <div className={`relative mt-5 overflow-hidden rounded-full border p-1 ${currentTheme.border} ${railClassName}`}>
            <div
              className="font-due-date min-h-10 rounded-full px-4 py-2 text-right text-sm font-semibold text-white transition-[width]"
              style={{ width: `${Math.max(18, progressPercent)}%`, background: accentGradient }}
            >
              {roundedProgressPercent}%
            </div>
          </div>
          <p className={`mt-3 text-center text-xs ${currentTheme.textMuted}`}>{xpText}</p>
        </>
      );
    }

    if (variant === "stacked-meter") {
      return (
        <>
          <div className="flex items-center gap-4">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl border ${currentTheme.border}`} style={{ background: accentSoftGradient }}>
              <span className={`font-due-date text-2xl font-semibold ${currentTheme.text}`}>{currentLevel ?? "-"}</span>
            </div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{displayName}</p>
              <p className={`text-xs ${currentTheme.textMuted}`}>{summary?.currentLevelName ?? tier.name}</p>
            </div>
          </div>
          <div className="mt-5">{renderProgressBlock("slab")}</div>
        </>
      );
    }

    if (variant === "soft-circuit") {
      return (
        <>
          <div className="absolute inset-0 opacity-70" style={{ background: accentSoftGradient }} />
          <div className="relative mb-4 flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: index * 20 <= progressPercent ? progressAccent.colorStrong : "rgba(148,163,184,0.28)" }}
              />
            ))}
          </div>
          <div className="relative">
            {renderHeader("row")}
            <div className="mt-5">{renderProgressBlock("standard")}</div>
          </div>
        </>
      );
    }

    if (variant === "console-core-orbit") {
      return (
        <>
          <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: progressAccent.glow }} />
          <div className="absolute left-6 top-6 h-16 w-px opacity-50" style={{ background: `linear-gradient(${progressAccent.colorStrong}, transparent)` }} />
          <div className="relative">
            {renderHeader("row")}
            <div className="mt-5">{renderGaugeCoreMeter("console")}</div>
          </div>
        </>
      );
    }

    if (variant === "soft-orbit-slab") {
      return (
        <>
          <div className="absolute inset-0 opacity-75" style={{ background: accentSoftGradient }} />
          <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: progressAccent.glow }} />
          <div className="relative">
            {renderHeader("row")}
            <div className="mt-5">{renderGaugeCoreMeter("soft")}</div>
          </div>
        </>
      );
    }

    if (variant === "blueprint-core-orbit") {
      return (
        <>
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at center, ${progressAccent.color} 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />
          <div className="absolute inset-x-5 top-5 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${progressAccent.color}, transparent)` }} />
          <div className="relative">
            {renderHeader("row")}
            <div className="mt-5">{renderGaugeCoreMeter("blueprint")}</div>
          </div>
        </>
      );
    }

    if (variant === "orbit-ribbon-console") {
      return (
        <>
          <div className="absolute -right-8 top-0 h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: progressAccent.glow }} />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(${progressAccent.color} 1px, transparent 1px), linear-gradient(90deg, ${progressAccent.color} 1px, transparent 1px)`,
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative">
            {renderHeader("row", { showLevelChip: false })}
            <div className="mt-5">{renderGaugeCoreMeter("ribbon")}</div>
          </div>
        </>
      );
    }

    if (variant === "glass-core-readout") {
      return (
        <>
          <div className="absolute inset-0 opacity-65" style={{ background: accentSoftGradient }} />
          <div
            className="absolute inset-x-0 bottom-0 h-20 opacity-35"
            style={{ background: `linear-gradient(0deg, ${progressAccent.glow}, transparent)` }}
          />
          <div className="relative">
            {renderHeader("row")}
            <div className="mt-5">{renderGaugeCoreMeter("readout")}</div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: progressAccent.glow }} />
        <div className="relative">
          {renderHeader("row")}
          <div className="mt-5">{renderProgressBlock("standard")}</div>
        </div>
      </>
    );
  }

  return (
    <article
      className={`relative w-full overflow-hidden border p-5 ${rootShapeClassName} ${currentTheme.border} ${cardSurfaceClassName} shadow-[0_24px_70px_-38px_rgba(15,23,42,0.55)]`}
    >
      {renderVariantContent()}

      {onViewProfile && (
        <button
          type="button"
          onClick={onViewProfile}
          className={`relative mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 ${currentTheme.focus} ${currentTheme.primary}`}
        >
          View profile
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}
