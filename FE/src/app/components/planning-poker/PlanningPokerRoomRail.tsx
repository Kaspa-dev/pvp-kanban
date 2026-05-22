import { CheckCircle2, ClipboardList, Copy, Crown, LoaderCircle, RefreshCcw, UsersRound } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import type { PlanningPokerParticipant, PlanningPokerSession, PlanningPokerSessionTask } from "../../utils/planningPoker";
import { AppAvatar } from "../AppAvatar";
import { CustomScrollArea } from "../CustomScrollArea";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerRoomRailProps {
  session: PlanningPokerSession;
  activeTask: PlanningPokerSessionTask | null;
  currentParticipantId: number | null;
  isHost: boolean;
  isAdvancingTask: boolean;
  canOpenBacklogPicker: boolean;
  copyFeedback: string;
  onCopyLink: () => void | Promise<void>;
  onOpenBacklogPicker: () => void;
  onAdvanceToNextTask: () => void | Promise<void>;
}

function getTaskStateLabel(task: PlanningPokerSessionTask, isActive: boolean) {
  if (task.appliedStoryPoints !== null) {
    return `${task.appliedStoryPoints} pts`;
  }

  if (isActive) {
    return task.recommendedStoryPoints !== null ? `${task.recommendedStoryPoints} picked` : "Voting";
  }

  return "Queued";
}

function getParticipantStatus(participant: PlanningPokerParticipant, isRevealed: boolean) {
  if (!participant.hasVoted) {
    return "Waiting";
  }

  return isRevealed ? String(participant.revealedCardValue ?? "-") : "Voted";
}

function ParticipantRow({
  participant,
  isCurrentUser,
  isRevealed,
}: {
  participant: PlanningPokerParticipant;
  isCurrentUser: boolean;
  isRevealed: boolean;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-3",
        isCurrentUser
          ? `${currentTheme.primaryBorder} ${isDarkMode ? "bg-white/[0.055]" : "bg-white"}`
          : `${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/78"}`,
      )}
    >
      <AppAvatar
        username={participant.displayName}
        fullName={participant.displayName}
        size={32}
        interactive={false}
        enableBlink={false}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`truncate text-sm font-semibold ${currentTheme.text}`}>
            {participant.displayName}
          </span>
          {participant.isHost ? <Crown className={`h-3.5 w-3.5 shrink-0 ${currentTheme.primaryText}`} aria-label="Host" /> : null}
        </div>
        <p className={`text-xs ${currentTheme.textMuted}`}>
          {participant.isGuest ? "Guest" : "Member"}
        </p>
      </div>
      <span className={`font-due-date shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${participant.hasVoted ? currentTheme.primaryText : currentTheme.textMuted} ${isDarkMode ? "bg-zinc-950/64" : "bg-white/82"}`}>
        {getParticipantStatus(participant, isRevealed)}
      </span>
    </li>
  );
}

export function PlanningPokerRoomRail({
  session,
  activeTask,
  currentParticipantId,
  isHost,
  isAdvancingTask,
  canOpenBacklogPicker,
  copyFeedback,
  onCopyLink,
  onOpenBacklogPicker,
  onAdvanceToNextTask,
}: PlanningPokerRoomRailProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const canAdvanceToNextTask = isHost && session.queue.length > 0 && !isAdvancingTask;

  return (
    <aside
      className={`flex min-h-[32rem] flex-col overflow-hidden rounded-[2rem] border shadow-[0_24px_76px_-56px_rgba(15,23,42,0.68)] xl:h-full xl:min-h-0 ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/62" : "bg-white/82"}`}
      aria-label="Planning poker room side panel"
    >
      <div className={`shrink-0 border-b px-4 py-4 ${currentTheme.border}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              Tasks
            </h2>
            <p className={`font-due-date mt-0.5 text-xs font-semibold ${currentTheme.textMuted}`}>
              {session.queue.length + (activeTask ? 1 : 0)} in room
            </p>
          </div>
          {isHost ? (
            <Button
              type="button"
              variant="outline"
              disabled={!canOpenBacklogPicker}
              onClick={onOpenBacklogPicker}
              className={`h-9 rounded-xl border px-3 text-sm font-semibold ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.035] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"}`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Change
            </Button>
          ) : null}
        </div>
      </div>

      <CustomScrollArea className="min-h-0 flex-1" viewportClassName="h-full min-h-0 px-4 py-4 pr-5">
        <div className="space-y-5">
          <section aria-labelledby="planning-poker-rail-tasks">
            <h3 id="planning-poker-rail-tasks" className="sr-only">
              Task queue
            </h3>
            <div className="space-y-2">
              {activeTask ? (
                <div
                  className={`rounded-2xl border px-3 py-3 ${currentTheme.primaryBorder} ${isDarkMode ? "bg-white/[0.05]" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`line-clamp-2 text-sm font-semibold ${currentTheme.text}`}>{activeTask.title}</p>
                      <p className={`font-due-date mt-2 text-xs font-semibold ${currentTheme.primaryText}`}>
                        {getTaskStateLabel(activeTask, true)}
                      </p>
                    </div>
                    {activeTask.appliedStoryPoints !== null ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Applied" />
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl border px-3 py-4 text-sm ${currentTheme.border} ${currentTheme.textMuted} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/78"}`}>
                  No active task
                </div>
              )}

              {session.queue.map((task) => (
                <div
                  key={task.sessionTaskId}
                  className={`rounded-2xl border px-3 py-3 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/78"}`}
                >
                  <p className={`line-clamp-2 text-sm font-semibold ${currentTheme.text}`}>{task.title}</p>
                  <p className={`font-due-date mt-2 text-xs font-semibold ${currentTheme.textMuted}`}>
                    {getTaskStateLabel(task, false)}
                  </p>
                </div>
              ))}
            </div>

            {isHost ? (
              <Button
                type="button"
                variant="outline"
                disabled={!canAdvanceToNextTask}
                onClick={() => void onAdvanceToNextTask()}
                className={`mt-3 h-10 w-full rounded-xl border text-sm font-semibold ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.035] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"}`}
              >
                {isAdvancingTask ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Moving
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    Next task
                  </>
                )}
              </Button>
            ) : null}
          </section>

          <section aria-labelledby="planning-poker-rail-participants">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="planning-poker-rail-participants" className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Players
              </h3>
              <span className={`font-due-date inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${currentTheme.textMuted} ${isDarkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                {session.participants.length}
              </span>
            </div>
            <ul className="space-y-2">
              {session.participants.map((participant) => (
                <ParticipantRow
                  key={participant.participantId}
                  participant={participant}
                  isCurrentUser={participant.participantId === currentParticipantId}
                  isRevealed={session.isRevealed}
                />
              ))}
            </ul>
          </section>

          {isHost ? (
            <section className={`rounded-2xl border px-3 py-3 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/78"}`} aria-labelledby="planning-poker-share-room">
              <div className="flex items-center justify-between gap-3">
                <h3 id="planning-poker-share-room" className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  Invite
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onCopyLink()}
                  className={`h-9 rounded-xl border px-3 text-sm font-semibold ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-zinc-950/60 hover:bg-zinc-900" : "bg-white hover:bg-slate-50"}`}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy link
                </Button>
              </div>
              <p className={`mt-2 text-xs ${copyFeedback ? currentTheme.primaryText : currentTheme.textMuted}`} aria-live="polite">
                {copyFeedback || "Share the room link."}
              </p>
            </section>
          ) : null}
        </div>
      </CustomScrollArea>
    </aside>
  );
}
