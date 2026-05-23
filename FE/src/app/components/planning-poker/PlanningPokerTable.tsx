import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleHelp, Crown, Eye, LoaderCircle } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import type { PlanningPokerParticipant, PlanningPokerSessionTask } from "../../utils/planningPoker";
import { AppAvatar } from "../AppAvatar";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerTableProps {
  activeTask: PlanningPokerSessionTask | null;
  nextTask: PlanningPokerSessionTask | null;
  participants: PlanningPokerParticipant[];
  currentParticipantId: number | null;
  votedCount: number;
  isRevealed: boolean;
  isHost: boolean;
  isRevealing: boolean;
  isSelectingRecommendation: boolean;
  isApplyingRecommendation: boolean;
  isAdvancingTask: boolean;
  recommendationOptions: number[];
  onReveal: () => void | Promise<void>;
  onSelectRecommendation: (storyPoints: number) => void | Promise<void>;
  onApplyRecommendation: (sessionTaskId: number) => void | Promise<void>;
  onAdvanceToNextTask: () => void | Promise<void>;
}

const tableSeatLimit = 20;

function getVisibleParticipants(
  participants: PlanningPokerParticipant[],
  currentParticipantId: number | null,
) {
  const visible = participants.slice(0, tableSeatLimit);

  if (!currentParticipantId) {
    return visible;
  }

  const currentParticipant = participants.find((participant) => participant.participantId === currentParticipantId);
  if (!currentParticipant || visible.some((participant) => participant.participantId === currentParticipantId)) {
    return visible;
  }

  return [...visible.slice(0, -1), currentParticipant];
}

function getParticipantSeatGroups(participants: PlanningPokerParticipant[]) {
  return participants.reduce<{
    top: PlanningPokerParticipant[];
    right: PlanningPokerParticipant[];
    bottom: PlanningPokerParticipant[];
    left: PlanningPokerParticipant[];
  }>(
    (groups, participant, index) => {
      const groupKey = (["top", "right", "bottom", "left"] as const)[index % 4];
      groups[groupKey].push(participant);
      return groups;
    },
    {
      top: [],
      right: [],
      bottom: [],
      left: [],
    },
  );
}

function getVoteStateLabel(participant: PlanningPokerParticipant, isRevealed: boolean) {
  if (!participant.hasVoted) {
    return "Waiting";
  }

  return isRevealed ? String(participant.revealedCardValue ?? "-") : "Voted";
}

function getAverageVoteLabel(activeTask: PlanningPokerSessionTask | null, isRevealed: boolean) {
  if (!activeTask || !isRevealed) {
    return null;
  }

  const totalVotes = activeTask.voteSummary.reduce((total, summary) => total + summary.count, 0);
  if (totalVotes === 0) {
    return null;
  }

  const totalValue = activeTask.voteSummary.reduce(
    (total, summary) => total + summary.cardValue * summary.count,
    0,
  );

  return (totalValue / totalVotes).toFixed(1);
}

function ParticipantSeat({
  participant,
  isCurrentUser,
  isRevealed,
  side = "horizontal",
}: {
  participant: PlanningPokerParticipant;
  isCurrentUser: boolean;
  isRevealed: boolean;
  side?: "horizontal" | "vertical";
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const participantLabel = isCurrentUser ? "YOU" : participant.displayName;
  const isVoteVisible = participant.hasVoted && isRevealed;
  const hasHiddenVote = participant.hasVoted && !isRevealed;
  const cardClassName = participant.hasVoted
    ? isVoteVisible
      ? `border-transparent bg-gradient-to-br ${currentTheme.primary} text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.65)]`
      : `${currentTheme.primaryBorder} ${currentTheme.primaryText} ${isDarkMode ? "bg-zinc-950/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_34px_-28px_rgba(0,0,0,0.9)]" : "bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_34px_-28px_rgba(15,23,42,0.7)]"}`
    : `${currentTheme.border} ${isDarkMode ? "bg-zinc-900/75 text-zinc-500" : "bg-slate-100 text-slate-400"}`;

  return (
    <li
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300 xl:w-full xl:border-transparent xl:bg-transparent xl:p-0",
        side === "vertical"
          ? "xl:max-w-[10rem] xl:flex-col xl:gap-2 xl:text-center"
          : "xl:max-w-[13rem] xl:flex-row xl:gap-3 xl:text-left",
        `${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-white/70"}`,
      )}
      aria-label={`${isCurrentUser ? "You" : participant.displayName}: ${getVoteStateLabel(participant, isRevealed)}`}
    >
      <div
        className={cn(
          "font-due-date relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-lg font-semibold transition-all duration-300",
          cardClassName,
        )}
      >
        {hasHiddenVote ? (
          <>
            <span className={`pointer-events-none absolute -bottom-5 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-lg`} />
          </>
        ) : null}
        <span className="relative z-10">
          {isVoteVisible ? participant.revealedCardValue ?? "-" : hasHiddenVote ? <CircleHelp className="h-5 w-5" aria-hidden="true" /> : ""}
        </span>
      </div>

      <div
        className={cn(
          "flex min-w-0 items-center gap-2",
          side === "vertical" ? "xl:flex-col xl:text-center" : "xl:flex-row xl:text-left",
        )}
      >
        <AppAvatar
          username={participant.displayName}
          fullName={participant.displayName}
          size={34}
          className={cn(
            "shrink-0 border shadow-sm",
            "border-white/15",
          )}
          interactive={false}
          enableBlink={false}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className={cn("flex min-w-0 items-center gap-1.5", side === "vertical" ? "xl:justify-center" : "xl:justify-start")}>
            <span className={`max-w-[9rem] truncate text-sm font-semibold ${currentTheme.text}`}>
              {participantLabel}
            </span>
            {participant.isHost ? <Crown className={`h-3.5 w-3.5 shrink-0 ${currentTheme.primaryText}`} aria-label="Host" /> : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function FinalEstimateControls({
  activeTask,
  nextTask,
  isHost,
  isSelectingRecommendation,
  isApplyingRecommendation,
  isAdvancingTask,
  recommendationOptions,
  onSelectRecommendation,
  onApplyRecommendation,
  onAdvanceToNextTask,
}: Pick<
  PlanningPokerTableProps,
  | "activeTask"
  | "nextTask"
  | "isHost"
  | "isSelectingRecommendation"
  | "isApplyingRecommendation"
  | "isAdvancingTask"
  | "recommendationOptions"
  | "onSelectRecommendation"
  | "onApplyRecommendation"
  | "onAdvanceToNextTask"
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
  const canContinue = isHost && Boolean(nextTask) && !isAdvancingTask;

  if (!activeTask) {
    return null;
  }

  if (hasAppliedEstimate) {
    return (
      <div className="mt-5 flex flex-col items-center gap-4">
        <p className={`inline-flex items-center gap-2 text-sm font-semibold ${currentTheme.primaryText}`}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Saved
        </p>

        {isHost && nextTask ? (
          <p className={`max-w-md text-center text-sm ${currentTheme.textMuted}`}>
            Next: <span className={`font-semibold ${currentTheme.text}`}>{nextTask.title}</span>
          </p>
        ) : null}

        {isHost && nextTask ? (
          <Button
            type="button"
            disabled={!canContinue}
            onClick={() => void onAdvanceToNextTask()}
            className={`min-h-16 w-full max-w-md rounded-2xl bg-gradient-to-r px-6 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${currentTheme.primary}`}
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
                <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
              </span>
            )}
          </Button>
        ) : (
          <p className={`text-sm ${currentTheme.textMuted}`}>No more queued tasks.</p>
        )}
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className={`mt-5 rounded-2xl border p-4 text-left ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/42" : "bg-white/80"}`}>
        <p className={`text-sm ${currentTheme.textMuted}`}>
          {activeTask.recommendedStoryPoints !== null ? (
            <>
              Final estimate: <span className={`font-due-date font-semibold ${currentTheme.text}`}>{activeTask.recommendedStoryPoints}</span>
            </>
          ) : (
            "Waiting for final estimate."
          )}
        </p>
        {nextTask ? (
          <p className={`mt-2 text-sm ${currentTheme.textMuted}`}>
            Next: <span className={`font-semibold ${currentTheme.text}`}>{nextTask.title}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`mt-5 rounded-2xl border p-3 ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/42" : "bg-white/72"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>
            Final estimate
          </p>
          {nextTask ? (
            <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
              Next: <span className={`font-semibold ${currentTheme.text}`}>{nextTask.title}</span>
            </p>
          ) : (
            <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>No more queued tasks.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
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
          {nextTask ? (
            <Button
              type="button"
              variant="outline"
              disabled={!canContinue}
              onClick={() => void onAdvanceToNextTask()}
              className={`h-9 rounded-xl border px-3 text-sm font-semibold ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.035] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"}`}
            >
              {isAdvancingTask ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Continuing
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          ) : null}
        </div>
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
  nextTask,
  participants,
  currentParticipantId,
  votedCount,
  isRevealed,
  isHost,
  isRevealing,
  isSelectingRecommendation,
  isApplyingRecommendation,
  isAdvancingTask,
  recommendationOptions,
  onReveal,
  onSelectRecommendation,
  onApplyRecommendation,
  onAdvanceToNextTask,
}: PlanningPokerTableProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const visibleParticipants = useMemo(
    () => getVisibleParticipants(participants, currentParticipantId),
    [currentParticipantId, participants],
  );
  const participantSeatGroups = useMemo(
    () => getParticipantSeatGroups(visibleParticipants),
    [visibleParticipants],
  );
  const hiddenParticipantCount = Math.max(participants.length - visibleParticipants.length, 0);
  const averageVoteLabel = useMemo(
    () => getAverageVoteLabel(activeTask, isRevealed),
    [activeTask, isRevealed],
  );
  const tableCenterMetric = averageVoteLabel
    ? { label: "AVG", value: averageVoteLabel }
    : activeTask && !isRevealed
      ? { label: "VOTED", value: `${votedCount}/${participants.length}` }
      : null;
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

        <div className={`relative mt-5 overflow-hidden rounded-[1.75rem] border px-3 py-4 ${currentTheme.border} xl:px-6 xl:py-6`}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:hidden" aria-label="Planning poker seats">
            {visibleParticipants.map((participant) => (
              <ParticipantSeat
                key={participant.participantId}
                participant={participant}
                isCurrentUser={participant.participantId === currentParticipantId}
                isRevealed={isRevealed}
              />
            ))}
          </ul>

          <div className="mt-4 flex justify-center xl:hidden">
            <div className={`relative h-32 w-full max-w-md rounded-full border ${currentTheme.border} ${isDarkMode ? "bg-zinc-900/28" : "bg-slate-100/58"}`}>
              <div className={`pointer-events-none absolute left-1/2 top-1/2 h-16 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${currentTheme.border}`} />
              {tableCenterMetric ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="sr-only">{tableCenterMetric.label === "AVG" ? "Average vote" : "Votes submitted"}</span>
                  <span className={`font-system-signal text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${currentTheme.textMuted}`}>
                    {tableCenterMetric.label}
                  </span>
                  <span className={`font-due-date text-4xl font-semibold leading-none ${currentTheme.primaryText}`}>
                    {tableCenterMetric.value}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="hidden min-h-[41rem] grid-cols-[minmax(12rem,1fr)_minmax(24rem,38rem)_minmax(12rem,1fr)] grid-rows-[auto_minmax(15rem,1fr)_auto] gap-4 xl:grid">
            <ul className="col-start-2 row-start-1 flex flex-wrap justify-center gap-3" aria-label="Top planning poker seats">
              {participantSeatGroups.top.map((participant) => (
                <ParticipantSeat
                  key={participant.participantId}
                  participant={participant}
                  isCurrentUser={participant.participantId === currentParticipantId}
                  isRevealed={isRevealed}
                  side="vertical"
                />
              ))}
            </ul>

            <ul className="col-start-1 row-start-2 flex flex-col justify-center gap-3" aria-label="Left planning poker seats">
              {participantSeatGroups.left.map((participant) => (
                <ParticipantSeat
                  key={participant.participantId}
                  participant={participant}
                  isCurrentUser={participant.participantId === currentParticipantId}
                  isRevealed={isRevealed}
                />
              ))}
            </ul>

            <div className="relative col-start-2 row-start-2 flex items-center justify-center">
              <div className={`pointer-events-none h-56 w-full max-w-[34rem] rounded-full border ${currentTheme.border} ${isDarkMode ? "bg-zinc-900/28" : "bg-slate-100/58"}`} aria-hidden="true" />
              <div className={`pointer-events-none absolute h-36 w-[72%] max-w-[25rem] rounded-full border border-dashed ${currentTheme.border}`} aria-hidden="true" />
              {tableCenterMetric ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="sr-only">{tableCenterMetric.label === "AVG" ? "Average vote" : "Votes submitted"}</span>
                  <span className={`font-system-signal text-xs font-semibold uppercase tracking-[0.28em] ${currentTheme.textMuted}`}>
                    {tableCenterMetric.label}
                  </span>
                  <span className={`font-due-date text-7xl font-semibold leading-none ${currentTheme.primaryText}`}>
                    {tableCenterMetric.value}
                  </span>
                </div>
              ) : null}
            </div>

            <ul className="col-start-3 row-start-2 flex flex-col items-end justify-center gap-3" aria-label="Right planning poker seats">
              {participantSeatGroups.right.map((participant) => (
                <ParticipantSeat
                  key={participant.participantId}
                  participant={participant}
                  isCurrentUser={participant.participantId === currentParticipantId}
                  isRevealed={isRevealed}
                />
              ))}
            </ul>

            <ul className="col-start-2 row-start-3 flex flex-wrap justify-center gap-3" aria-label="Bottom planning poker seats">
              {participantSeatGroups.bottom.map((participant) => (
                <ParticipantSeat
                  key={participant.participantId}
                  participant={participant}
                  isCurrentUser={participant.participantId === currentParticipantId}
                  isRevealed={isRevealed}
                  side="vertical"
                />
              ))}
            </ul>
          </div>
        </div>

        <div
          className={`mt-5 rounded-[1.5rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] ${currentTheme.border} ${isDarkMode ? "bg-zinc-900/62" : "bg-slate-50/88"}`}
          aria-live="polite"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                {tableStatus}
              </p>
              {activeTask ? (
                <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                  {isRevealed
                    ? activeTask.appliedStoryPoints !== null
                      ? "Saved"
                      : "Pick the estimate to save."
                    : "Cards stay hidden until reveal."}
                </p>
              ) : null}
            </div>

            {isHost && !isRevealed ? (
              <Button
                type="button"
                disabled={!canReveal}
                onClick={() => void onReveal()}
                className={`shrink-0 rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${currentTheme.primary}`}
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
          </div>

          {activeTask && isRevealed ? (
            <FinalEstimateControls
              activeTask={activeTask}
              nextTask={nextTask}
              isHost={isHost}
              isSelectingRecommendation={isSelectingRecommendation}
              isApplyingRecommendation={isApplyingRecommendation}
              isAdvancingTask={isAdvancingTask}
              recommendationOptions={recommendationOptions}
              onSelectRecommendation={onSelectRecommendation}
              onApplyRecommendation={onApplyRecommendation}
              onAdvanceToNextTask={onAdvanceToNextTask}
            />
          ) : null}

          {hiddenParticipantCount > 0 ? (
            <p className={`mt-4 text-xs ${currentTheme.textMuted}`}>
              {hiddenParticipantCount} more in the rail
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
