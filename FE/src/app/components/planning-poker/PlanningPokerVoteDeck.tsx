import { useId } from "react";
import { CheckCircle2, Clock3, LoaderCircle, Sparkles } from "lucide-react";

import { useTheme, getThemeColors } from "../../contexts/ThemeContext";
import { getWorkspaceSurfaceStyles } from "../../utils/workspaceSurfaceStyles";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "../ui/utils";

interface PlanningPokerVoteDeckProps {
  cardValues: number[];
  selectedValue: number | null;
  isSubmitting: boolean;
  isRevealed: boolean;
  isRevealing: boolean;
  hasActiveTask: boolean;
  disabled: boolean;
  onVote: (value: number) => void | Promise<void>;
}

export function PlanningPokerVoteDeck({
  cardValues,
  selectedValue,
  isSubmitting,
  isRevealed,
  isRevealing,
  hasActiveTask,
  disabled,
  onVote,
}: PlanningPokerVoteDeckProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const voteDeckId = useId();
  const voteDeckHeadingId = `${voteDeckId}-heading`;
  const voteDeckHintId = `${voteDeckId}-hint`;

  const statusMessage = isSubmitting
    ? "Saving your vote to the live room."
    : isRevealing
      ? "Voting is temporarily locked while the host reveal is being processed."
      : isRevealed
      ? "Voting is locked while the revealed estimates are being discussed."
      : !hasActiveTask
        ? "Waiting for the host to move the next task into the active slot."
        : selectedValue !== null
          ? `Card ${selectedValue} selected. You can still change it before reveal.`
          : "Pick the card that best represents your estimate for the current task.";

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-950/20",
        workspaceSurface.elevatedPanelSurfaceClassName,
      )}
    >
      <CardHeader className={cn("space-y-3 border-b px-5 py-5 sm:px-6", currentTheme.border)}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
              currentTheme.primaryText,
              `border ${currentTheme.primaryBorder}`,
              `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
            )}
          >
            Your vote
          </Badge>
          <span className={cn("text-xs font-medium uppercase tracking-[0.2em]", currentTheme.textMuted)}>
            Primary action band
          </span>
        </div>

        <div className="space-y-2">
          <CardTitle id={voteDeckHeadingId} className={cn("text-xl font-semibold", currentTheme.text)}>
            Vote deck
          </CardTitle>
          <CardDescription id={voteDeckHintId} className={cn("max-w-3xl text-sm leading-6", currentTheme.textMuted)}>
            Cast your estimate for the active task. Your latest card replaces any earlier choice
            until the host reveals the round.
          </CardDescription>
        </div>

        <div
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium",
            isRevealed || selectedValue !== null
              ? cn(
                  currentTheme.primaryText,
                  `border ${currentTheme.primaryBorder}`,
                  `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
                )
              : currentTheme.border,
            !isRevealed &&
              selectedValue === null &&
              (isDarkMode ? "bg-white/[0.04]" : "bg-black/[0.03]"),
          )}
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : isRevealing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : isRevealed ? (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          ) : !hasActiveTask ? (
            <Clock3 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{statusMessage}</span>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-5 sm:px-6">
        <div
          className={cn(
            "rounded-[1.75rem] border p-4 sm:p-5",
            currentTheme.border,
            isDarkMode
              ? "bg-gradient-to-br from-slate-950/85 via-slate-950/70 to-slate-900/80"
              : "bg-gradient-to-br from-white via-white to-slate-100/80",
          )}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", currentTheme.textMuted)}>
                Story points
              </p>
              <p className={cn("text-sm leading-6", currentTheme.textMuted)}>
                {isRevealing
                  ? "Reveal is in progress. Voting will reopen after the room state finishes updating."
                  : "Select one card with keyboard or pointer input."}
              </p>
            </div>

            {selectedValue !== null && !isRevealed && !isRevealing ? (
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  currentTheme.primaryText,
                  `border ${currentTheme.primaryBorder}`,
                  `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Selected {selectedValue}
              </div>
            ) : null}
          </div>

          <div
            className="grid grid-cols-4 gap-3 sm:grid-cols-8"
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
                    "h-20 rounded-[1.5rem] border text-xl font-semibold transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                    currentTheme.border,
                    currentTheme.focus,
                    disabled || isSubmitting
                      ? isDarkMode
                        ? "bg-slate-950/45 text-slate-500"
                        : "bg-slate-100/80 text-slate-400"
                      : isDarkMode
                        ? "bg-white/[0.04] text-slate-100 hover:bg-white/[0.07]"
                        : "bg-white text-slate-700 hover:bg-slate-50",
                    isSelected &&
                      cn(
                        "scale-[1.02] shadow-lg",
                        currentTheme.primaryText,
                        `border ${currentTheme.primaryBorder}`,
                        `bg-gradient-to-br ${currentTheme.primarySoftStrong}`,
                      ),
                    isRevealed && "opacity-70",
                  )}
                >
                  <span className="sr-only">{isSelected ? "Selected card " : "Vote "}</span>
                  {value}
                </Button>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "mt-4 rounded-[1.5rem] border px-4 py-3 text-sm",
            isRevealed
              ? cn(
                  currentTheme.primaryText,
                  `border ${currentTheme.primaryBorder}`,
                  `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
                )
              : currentTheme.border,
            !isRevealed &&
              (isDarkMode ? "bg-slate-950/50 text-slate-300" : "bg-white/80 text-slate-600"),
          )}
          aria-live="polite"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving your vote...
            </span>
          ) : isRevealing ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Reveal in progress. Voting is temporarily locked.
            </span>
          ) : isRevealed ? (
            "Votes are revealed. Wait for the host to choose the final recommendation or start the next round."
          ) : !hasActiveTask ? (
            "No active task is open for voting yet."
          ) : selectedValue !== null ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Your vote is in. Change cards anytime before reveal.
            </span>
          ) : (
            "Choose one card to submit your estimate."
          )}
        </div>
      </CardContent>
    </Card>
  );
}
