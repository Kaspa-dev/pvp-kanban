import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Crown, Eye, LoaderCircle, Sparkles } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import type { PlanningPokerParticipant, PlanningPokerSessionTask } from "../../utils/planningPoker";
import { AppAvatar } from "../AppAvatar";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerTableProps {
  activeTask: PlanningPokerSessionTask | null;
  participants: PlanningPokerParticipant[];
  currentParticipantId: number | null;
  votedCount: number;
  isRevealed: boolean;
  isHost: boolean;
  isRevealing: boolean;
  isSelectingRecommendation: boolean;
  isApplyingRecommendation: boolean;
  recommendationOptions: number[];
  onReveal: () => void | Promise<void>;
  onSelectRecommendation: (storyPoints: number) => void | Promise<void>;
  onApplyRecommendation: (sessionTaskId: number) => void | Promise<void>;
}

const seatPositionClassNames = [
  "xl:left-[8%] xl:top-[10%]",
  "xl:left-1/2 xl:top-[5%] xl:-translate-x-1/2",
  "xl:right-[8%] xl:top-[10%]",
  "xl:left-[5%] xl:top-1/2 xl:-translate-y-1/2",
  "xl:right-[5%] xl:top-1/2 xl:-translate-y-1/2",
  "xl:left-[15%] xl:bottom-[7%]",
  "xl:left-1/2 xl:bottom-[5%] xl:-translate-x-1/2",
  "xl:right-[15%] xl:bottom-[7%]",
];

function getVisibleParticipants(
  participants: PlanningPokerParticipant[],
  currentParticipantId: number | null,
) {
  const visible = participants.slice(0, seatPositionClassNames.length);

  if (!currentParticipantId) {
    return visible;
  }

  const currentParticipant = participants.find((participant) => participant.participantId === currentParticipantId);
  if (!currentParticipant || visible.some((participant) => participant.participantId === currentParticipantId)) {
    return visible;
  }

  return [...visible.slice(0, -1), currentParticipant];
}

function getVoteStateLabel(participant: PlanningPokerParticipant, isRevealed: boolean) {
  if (!participant.hasVoted) {
    return "Waiting";
  }

  return isRevealed ? String(participant.revealedCardValue ?? "-") : "Voted";
}

function ParticipantSeat({
  participant,
  index,
  isCurrentUser,
  isRevealed,
}: {
  participant: PlanningPokerParticipant;
  index: number;
  isCurrentUser: boolean;
  isRevealed: boolean;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const positionClassName = seatPositionClassNames[index] ?? seatPositionClassNames[0];
  const isVoteVisible = participant.hasVoted && isRevealed;
  const hasHiddenVote = participant.hasVoted && !isRevealed;
  const cardClassName = participant.hasVoted
    ? isVoteVisible
      ? `border-transparent bg-gradient-to-br ${currentTheme.primary} text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.65)]`
      : `${currentTheme.primaryBorder} bg-[linear-gradient(135deg,rgba(255,255,255,0.38),rgba(255,255,255,0.05))] ${currentTheme.primaryText}`
    : `${currentTheme.border} ${isDarkMode ? "bg-zinc-900/75 text-zinc-500" : "bg-slate-100 text-slate-400"}`;

  return (
    <li
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300 xl:absolute xl:w-48 xl:flex-col xl:gap-2 xl:border-transparent xl:bg-transparent xl:p-0",
        isCurrentUser
          ? `${currentTheme.primaryBorder} ${isDarkMode ? "bg-white/[0.045] shadow-[0_0_34px_rgba(255,255,255,0.08)]" : "bg-white/84 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.5)]"}`
          : `${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-white/70"}`,
        positionClassName,
      )}
      aria-label={`${participant.displayName}: ${getVoteStateLabel(participant, isRevealed)}`}
    >
      <div
        className={cn(
          "font-due-date flex h-16 w-12 shrink-0 items-center justify-center rounded-xl border text-lg font-semibold transition-all duration-300 xl:h-24 xl:w-16 xl:rounded-2xl xl:text-2xl",
          cardClassName,
        )}
      >
        {isVoteVisible ? participant.revealedCardValue ?? "-" : hasHiddenVote ? <Sparkles className="h-5 w-5" aria-hidden="true" /> : ""}
      </div>

      <div className="flex min-w-0 items-center gap-2 xl:flex-col xl:text-center">
        <AppAvatar
          username={participant.displayName}
          fullName={participant.displayName}
          size={34}
          className={cn(
            "shrink-0 border shadow-sm",
            isCurrentUser ? currentTheme.primaryBorder : "border-white/15",
          )}
          interactive={false}
          enableBlink={false}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5 xl:justify-center">
            <span className={`truncate text-sm font-semibold ${currentTheme.text}`}>
              {participant.displayName}
            </span>
            {participant.isHost ? <Crown className={`h-3.5 w-3.5 shrink-0 ${currentTheme.primaryText}`} aria-label="Host" /> : null}
          </div>
          <span className={`font-due-date text-[11px] font-semibold ${participant.hasVoted ? currentTheme.primaryText : currentTheme.textMuted}`}>
            {getVoteStateLabel(participant, isRevealed)}
          </span>
        </div>
      </div>
    </li>
  );
}

function VoteSummary({
  activeTask,
}: {
  activeTask: PlanningPokerSessionTask;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  if (activeTask.voteSummary.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {activeTask.voteSummary.map((summary) => (
        <span
          key={summary.cardValue}
          className={`font-due-date inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/72 text-zinc-100" : "bg-white/84 text-slate-700"}`}
        >
          {summary.cardValue}
          <span className={currentTheme.textMuted}>x{summary.count}</span>
        </span>
      ))}
    </div>
  );
}

function FinalEstimateControls({
  activeTask,
  isHost,
  isSelectingRecommendation,
  isApplyingRecommendation,
  recommendationOptions,
  onSelectRecommendation,
  onApplyRecommendation,
}: Pick<
  PlanningPokerTableProps,
  | "activeTask"
  | "isHost"
  | "isSelectingRecommendation"
  | "isApplyingRecommendation"
  | "recommendationOptions"
  | "onSelectRecommendation"
  | "onApplyRecommendation"
>) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [customRecommendation, setCustomRecommendation] = useState("");
  const parsedCustomRecommendation = Number(customRecommendation);
  const hasAppliedEstimate = activeTask?.appliedStoryPoints !== null;
  const canSubmitCustomRecommendation =
    customRecommendation.trim().length > 0 &&
    Number.isFinite(parsedCustomRecommendation) &&
    Number.isInteger(parsedCustomRecommendation) &&
    parsedCustomRecommendation >= 0 &&
    parsedCustomRecommendation <= 100 &&
    !isSelectingRecommendation;
  const canApplyRecommendation =
    Boolean(activeTask) &&
    isHost &&
    activeTask?.recommendedStoryPoints !== null &&
    activeTask?.appliedStoryPoints === null &&
    !isApplyingRecommendation;

  if (!activeTask) {
    return null;
  }

  if (hasAppliedEstimate) {
    return (
      <div className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${currentTheme.primaryBorder} ${currentTheme.primaryText} ${isDarkMode ? "bg-white/[0.04]" : "bg-white/82"}`}>
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Saved: <span className="font-due-date">{activeTask.appliedStoryPoints}</span>
      </div>
    );
  }

  if (!isHost) {
    return (
      <p className={`mt-5 text-sm ${currentTheme.textMuted}`}>
        {activeTask.recommendedStoryPoints !== null ? (
          <>
            Final estimate: <span className={`font-due-date font-semibold ${currentTheme.text}`}>{activeTask.recommendedStoryPoints}</span>
          </>
        ) : (
          "Waiting for final estimate."
        )}
      </p>
    );
  }

  return (
    <div className={`mt-5 rounded-2xl border p-3 ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/42" : "bg-white/72"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>
          Final estimate
        </p>
        <Button
          type="button"
          disabled={!canApplyRecommendation}
          onClick={() => void onApplyRecommendation(activeTask.sessionTaskId)}
          className={`h-9 rounded-xl bg-gradient-to-r px-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${currentTheme.primary}`}
        >
          {isApplyingRecommendation ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : (
            "Apply"
          )}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {recommendationOptions.map((value) => {
          const isSelected = activeTask.recommendedStoryPoints === value;

          return (
            <button
              key={value}
              type="button"
              disabled={isSelectingRecommendation}
              onClick={() => void onSelectRecommendation(value)}
              className={cn(
                "font-due-date h-9 min-w-10 rounded-xl border px-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2",
                currentTheme.focus,
                isSelected
                  ? `border-transparent bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                  : `${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.035] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"}`,
              )}
              aria-pressed={isSelected}
            >
              {value}
            </button>
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
          <label className="sr-only" htmlFor="planning-poker-final-custom">
            Custom final estimate
          </label>
          <input
            id="planning-poker-final-custom"
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="numeric"
            value={customRecommendation}
            disabled={isSelectingRecommendation}
            onChange={(event) => setCustomRecommendation(event.target.value)}
            placeholder="Custom"
            className={`h-9 w-24 rounded-xl border px-3 text-sm outline-none transition-colors focus:ring-2 ${currentTheme.focus} ${currentTheme.border} ${currentTheme.text} ${isDarkMode ? "bg-zinc-950/65 placeholder:text-zinc-500" : "bg-white placeholder:text-slate-400"}`}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!canSubmitCustomRecommendation}
            className={`h-9 rounded-xl border px-3 text-sm font-semibold ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.035] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"}`}
          >
            Use
          </Button>
        </form>
      </div>
    </div>
  );
}

export function PlanningPokerTable({
  activeTask,
  participants,
  currentParticipantId,
  votedCount,
  isRevealed,
  isHost,
  isRevealing,
  isSelectingRecommendation,
  isApplyingRecommendation,
  recommendationOptions,
  onReveal,
  onSelectRecommendation,
  onApplyRecommendation,
}: PlanningPokerTableProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const visibleParticipants = useMemo(
    () => getVisibleParticipants(participants, currentParticipantId),
    [currentParticipantId, participants],
  );
  const hiddenParticipantCount = Math.max(participants.length - visibleParticipants.length, 0);
  const canReveal = isHost && !isRevealed && votedCount > 0 && !isRevealing;
  const tableStatus = !activeTask
    ? "No task selected"
    : isRevealed
      ? "Votes revealed"
      : votedCount > 0
        ? "Waiting for votes"
        : "Choose a card";

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border px-4 py-5 shadow-[0_26px_84px_-56px_rgba(15,23,42,0.65)] ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/58" : "bg-white/78"}`}
      aria-labelledby="planning-poker-table-title"
    >
      <div className={`pointer-events-none absolute -right-20 top-4 h-56 w-56 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />

      <div className="relative z-10">
        <div className={`flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 ${currentTheme.border}`}>
          <div className="min-w-0">
            <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.textMuted}`}>
              Current task
            </p>
            <h2 id="planning-poker-table-title" className={`font-ui-condensed mt-1 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              {activeTask?.title ?? "No task selected"}
            </h2>
            {activeTask?.description?.trim() ? (
              <p className={`mt-2 line-clamp-2 max-w-4xl text-sm leading-6 ${currentTheme.textMuted}`}>
                {activeTask.description}
              </p>
            ) : null}
          </div>

          <div className={`font-due-date inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${currentTheme.border} ${isDarkMode ? "bg-white/[0.035]" : "bg-slate-50"} ${currentTheme.textSecondary}`}>
            <span className={currentTheme.primaryText}>{votedCount}/{participants.length}</span>
            voted
          </div>
        </div>

        <div className="relative mt-5 min-h-[30rem] xl:min-h-[34rem]">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:block" aria-label="Planning poker seats">
            {visibleParticipants.map((participant, index) => (
              <ParticipantSeat
                key={participant.participantId}
                participant={participant}
                index={index}
                isCurrentUser={participant.participantId === currentParticipantId}
                isRevealed={isRevealed}
              />
            ))}
          </ul>

          <div
            className={`mt-5 rounded-[2rem] border px-5 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] xl:absolute xl:left-1/2 xl:top-1/2 xl:mt-0 xl:w-[min(34rem,52%)] xl:-translate-x-1/2 xl:-translate-y-1/2 ${currentTheme.border} ${isDarkMode ? "bg-zinc-900/72" : "bg-slate-50/92"}`}
            aria-live="polite"
          >
            <p className={`font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              {tableStatus}
            </p>
            {activeTask ? (
              <p className={`mt-2 text-sm ${currentTheme.textMuted}`}>
                {isRevealed ? "Pick the estimate to save." : "Cards stay hidden until reveal."}
              </p>
            ) : null}

            {isHost && !isRevealed ? (
              <Button
                type="button"
                disabled={!canReveal}
                onClick={() => void onReveal()}
                className={`mt-5 rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${currentTheme.primary}`}
              >
                {isRevealing ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Revealing
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Reveal votes
                  </>
                )}
              </Button>
            ) : null}

            {activeTask && isRevealed ? <VoteSummary activeTask={activeTask} /> : null}

            {activeTask && isRevealed ? (
              <FinalEstimateControls
                activeTask={activeTask}
                isHost={isHost}
                isSelectingRecommendation={isSelectingRecommendation}
                isApplyingRecommendation={isApplyingRecommendation}
                recommendationOptions={recommendationOptions}
                onSelectRecommendation={onSelectRecommendation}
                onApplyRecommendation={onApplyRecommendation}
              />
            ) : null}

            {hiddenParticipantCount > 0 ? (
              <p className={`mt-4 text-xs ${currentTheme.textMuted}`}>
                {hiddenParticipantCount} more in the rail
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
