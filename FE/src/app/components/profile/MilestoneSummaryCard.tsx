import { ArrowRight, Lock, Trophy } from "lucide-react";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { formatMilestoneDate, UserMilestoneSummary } from "../../utils/milestones";

interface MilestoneSummaryCardProps {
  summary: UserMilestoneSummary;
  isLoading: boolean;
  errorMessage: string;
  onViewAll: () => void;
}

export function MilestoneSummaryCard({
  summary,
  isLoading,
  errorMessage,
  onViewAll,
}: MilestoneSummaryCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const unlockedCount = summary.unlockedCount;
  const totalCount = summary.totalCount;
  const completionPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <section className={`rounded-[1.75rem] border p-6 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>Achievements</p>
          <h2 className={`mt-2 text-2xl font-semibold ${currentTheme.text}`}>Milestones</h2>
          <p className={`mt-2 max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
            Keep an eye on the next wins waiting in your Kanban journey, then open the full page for category-by-category progress.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all ${currentTheme.primary}`}
          aria-label="View all milestones"
        >
          View all milestones
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {errorMessage ? (
        <div
          className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`animate-pulse rounded-[1.5rem] border p-5 ${currentTheme.border} ${currentTheme.cardBg}`}>
            <div className={`h-4 w-28 rounded-full ${currentTheme.primaryBg}`} />
            <div className={`mt-4 h-8 w-36 rounded-full ${currentTheme.primaryBg}`} />
            <div className={`mt-4 h-2.5 w-full rounded-full ${currentTheme.primaryBg}`} />
          </div>
          <div className={`animate-pulse rounded-[1.5rem] border p-5 ${currentTheme.border} ${currentTheme.cardBg}`}>
            <div className={`h-4 w-24 rounded-full ${currentTheme.primaryBg}`} />
            <div className={`mt-4 h-16 w-full rounded-[1rem] ${currentTheme.primaryBg}`} />
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`rounded-[1.5rem] border p-5 ${currentTheme.border} ${currentTheme.cardBg}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-[1rem] bg-gradient-to-br ${currentTheme.primary} text-white`}>
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${currentTheme.text}`}>{unlockedCount} unlocked</p>
                <p className={`text-sm ${currentTheme.textMuted}`}>{Math.max(totalCount - unlockedCount, 0)} still ahead</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span className={currentTheme.textSecondary}>Collection progress</span>
              <span className={`font-semibold ${currentTheme.text}`}>{completionPercent}%</span>
            </div>
            <div
              className={`mt-2 h-2.5 w-full overflow-hidden rounded-full ${currentTheme.isDark ? "bg-gray-700/80" : "bg-slate-200"}`}
              aria-hidden="true"
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${currentTheme.primary}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className={`rounded-[1.5rem] border p-5 ${currentTheme.border} ${currentTheme.cardBg}`}>
            {summary.recentUnlocked.length > 0 ? (
              <div>
                <p className={`text-sm font-semibold ${currentTheme.text}`}>Recently unlocked</p>
                <div className="mt-4 space-y-3">
                  {summary.recentUnlocked.slice(0, 2).map((milestone) => (
                    <div key={milestone.key} className={`rounded-[1.1rem] border px-4 py-3 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                      <p className={`text-sm font-semibold ${currentTheme.text}`}>{milestone.title}</p>
                      <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>Unlocked {formatMilestoneDate(milestone.unlockedAtUtc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : summary.upcoming.length > 0 ? (
              <div>
                <div className="flex items-center gap-2">
                  <Lock className={`h-4 w-4 ${currentTheme.primaryText}`} />
                  <p className={`text-sm font-semibold ${currentTheme.text}`}>Next up</p>
                </div>
                <div className="mt-4 space-y-3">
                  {summary.upcoming.slice(0, 2).map((milestone) => (
                    <div key={milestone.key} className={`rounded-[1.1rem] border px-4 py-3 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                      <p className={`text-sm font-semibold ${currentTheme.text}`}>{milestone.title}</p>
                      <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>{milestone.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`rounded-[1.1rem] border px-4 py-4 text-sm ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.textSecondary}`}>
                Your achievements shelf is ready. Complete tasks, create boards, and collaborate to start unlocking milestones.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
