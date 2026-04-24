import { FormEvent, useId, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { useTheme, getThemeColors } from "../../contexts/ThemeContext";
import type { PlanningPokerParticipant } from "../../utils/planningPoker";
import { AppAvatar } from "../AppAvatar";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerVoteDeckProps {
  cardValues: number[];
  selectedValue: number | null;
  isSubmitting: boolean;
  isRevealed: boolean;
  isRevealing: boolean;
  isHost: boolean;
  hasActiveTask: boolean;
  disabled: boolean;
  participants: PlanningPokerParticipant[];
  onReveal: () => void | Promise<void>;
  onVote: (value: number) => void | Promise<void>;
}

export function PlanningPokerVoteDeck({
  cardValues,
  selectedValue,
  isSubmitting,
  isRevealed,
  isRevealing,
  isHost,
  hasActiveTask,
  disabled,
  participants,
  onReveal,
  onVote,
}: PlanningPokerVoteDeckProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const voteDeckId = useId();
  const voteDeckHeadingId = `${voteDeckId}-heading`;
  const voteDeckHintId = `${voteDeckId}-hint`;
  const customVoteInputId = `${voteDeckId}-custom`;
  const [customVote, setCustomVote] = useState("");
  const votedCount = participants.filter((participant) => participant.hasVoted).length;
  const canReveal = isHost && !isRevealed && votedCount > 0 && !isRevealing;
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

  const statusMessage = isSubmitting
    ? "Saving vote..."
    : isRevealing
      ? "Revealing votes..."
      : isRevealed
        ? "Votes revealed."
        : !hasActiveTask
          ? "Waiting for a task."
          : selectedValue !== null
            ? `Selected ${selectedValue}.`
            : "Choose one estimate.";

  return (
    <section
      className={cn("space-y-3 border-t pt-4", currentTheme.border)}
      aria-labelledby={voteDeckHeadingId}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={voteDeckHeadingId} className={cn("text-lg font-semibold", currentTheme.text)}>
            Vote
          </h2>
          <p id={voteDeckHintId} className={cn("mt-0.5 text-sm", currentTheme.textMuted)} aria-live="polite">
            {statusMessage}
          </p>
        </div>

        {isHost ? (
          <Button
            type="button"
            disabled={!canReveal}
            onClick={() => void onReveal()}
            className={cn(
              "h-9 rounded-full bg-gradient-to-r px-4 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60",
              currentTheme.primary,
            )}
          >
            {isRevealing ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Revealing
              </>
            ) : isRevealed ? (
              "Revealed"
            ) : (
              "Reveal votes"
            )}
          </Button>
        ) : null}
      </div>

      <div
        className="grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-[repeat(8,minmax(0,1fr))_minmax(11rem,14rem)]"
        role="group"
        aria-labelledby={voteDeckHeadingId}
        aria-describedby={voteDeckHintId}
      >
        {cardValues.map((value) => {
          const isSelected = selectedValue === value;

          return (
            <Button
              key={value}
              type="button"
              variant="outline"
              disabled={disabled || isSubmitting}
              onClick={() => void onVote(value)}
              aria-pressed={isSelected}
              className={cn(
                "h-11 rounded-xl border text-base font-semibold transition-colors",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                currentTheme.border,
                currentTheme.focus,
                disabled || isSubmitting
                  ? isDarkMode
                    ? "bg-slate-950/35 text-slate-500"
                    : "bg-slate-100/70 text-slate-400"
                  : isDarkMode
                    ? "bg-transparent text-slate-100 hover:bg-white/[0.06]"
                    : "bg-transparent text-slate-700 hover:bg-slate-950/[0.04]",
                isSelected &&
                  cn(
                    currentTheme.primaryText,
                    `border ${currentTheme.primaryBorder}`,
                    `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
                  ),
                isRevealed && "opacity-70",
              )}
            >
              <span className="sr-only">{isSelected ? "Selected card " : "Vote "}</span>
              {value}
            </Button>
          );
        })}

        <form
          className="col-span-4 flex gap-2 sm:col-span-8 xl:col-span-1"
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
              "h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none transition-colors",
              currentTheme.border,
              currentTheme.focus,
              isDarkMode
                ? "bg-transparent text-slate-100 placeholder:text-slate-500"
                : "bg-transparent text-slate-700 placeholder:text-slate-400",
              isCustomVoteSelected &&
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
            disabled={!canSubmitCustomVote}
            className={cn(
              "h-11 rounded-xl border px-3 text-sm font-semibold",
              currentTheme.border,
              currentTheme.focus,
              isDarkMode
                ? "bg-transparent text-slate-100 hover:bg-white/[0.06]"
                : "bg-transparent text-slate-700 hover:bg-slate-950/[0.04]",
            )}
          >
            Use
          </Button>
        </form>
      </div>

      <div className={cn("space-y-2 border-t pt-3", currentTheme.border)}>
        <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", currentTheme.textMuted)}>
          Members
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Planning poker members">
          {participants.map((participant) => (
            <li
              key={participant.participantId}
              className={cn(
                "flex min-w-0 max-w-56 items-center gap-2 rounded-full border px-2.5 py-1.5",
                currentTheme.border,
                isDarkMode ? "bg-white/[0.02]" : "bg-black/[0.025]",
              )}
            >
              <AppAvatar
                username={participant.displayName}
                fullName={participant.displayName}
                size={22}
                interactive={false}
                enableBlink={false}
                aria-hidden="true"
              />
              <span className={cn("truncate text-sm", currentTheme.text)}>
                {participant.displayName}
              </span>
              <span className={cn("ml-auto shrink-0 text-xs", currentTheme.textMuted)}>
                {participant.hasVoted
                  ? isRevealed
                    ? participant.revealedCardValue ?? "Shown"
                    : "Voted"
                  : "Waiting"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
