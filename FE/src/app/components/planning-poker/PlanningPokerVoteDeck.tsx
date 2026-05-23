import { FormEvent, useId, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerVoteDeckProps {
  cardValues: number[];
  selectedValue: number | null;
  isSubmitting: boolean;
  disabled: boolean;
  onVote: (value: number) => void | Promise<void>;
}

export function PlanningPokerVoteDeck({
  cardValues,
  selectedValue,
  isSubmitting,
  disabled,
  onVote,
}: PlanningPokerVoteDeckProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const customVoteInputId = useId();
  const [customVote, setCustomVote] = useState("");
  const parsedCustomVote = Number(customVote);
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
  return (
    <section
      className={`rounded-[2rem] border px-4 py-4 shadow-[0_20px_64px_-52px_rgba(15,23,42,0.6)] ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/62" : "bg-white/82"}`}
      aria-labelledby="planning-poker-vote-deck-title"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        className="flex flex-wrap items-start gap-2.5"
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
                "font-due-date group relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-2xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2",
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
