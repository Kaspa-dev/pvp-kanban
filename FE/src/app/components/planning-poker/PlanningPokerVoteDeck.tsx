import { FormEvent, useId, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import type { PlanningPokerSessionTask } from "../../utils/planningPoker";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerVoteDeckProps {
  activeTask: PlanningPokerSessionTask | null;
  nextTask: PlanningPokerSessionTask | null;
  cardValues: number[];
  selectedValue: number | null;
  isRevealed: boolean;
  isHost: boolean;
  isSubmitting: boolean;
  isSelectingRecommendation: boolean;
  isApplyingRecommendation: boolean;
  isAdvancingTask: boolean;
  disabled: boolean;
  onVote: (value: number) => void | Promise<void>;
  onSelectRecommendation: (storyPoints: number) => void | Promise<void>;
  onApplyRecommendation: (sessionTaskId: number) => void | Promise<void>;
  onAdvanceToNextTask: () => void | Promise<void>;
}

export function PlanningPokerVoteDeck({
  activeTask,
  nextTask,
  cardValues,
  selectedValue,
  isRevealed,
  isHost,
  isSubmitting,
  isSelectingRecommendation,
  isApplyingRecommendation,
  isAdvancingTask,
  disabled,
  onVote,
  onSelectRecommendation,
  onApplyRecommendation,
  onAdvanceToNextTask,
}: PlanningPokerVoteDeckProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const customVoteInputId = useId();
  const customRecommendationInputId = useId();
  const [customVote, setCustomVote] = useState("");
  const [customRecommendationDraft, setCustomRecommendationDraft] = useState<{
    sessionTaskId: number;
    value: string;
  } | null>(null);
  const customRecommendation =
    activeTask && customRecommendationDraft?.sessionTaskId === activeTask.sessionTaskId
      ? customRecommendationDraft.value
      : activeTask?.recommendedStoryPoints === null || !activeTask
        ? ""
        : String(activeTask.recommendedStoryPoints);
  const parsedCustomVote = Number(customVote);
  const parsedCustomRecommendation = Number(customRecommendation);
  const canSubmitCustomVote =
    customVote.trim().length > 0 &&
    Number.isFinite(parsedCustomVote) &&
    parsedCustomVote >= 0 &&
    parsedCustomVote <= 100 &&
    Number.isInteger(parsedCustomVote) &&
    !disabled &&
    !isSubmitting;
  const isCustomVoteSelected =
    selectedValue !== null &&
    customVote.trim().length > 0 &&
    Number.isFinite(parsedCustomVote) &&
    selectedValue === parsedCustomVote;

  const hasAppliedEstimate = activeTask?.appliedStoryPoints !== null;
  const hasValidCustomRecommendation =
    customRecommendation.trim().length > 0 &&
    Number.isFinite(parsedCustomRecommendation) &&
    Number.isInteger(parsedCustomRecommendation) &&
    parsedCustomRecommendation >= 0 &&
    parsedCustomRecommendation <= 100;
  const canSaveEstimate =
    Boolean(activeTask) &&
    isHost &&
    activeTask?.appliedStoryPoints === null &&
    hasValidCustomRecommendation &&
    !isSelectingRecommendation &&
    !isApplyingRecommendation;
  const canContinue = isHost && Boolean(nextTask) && !isAdvancingTask;

  const setRecommendationDraft = (value: string) => {
    if (!activeTask) {
      return;
    }

    setCustomRecommendationDraft({ sessionTaskId: activeTask.sessionTaskId, value });
  };

  const saveEstimate = async () => {
    if (!activeTask || !canSaveEstimate) {
      return;
    }

    if (activeTask.recommendedStoryPoints !== parsedCustomRecommendation) {
      await onSelectRecommendation(parsedCustomRecommendation);
    }

    await onApplyRecommendation(activeTask.sessionTaskId);
  };

  if (isRevealed && activeTask) {
    return (
      <section
        className={`border-t px-1 pt-5 ${currentTheme.border}`}
        aria-labelledby="planning-poker-final-estimate-title"
        aria-live="polite"
      >
        {hasAppliedEstimate ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className={`inline-flex items-center gap-2 text-sm font-semibold ${currentTheme.primaryText}`}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Saved
                </p>
                {nextTask ? (
                  <h2 id="planning-poker-final-estimate-title" className={`mt-2 font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                    Next: <span className="break-words">{nextTask.title}</span>
                  </h2>
                ) : (
                  <h2 id="planning-poker-final-estimate-title" className={`mt-2 font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                    No more tasks
                  </h2>
                )}
              </div>

              {isHost && nextTask ? (
                <Button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => void onAdvanceToNextTask()}
                  className={`group min-h-14 w-full rounded-2xl bg-gradient-to-r px-6 text-base font-semibold text-white shadow-xl transition-all hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 sm:w-auto sm:min-w-64 ${currentTheme.primary}`}
                  aria-label={`Continue to ${nextTask.title}`}
                >
                  {isAdvancingTask ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Continuing
                    </>
                  ) : (
                    <span className="flex min-w-0 items-center justify-center gap-3">
                      <span>Continue</span>
                      <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        ) : isHost ? (
          <div>
            <div className="mb-4">
              <div className="min-w-0">
                <h2 id="planning-poker-final-estimate-title" className={`font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  Save estimate
                </h2>
                {nextTask ? (
                  <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                    Next: <span className={`font-semibold ${currentTheme.text}`}>{nextTask.title}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {cardValues.map((value) => {
                const isSelected =
                  hasValidCustomRecommendation && parsedCustomRecommendation === value;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isSelectingRecommendation}
                    onClick={() => {
                      setRecommendationDraft(String(value));
                      void onSelectRecommendation(value);
                    }}
                    className={cn(
                      "font-due-date h-11 min-w-12 rounded-2xl border px-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2",
                      currentTheme.focus,
                      isSelected
                        ? `border-transparent bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                        : `${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.035] hover:bg-white/[0.06]" : "bg-white hover:bg-slate-50"}`,
                    )}
                    aria-pressed={isSelected}
                  >
                    {value}
                  </button>
                );
              })}

              <div className="min-w-[10rem] flex-1 sm:flex-none">
                <label className="sr-only" htmlFor={customRecommendationInputId}>
                  Custom final estimate
                </label>
                <input
                  id={customRecommendationInputId}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  value={customRecommendation}
                  disabled={isSelectingRecommendation}
                  onChange={(event) => setRecommendationDraft(event.target.value)}
                  placeholder="Estimate"
                  aria-invalid={customRecommendation.trim().length > 0 && !hasValidCustomRecommendation}
                  className={cn(
                    "h-11 w-full min-w-0 rounded-2xl border px-3 text-sm outline-none transition-colors focus:ring-2 sm:w-28",
                    currentTheme.focus,
                    currentTheme.border,
                    currentTheme.text,
                    isDarkMode ? "bg-zinc-950/65 placeholder:text-zinc-500" : "bg-white placeholder:text-slate-400",
                    customRecommendation.trim().length > 0 && !hasValidCustomRecommendation && "border-red-500 focus:ring-red-500/30",
                  )}
                />
              </div>

              <Button
                type="button"
                disabled={!canSaveEstimate}
                onClick={() => void saveEstimate()}
                className={`h-11 rounded-2xl bg-gradient-to-r px-5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${currentTheme.primary}`}
              >
                {isSelectingRecommendation || isApplyingRecommendation ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving
                  </>
                ) : (
                  "Save estimate"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h2 id="planning-poker-final-estimate-title" className={`font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              Votes revealed
            </h2>
            <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
              {activeTask.appliedStoryPoints !== null ? (
                <>
                  Saved estimate: <span className={`font-due-date font-semibold ${currentTheme.text}`}>{activeTask.appliedStoryPoints}</span>
                </>
              ) : activeTask.recommendedStoryPoints !== null ? (
                <>
                  Proposed estimate: <span className={`font-due-date font-semibold ${currentTheme.text}`}>{activeTask.recommendedStoryPoints}</span>
                </>
              ) : (
                "Waiting for the host to save the estimate."
              )}
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className={`border-t px-1 pt-5 ${currentTheme.border}`}
      aria-labelledby="planning-poker-vote-deck-title"
    >
      <div className="mb-4 flex min-h-10 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="planning-poker-vote-deck-title" className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
            Your card
          </h2>
        </div>
        {isSubmitting ? (
          <span className={`inline-flex items-center gap-2 text-sm ${currentTheme.textMuted}`}>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving vote
          </span>
        ) : null}
      </div>

      <div
        className="flex flex-wrap items-start gap-2.5 pb-1"
        role="group"
        aria-labelledby="planning-poker-vote-deck-title"
      >
        {cardValues.map((value) => {
          const isSelected = selectedValue === value;

          return (
            <button
              key={value}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => void onVote(value)}
              aria-pressed={isSelected}
            className={cn(
              "font-due-date group relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-2xl font-semibold shadow-[0_16px_36px_-30px_rgba(15,23,42,0.55)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2",
              currentTheme.focus,
                disabled || isSubmitting
                  ? isDarkMode
                    ? "cursor-not-allowed border-zinc-800 bg-zinc-950/45 text-zinc-600"
                    : "cursor-not-allowed border-slate-200 bg-slate-100/80 text-slate-400"
                  : isDarkMode
                    ? "border-zinc-700/90 bg-zinc-950/72 text-zinc-100 hover:-translate-y-1 hover:border-zinc-500 hover:bg-zinc-900"
                    : "border-slate-300 bg-white text-slate-700 hover:-translate-y-1 hover:border-slate-400 hover:bg-slate-50",
                isSelected &&
                  `border-transparent bg-gradient-to-br ${currentTheme.primary} text-white shadow-[0_20px_46px_-28px_rgba(15,23,42,0.78)]`,
              )}
            >
              <span className="sr-only">{isSelected ? "Selected estimate " : "Vote estimate "}</span>
              {value}
            </button>
          );
        })}

        <form
          className="grid min-w-[10rem] flex-1 grid-cols-[1fr_auto] gap-2 sm:flex-none"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!canSubmitCustomVote) {
              return;
            }

            void onVote(parsedCustomVote);
          }}
        >
          <label className="sr-only" htmlFor={customVoteInputId}>
            Custom story point estimate
          </label>
          <input
            id={customVoteInputId}
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="numeric"
            value={customVote}
            disabled={disabled || isSubmitting}
            onChange={(event) => setCustomVote(event.target.value)}
            placeholder="Custom"
            className={cn(
              "h-12 min-w-0 rounded-2xl border px-3 text-sm outline-none transition-colors focus:ring-2 sm:h-24 sm:w-24",
              currentTheme.focus,
              isCustomVoteSelected
                ? `${currentTheme.primaryBorder} ${currentTheme.primaryText} ${currentTheme.primaryBg}`
                : `${currentTheme.border} ${currentTheme.text} ${isDarkMode ? "bg-zinc-950/72 placeholder:text-zinc-500" : "bg-white placeholder:text-slate-400"}`,
              (disabled || isSubmitting) && "cursor-not-allowed opacity-60",
            )}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!canSubmitCustomVote}
            className={`h-12 rounded-2xl border px-4 text-sm font-semibold sm:h-24 ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-zinc-950/72 hover:bg-zinc-900" : "bg-white hover:bg-slate-50"}`}
          >
            Use
          </Button>
        </form>
      </div>
    </section>
  );
}
