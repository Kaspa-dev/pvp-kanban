import { useMemo } from "react";
import { CircleHelp, Crown, Eye, LoaderCircle } from "lucide-react";

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
  onReveal: () => void | Promise<void>;
}

const tableSeatLimit = 20;
type SeatLayoutMode = "small" | "medium" | "large";
type ParticipantSeatGroups = {
  top: PlanningPokerParticipant[];
  right: PlanningPokerParticipant[];
  bottom: PlanningPokerParticipant[];
  left: PlanningPokerParticipant[];
};

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

function getSeatLayoutMode(participantCount: number): SeatLayoutMode {
  if (participantCount < 6) {
    return "small";
  }

  if (participantCount <= 12) {
    return "medium";
  }

  return "large";
}

function createEmptyParticipantSeatGroups(): ParticipantSeatGroups {
  return {
    top: [],
    right: [],
    bottom: [],
    left: [],
  };
}

function getParticipantSeatGroups(
  participants: PlanningPokerParticipant[],
  layoutMode: SeatLayoutMode,
) {
  const groups = createEmptyParticipantSeatGroups();

  if (layoutMode === "small") {
    groups.bottom = participants;
    return groups;
  }

  if (layoutMode === "medium") {
    const splitIndex = Math.ceil(participants.length / 2);
    groups.top = participants.slice(0, splitIndex);
    groups.bottom = participants.slice(splitIndex);
    return groups;
  }

  participants.forEach((participant, index) => {
    const groupKey = (["top", "right", "bottom", "left"] as const)[index % 4];
    groups[groupKey].push(participant);
  });

  return groups;
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

export function PlanningPokerTable({
  activeTask,
  participants,
  currentParticipantId,
  votedCount,
  isRevealed,
  isHost,
  isRevealing,
  onReveal,
}: PlanningPokerTableProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const visibleParticipants = useMemo(
    () => getVisibleParticipants(participants, currentParticipantId),
    [currentParticipantId, participants],
  );
  const seatLayoutMode = getSeatLayoutMode(visibleParticipants.length);
  const participantSeatGroups = useMemo(
    () => getParticipantSeatGroups(visibleParticipants, seatLayoutMode),
    [seatLayoutMode, visibleParticipants],
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
  const shouldShowRevealButton = isHost && !isRevealed;
  const renderRevealButton = (compact = false) => (
    <Button
      type="button"
      disabled={!canReveal}
      onClick={() => void onReveal()}
      className={`rounded-xl bg-gradient-to-r text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${compact ? "h-10 px-4" : "h-11 px-5"} ${currentTheme.primary}`}
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
  );
  const renderCenterTable = (className = "") => (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={`pointer-events-none h-72 w-full max-w-[38rem] rounded-full border ${currentTheme.border} ${isDarkMode ? "bg-zinc-900/28" : "bg-slate-100/58"}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute h-48 w-[74%] max-w-[29rem] rounded-full border border-dashed ${currentTheme.border}`} aria-hidden="true" />
      {tableCenterMetric || shouldShowRevealButton ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          {tableCenterMetric ? (
            <div className="flex flex-col items-center">
              <span className="sr-only">{tableCenterMetric.label === "AVG" ? "Average vote" : "Votes submitted"}</span>
              <span className={`font-system-signal text-xs font-semibold uppercase tracking-[0.28em] ${currentTheme.textMuted}`}>
                {tableCenterMetric.label}
              </span>
              <span className={`font-due-date text-7xl font-semibold leading-none ${currentTheme.primaryText}`}>
                {tableCenterMetric.value}
              </span>
            </div>
          ) : null}
          {shouldShowRevealButton ? renderRevealButton() : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      className={`relative mt-16 overflow-visible rounded-[2rem] border px-4 py-5 shadow-[0_26px_84px_-56px_rgba(15,23,42,0.65)] ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/58" : "bg-white/78"}`}
      aria-labelledby="planning-poker-table-title"
    >
      <div className={`pointer-events-none absolute -right-20 top-4 h-56 w-56 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />

      <div className="relative z-10">
        <div className="relative overflow-visible px-3 pb-4 xl:px-6 xl:pb-6">
          <div className="relative z-20 mx-auto -mt-16 mb-12 w-[min(46rem,calc(100%-2rem))]">
            <div className={cn(
              "relative overflow-hidden rounded-[1.5rem] border px-4 py-3 text-center shadow-[0_24px_70px_-48px_rgba(15,23,42,0.78)]",
              currentTheme.border,
              isDarkMode ? "bg-zinc-950/88" : "bg-white/94",
            )}>
              <div className={`pointer-events-none absolute inset-0 rounded-[1.5rem] bg-gradient-to-br ${currentTheme.primarySoft}`} />
              <div className={`pointer-events-none absolute -left-12 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-2xl`} />
              <div className={`pointer-events-none absolute -right-12 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-2xl`} />
              <div className={`pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ${isDarkMode ? "ring-white/10" : "ring-slate-950/10"}`} />
              <div className={`pointer-events-none absolute inset-1 rounded-[1.25rem] border ${currentTheme.primaryBorder} opacity-25`} />
              <div className="relative min-w-0">
                <div className="mb-1 flex items-center justify-center">
                  <span className={`font-system-signal text-[0.64rem] font-semibold uppercase tracking-[0.24em] ${currentTheme.textMuted}`}>
                    Current task
                  </span>
                </div>
                <h2 id="planning-poker-table-title" className={`font-ui-condensed truncate text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  {activeTask?.title ?? "No task selected"}
                </h2>
                {activeTask?.description?.trim() ? (
                  <p className={`mx-auto mt-1 line-clamp-1 max-w-3xl text-sm leading-6 ${currentTheme.textMuted}`}>
                    {activeTask.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

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
            <div className={`relative h-44 w-full max-w-md rounded-full border ${currentTheme.border} ${isDarkMode ? "bg-zinc-900/28" : "bg-slate-100/58"}`}>
              <div className={`pointer-events-none absolute left-1/2 top-1/2 h-24 w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${currentTheme.border}`} />
              {tableCenterMetric || shouldShowRevealButton ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  {tableCenterMetric ? (
                    <div className="flex flex-col items-center">
                      <span className="sr-only">{tableCenterMetric.label === "AVG" ? "Average vote" : "Votes submitted"}</span>
                      <span className={`font-system-signal text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${currentTheme.textMuted}`}>
                        {tableCenterMetric.label}
                      </span>
                      <span className={`font-due-date text-4xl font-semibold leading-none ${currentTheme.primaryText}`}>
                        {tableCenterMetric.value}
                      </span>
                    </div>
                  ) : null}
                  {shouldShowRevealButton ? renderRevealButton(true) : null}
                </div>
              ) : null}
            </div>
          </div>

          {seatLayoutMode === "small" ? (
            <div className="hidden min-h-[32rem] grid-cols-[minmax(24rem,44rem)] grid-rows-[minmax(16rem,1fr)_auto] justify-center gap-5 xl:grid">
              {renderCenterTable("col-start-1 row-start-1")}
              <ul className="col-start-1 row-start-2 flex flex-wrap justify-center gap-4" aria-label="Planning poker seats">
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
          ) : null}

          {seatLayoutMode === "medium" ? (
            <div className="hidden min-h-[37rem] grid-cols-[minmax(28rem,48rem)] grid-rows-[auto_minmax(16rem,1fr)_auto] justify-center gap-4 xl:grid">
              <ul className="col-start-1 row-start-1 flex flex-wrap justify-center gap-3" aria-label="Top planning poker seats">
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
              {renderCenterTable("col-start-1 row-start-2")}
              <ul className="col-start-1 row-start-3 flex flex-wrap justify-center gap-3" aria-label="Bottom planning poker seats">
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
          ) : null}

          {seatLayoutMode === "large" ? (
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

              {renderCenterTable("col-start-2 row-start-2")}

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
          ) : null}
        </div>

        {hiddenParticipantCount > 0 ? (
          <p className={`mt-3 px-1 text-xs ${currentTheme.textMuted}`} aria-live="polite">
            {hiddenParticipantCount} more in the rail
          </p>
        ) : null}
      </div>
    </section>
  );
}
