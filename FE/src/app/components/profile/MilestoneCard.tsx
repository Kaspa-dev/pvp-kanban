import { createElement, type CSSProperties } from "react";
import { CheckCircle2, Lock, TrendingUp } from "lucide-react";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import {
  formatMilestoneDate,
  getMilestoneIcon,
  getMilestoneProgressPercent,
  UserMilestone,
} from "../../utils/milestones";
import { getMilestoneProgressFillClassName, getMilestoneProgressTrackClassName } from "./milestoneProgressStyles";

interface MilestoneCardProps {
  milestone: UserMilestone;
}

const ACHIEVEMENT_BADGE_PALETTES = [
  { from: "#f97316", to: "#ef4444", glow: "rgba(249,115,22,0.34)" },
  { from: "#06b6d4", to: "#2563eb", glow: "rgba(37,99,235,0.32)" },
  { from: "#10b981", to: "#16a34a", glow: "rgba(16,185,129,0.32)" },
  { from: "#f59e0b", to: "#d97706", glow: "rgba(245,158,11,0.34)" },
  { from: "#ec4899", to: "#db2777", glow: "rgba(236,72,153,0.32)" },
  { from: "#8b5cf6", to: "#6366f1", glow: "rgba(139,92,246,0.32)" },
  { from: "#14b8a6", to: "#0f766e", glow: "rgba(20,184,166,0.32)" },
  { from: "#84cc16", to: "#65a30d", glow: "rgba(132,204,22,0.32)" },
  { from: "#0ea5e9", to: "#0284c7", glow: "rgba(14,165,233,0.32)" },
  { from: "#f43f5e", to: "#be123c", glow: "rgba(244,63,94,0.32)" },
  { from: "#a855f7", to: "#c026d3", glow: "rgba(168,85,247,0.32)" },
  { from: "#64748b", to: "#334155", glow: "rgba(100,116,139,0.28)" },
] as const;

function getStablePaletteIndex(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }

  return hash % ACHIEVEMENT_BADGE_PALETTES.length;
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const Icon = getMilestoneIcon(milestone.iconKey);
  const progressPercent = getMilestoneProgressPercent(milestone);
  const progressValue = Math.min(milestone.currentValue, milestone.targetValue || milestone.currentValue);
  const badgePalette = ACHIEVEMENT_BADGE_PALETTES[getStablePaletteIndex(`${milestone.category}:${milestone.iconKey}:${milestone.key}`)];
  const StateIcon = milestone.isUnlocked
    ? CheckCircle2
    : milestone.currentValue > 0
      ? TrendingUp
      : Lock;
  const stateLabel = milestone.isUnlocked
    ? "Unlocked"
    : milestone.currentValue > 0
      ? "In progress"
      : "Locked";
  const statusBadgeClassName = milestone.isUnlocked
    ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
    : milestone.currentValue > 0
      ? `border ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.primaryText}`
      : `border ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.textMuted}`;
  const badgeSurfaceStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${badgePalette.from}, ${badgePalette.to})`,
    boxShadow: `0 24px 54px -28px ${badgePalette.glow}`,
  };

  return (
    <article
      className={`rounded-[1.5rem] border px-5 py-5 ${currentTheme.border} ${currentTheme.bgSecondary} transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:${currentTheme.borderHover} hover:shadow-[0_18px_45px_-34px_rgba(15,23,42,0.55)]`}
      aria-label={`${milestone.title} milestone`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] text-white shadow-md"
            style={badgeSurfaceStyle}
          >
            {createElement(Icon, { className: "h-7 w-7", weight: "duotone" })}
          </div>
          <div className="min-w-0">
            <h3 className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>{milestone.title}</h3>
            <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>{milestone.description}</p>
          </div>
        </div>

        <span
          className={`font-due-date inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-full px-2.5 text-xs font-semibold ${statusBadgeClassName}`}
          aria-label={stateLabel}
          title={stateLabel}
        >
          <StateIcon className="h-3.5 w-3.5" />
          {milestone.currentValue > 0 && !milestone.isUnlocked ? (
            <span>{stateLabel}</span>
          ) : null}
        </span>
      </div>

      {milestone.isUnlocked ? (
        <div className={`mt-5 flex items-center justify-between gap-3 border-t pt-4 ${currentTheme.border}`}>
          <div>
            <p className={`font-due-date text-sm ${currentTheme.textMuted}`}>
              Unlocked {formatMilestoneDate(milestone.unlockedAtUtc)}
            </p>
          </div>
        </div>
      ) : (
        <div className={`mt-5 border-t pt-4 ${currentTheme.border}`}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className={currentTheme.textSecondary}>Progress</span>
            <span className={`font-due-date font-semibold ${currentTheme.text}`}>
              {progressValue} / {milestone.targetValue}
            </span>
          </div>
          <div
            className={`mt-3 h-2.5 w-full overflow-hidden rounded-full ${getMilestoneProgressTrackClassName(isDarkMode)}`}
            aria-hidden="true"
          >
            <div
              className={`h-full rounded-full ${getMilestoneProgressFillClassName(isDarkMode)} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}
