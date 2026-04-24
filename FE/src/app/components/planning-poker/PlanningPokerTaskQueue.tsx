import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, ListTodo, LoaderCircle } from "lucide-react";

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
  isApplyingRecommendation: boolean;
  isAdvancingTask: boolean;
  canOpenBacklogPicker: boolean;
  onSelectRecommendation: (storyPoints: number) => void | Promise<void>;
  onApplyRecommendation: (sessionTaskId: number) => void | Promise<void>;
  onAdvanceToNextTask: () => void | Promise<void>;
  onOpenBacklogPicker: () => void;
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
  isApplyingRecommendation,
  isAdvancingTask,
  canOpenBacklogPicker,
  onSelectRecommendation,
  onApplyRecommendation,
  onAdvanceToNextTask,
  onOpenBacklogPicker,
}: PlanningPokerTaskQueueProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [customRecommendation, setCustomRecommendation] = useState("");
  const parsedCustomRecommendation = Number(customRecommendation);
  const canSubmitCustomRecommendation =
    customRecommendation.trim().length > 0 &&
    Number.isFinite(parsedCustomRecommendation) &&
    Number.isInteger(parsedCustomRecommendation) &&
    parsedCustomRecommendation >= 0 &&
    parsedCustomRecommendation <= 100 &&
    !isSelectingRecommendation;
  const isCustomRecommendationSelected =
    activeTask?.recommendedStoryPoints !== null &&
    customRecommendation.trim().length > 0 &&
    Number.isFinite(parsedCustomRecommendation) &&
    activeTask?.recommendedStoryPoints === parsedCustomRecommendation;
  const shouldShowRecommendationControls =
    Boolean(activeTask) &&
    isRevealed &&
    isHost &&
    activeTask?.appliedStoryPoints === null;
  const canApplyRecommendation =
    Boolean(activeTask) &&
    isRevealed &&
    isHost &&
    activeTask?.recommendedStoryPoints !== null &&
    activeTask?.appliedStoryPoints === null;
  const canAdvanceToNextTask =
    Boolean(activeTask) &&
    isHost &&
    queue.length > 0 &&
    !isAdvancingTask;

  return (
    <section className="space-y-3" aria-labelledby="planning-poker-active-task">
      {activeTask ? (
        <div className={`space-y-3 border-b ${currentTheme.border} pb-3`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}
                >
                  Current task
                </p>
                <span className={`text-xs ${currentTheme.textMuted}`}>
                  {getRoundStateLabel(activeTask.roundState)}
                </span>
                {isHost ? (
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canOpenBacklogPicker}
                      onClick={onOpenBacklogPicker}
                      className={cn(
                        "h-8 rounded-lg border px-2.5 text-xs font-semibold",
                        currentTheme.border,
                        isDarkMode
                          ? "bg-slate-950/60 text-slate-100 hover:bg-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <ListTodo className="h-3.5 w-3.5" aria-hidden="true" />
                      Backlog
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canAdvanceToNextTask}
                      onClick={() => void onAdvanceToNextTask()}
                      className={cn(
                        "h-8 rounded-lg border px-2.5 text-xs font-semibold",
                        currentTheme.border,
                        isDarkMode
                          ? "bg-slate-950/60 text-slate-100 hover:bg-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {isAdvancingTask ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          Moving
                        </>
                      ) : (
                        <>
                          Next task
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
              <h2
                id="planning-poker-active-task"
                className={`text-2xl font-semibold tracking-tight ${currentTheme.text}`}
              >
                {activeTask.title}
              </h2>
              {activeTask.description?.trim() ? (
                <p className={`max-w-3xl text-sm leading-6 ${currentTheme.textMuted}`}>
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
            </div>
            {shouldShowRecommendationControls ? (
              <div className="shrink-0 space-y-2 sm:max-w-[25rem] sm:text-right">
                <div className="flex flex-wrap justify-end gap-2">
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
                  <form
                    className="flex gap-2"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();

                      if (!canSubmitCustomRecommendation) {
                        return;
                      }

                      void onSelectRecommendation(parsedCustomRecommendation);
                    }}
                  >
                    <label className="sr-only" htmlFor="planning-poker-custom-recommendation">
                      Custom final story point estimate
                    </label>
                    <input
                      id="planning-poker-custom-recommendation"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      inputMode="numeric"
                      value={customRecommendation}
                      disabled={isSelectingRecommendation}
                      onChange={(event) => setCustomRecommendation(event.target.value)}
                      placeholder="Custom"
                      className={cn(
                        "h-10 w-28 rounded-xl border px-3 text-sm outline-none transition-colors",
                        currentTheme.border,
                        isDarkMode
                          ? "bg-slate-950/60 text-slate-100 placeholder:text-slate-500"
                          : "bg-white text-slate-700 placeholder:text-slate-400",
                        isCustomRecommendationSelected &&
                          cn(
                            currentTheme.primaryText,
                            `border ${currentTheme.primaryBorder}`,
                            `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
                          ),
                      )}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={!canSubmitCustomRecommendation}
                      className={cn(
                        "h-10 rounded-xl border px-3 text-sm font-semibold",
                        currentTheme.border,
                        isDarkMode
                          ? "bg-slate-950/60 text-slate-100 hover:bg-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      Use
                    </Button>
                  </form>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <p className={`flex items-center gap-2 text-right text-xs ${currentTheme.textMuted}`}>
                    {isSelectingRecommendation ? (
                      <>
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        Saving recommendation...
                      </>
                    ) : activeTask.appliedStoryPoints !== null ? (
                      "Estimate saved on the task."
                    ) : activeTask.recommendedStoryPoints !== null ? (
                      "Ready to apply the selected estimate, or move on."
                    ) : (
                      "You can keep estimating or move to the next task."
                    )}
                  </p>
                  <Button
                    type="button"
                    disabled={!canApplyRecommendation || isApplyingRecommendation}
                    onClick={() => activeTask && void onApplyRecommendation(activeTask.sessionTaskId)}
                    className={cn(
                      "h-10 rounded-xl bg-gradient-to-r px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60",
                      currentTheme.primary,
                      currentTheme.primaryHover,
                    )}
                  >
                    {isApplyingRecommendation ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Applying
                      </>
                    ) : (
                      "Apply to task"
                    )}
                  </Button>
                </div>
              </div>
            ) : isRevealed ? (
              <p className={`shrink-0 text-sm ${currentTheme.textMuted}`}>
                {activeTask.recommendedStoryPoints !== null
                  ? activeTask.appliedStoryPoints === null
                    ? isHost
                      ? queue.length > 0
                        ? "Apply the estimate to save it on the task, or move to the next task."
                        : "Apply the estimate to save it on the task."
                      : "Waiting for the host to apply this estimate."
                    : queue.length > 0
                      ? isHost
                        ? "This estimate has been saved. Continue to the next task when ready."
                        : "This estimate has been saved. Waiting for the host to move to the next task."
                      : "This estimate has been saved on the task."
                  : "Waiting for the host to choose the final estimate."}
              </p>
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

    </section>
  );
}
