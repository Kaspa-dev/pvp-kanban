import { createElement } from "react";
import { CheckCircle2, Lock, TrendingUp } from "lucide-react";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import {
  formatMilestoneDate,
  getMilestoneCategoryLabel,
  getMilestoneIcon,
  getMilestoneProgressPercent,
  UserMilestone,
} from "../../utils/milestones";

interface MilestoneCardProps {
  milestone: UserMilestone;
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const Icon = getMilestoneIcon(milestone.iconKey);
  const progressPercent = getMilestoneProgressPercent(milestone);
  const progressValue = Math.min(milestone.currentValue, milestone.targetValue || milestone.currentValue);
  const stateLabel = milestone.isUnlocked
    ? "Unlocked"
    : milestone.currentValue > 0
      ? "In progress"
      : "Coming up";
  const StateIcon = milestone.isUnlocked
    ? CheckCircle2
    : milestone.currentValue > 0
      ? TrendingUp
      : Lock;

  return (
    <article
      className={`rounded-[1.5rem] border p-5 ${currentTheme.border} ${currentTheme.cardBg}`}
      aria-label={`${milestone.title} milestone`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${currentTheme.primary} text-white shadow-md`}>
            {createElement(Icon, { className: "h-5 w-5" })}
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>
              {getMilestoneCategoryLabel(milestone.category)}
            </p>
            <h3 className={`mt-2 text-lg font-semibold ${currentTheme.text}`}>{milestone.title}</h3>
            <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>{milestone.description}</p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
          <StateIcon className="h-3.5 w-3.5" />
          {stateLabel}
        </span>
      </div>

      {milestone.isUnlocked ? (
        <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className={`text-sm font-semibold ${currentTheme.text}`}>Achievement earned</p>
            <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
              Unlocked {formatMilestoneDate(milestone.unlockedAtUtc)}
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
            {milestone.targetValue > 1 ? `${milestone.targetValue} target` : "First win"}
          </div>
        </div>
      ) : (
        <div className="mt-5 border-t pt-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className={currentTheme.textSecondary}>Progress</span>
            <span className={`font-semibold ${currentTheme.text}`}>
              {progressValue} / {milestone.targetValue}
            </span>
          </div>
          <div
            className={`mt-3 h-2.5 w-full overflow-hidden rounded-full ${currentTheme.isDark ? "bg-gray-700/80" : "bg-slate-200"}`}
            aria-hidden="true"
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${currentTheme.primary} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className={`mt-3 text-sm ${currentTheme.textMuted}`}>
            {milestone.currentValue > 0
              ? `${Math.max(milestone.targetValue - progressValue, 0)} more to unlock this achievement.`
              : "No progress recorded yet. The first qualifying action will start the meter."}
          </p>
        </div>
      )}
    </article>
  );
}
