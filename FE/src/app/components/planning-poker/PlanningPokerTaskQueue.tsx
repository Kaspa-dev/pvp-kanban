import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useTheme, getThemeColors } from "../../contexts/ThemeContext";
import type { PlanningPokerSessionTask } from "../../utils/planningPoker";

interface PlanningPokerTaskQueueProps {
  activeTask: PlanningPokerSessionTask | null;
  queue: PlanningPokerSessionTask[];
  isRevealed: boolean;
  isHost: boolean;
  recommendationOptions: number[];
  isSelectingRecommendation: boolean;
  onSelectRecommendation: (storyPoints: number) => void | Promise<void>;
}

function getRoundStateLabel(value: string) {
  switch (value.toLowerCase()) {
    case "voting":
      return "Live round";
    case "revealed":
      return "Revealed";
    case "pending":
      return "Queued";
    default:
      return value;
  }
}

export function PlanningPokerTaskQueue({
  activeTask,
  queue,
  isRevealed,
  isHost,
  recommendationOptions,
  isSelectingRecommendation,
  onSelectRecommendation,
}: PlanningPokerTaskQueueProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const shouldShowRecommendationControls =
    Boolean(activeTask) &&
    isRevealed &&
    isHost &&
    activeTask?.appliedStoryPoints === null;

  return (
    <section className="space-y-4" aria-labelledby="planning-poker-active-task">
      {activeTask ? (
        <div className={`space-y-4 border-b ${currentTheme.border} pb-4`}>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}
              >
                Current task
              </p>
              <span className={`text-xs ${currentTheme.textMuted}`}>
                {getRoundStateLabel(activeTask.roundState)}
              </span>
            </div>
            <h2
              id="planning-poker-active-task"
              className={`text-3xl font-semibold tracking-tight ${currentTheme.text}`}
            >
              {activeTask.title}
            </h2>
            {activeTask.description?.trim() ? (
              <p className={`max-w-3xl text-sm leading-7 ${currentTheme.textMuted}`}>
                {activeTask.description}
              </p>
            ) : null}
            {isRevealed && activeTask.recommendedStoryPoints !== null ? (
              <p className={`text-sm font-medium ${currentTheme.primaryText}`}>
                Final estimate: {activeTask.recommendedStoryPoints}
              </p>
            ) : null}
            {activeTask.appliedStoryPoints !== null ? (
              <p className={`inline-flex items-center gap-2 text-sm font-medium ${currentTheme.primaryText}`}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Story points applied: {activeTask.appliedStoryPoints}
              </p>
            ) : null}
            {!isRevealed ? (
              <p className={`text-sm ${currentTheme.textMuted}`}>
                The task is active. Cast a vote, then wait for the reveal to compare estimates.
              </p>
            ) : null}
            {isRevealed && activeTask.voteSummary.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeTask.voteSummary.map((entry) => (
                  <span
                    key={entry.cardValue}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                      currentTheme.border,
                      currentTheme.textMuted,
                    )}
                  >
                    <span className={currentTheme.text}>{entry.cardValue}</span>
                    <span>x{entry.count}</span>
                  </span>
                ))}
              </div>
            ) : null}
            {isRevealed ? (
              <p className={`text-sm ${currentTheme.textMuted}`}>
                {activeTask.recommendedStoryPoints !== null
                  ? "This estimate is selected for the task after discussion."
                  : isHost
                    ? "Choose the estimate that should carry back to the board."
                    : "Waiting for the host to choose the final estimate."}
              </p>
            ) : null}
            {shouldShowRecommendationControls ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {recommendationOptions.map((value) => {
                    const isSelected = activeTask.recommendedStoryPoints === value;

                    return (
                      <Button
                        key={value}
                        type="button"
                        variant="outline"
                        disabled={isSelectingRecommendation}
                        onClick={() => void onSelectRecommendation(value)}
                        className={cn(
                          "h-10 min-w-10 rounded-xl text-sm font-semibold",
                          currentTheme.border,
                          isSelected
                            ? cn(
                                currentTheme.primaryBorder,
                                currentTheme.primaryText,
                                `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
                              )
                            : isDarkMode
                              ? "bg-slate-950/60 text-slate-100 hover:bg-slate-900"
                              : "bg-white text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        {value}
                      </Button>
                    );
                  })}
                </div>
                <p className={`flex items-center gap-2 text-xs ${currentTheme.textMuted}`}>
                  {isSelectingRecommendation ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Saving recommendation...
                    </>
                  ) : (
                    "Select the final estimate to carry back to the board."
                  )}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-2xl border px-4 py-4 text-sm",
            currentTheme.border,
            isDarkMode ? "bg-slate-950/40 text-slate-300" : "bg-white/75 text-slate-600",
          )}
        >
          No active task is available in this session.
        </div>
      )}

      {queue.length > 0 ? (
        <div className="space-y-2">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
            Up next
          </p>
          <ul className="space-y-2">
            {queue.map((task) => (
              <li key={task.sessionTaskId} className={`text-sm ${currentTheme.textMuted}`}>
                {task.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
