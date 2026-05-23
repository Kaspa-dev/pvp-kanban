import { Copy, Crown, UsersRound } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import type { Card } from "../../utils/cards";
import type { PlanningPokerParticipant, PlanningPokerSession, PlanningPokerSessionTask } from "../../utils/planningPoker";
import { AppAvatar } from "../AppAvatar";
import { CustomScrollArea } from "../CustomScrollArea";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerRoomRailProps {
  session: PlanningPokerSession;
  activeTask: PlanningPokerSessionTask | null;
  backlogTasks: Card[];
  currentParticipantId: number | null;
  isHost: boolean;
  isSelectingTask: boolean;
  copyFeedback: string;
  onCopyLink: () => void | Promise<void>;
  onSelectTask: (taskId: number) => void | Promise<void>;
}

function getTaskStateLabel(sessionTask: PlanningPokerSessionTask | undefined, isActive: boolean) {
  if (isActive) {
    return sessionTask?.recommendedStoryPoints !== null && sessionTask?.recommendedStoryPoints !== undefined
      ? `${sessionTask.recommendedStoryPoints} picked`
      : "Voting";
  }

  if (!sessionTask) {
    return "Backlog";
  }

  if (sessionTask.roundState.toLowerCase() === "revealed" || sessionTask.recommendedStoryPoints !== null) {
    return "Review";
  }

  return "Queued";
}

function hasPickedRecommendation(sessionTask: PlanningPokerSessionTask | undefined) {
  return sessionTask?.recommendedStoryPoints !== null && sessionTask?.recommendedStoryPoints !== undefined;
}

function isRevealedSessionTask(sessionTask: PlanningPokerSessionTask | undefined) {
  return sessionTask?.roundState.toLowerCase() === "revealed";
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
  const participantLabel = isCurrentUser ? "YOU" : participant.displayName;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-3",
        `${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/78"}`,
      )}
      aria-label={`${isCurrentUser ? "You" : participant.displayName}: ${getParticipantStatus(participant, isRevealed)}`}
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
            {participantLabel}
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
  backlogTasks,
  currentParticipantId,
  isHost,
  isSelectingTask,
  copyFeedback,
  onCopyLink,
  onSelectTask,
}: PlanningPokerRoomRailProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const sessionTasksByTaskId = new Map(
    [activeTask, ...session.queue]
      .filter((task): task is PlanningPokerSessionTask => Boolean(task))
      .map((task) => [task.taskId, task]),
  );
  const unratedBacklogTasks = backlogTasks
    .filter((task) => task.status === "backlog" && task.storyPoints == null)
    .sort((firstTask, secondTask) => firstTask.columnPosition - secondTask.columnPosition);
  const taskGroups = [
    {
      label: "Current",
      tasks: unratedBacklogTasks.filter((task) => activeTask?.taskId === task.id),
    },
    {
      label: "Review",
      tasks: unratedBacklogTasks.filter((task) => {
        const sessionTask = sessionTasksByTaskId.get(task.id);
        return activeTask?.taskId !== task.id && (isRevealedSessionTask(sessionTask) || hasPickedRecommendation(sessionTask));
      }),
    },
    {
      label: "Queued",
      tasks: unratedBacklogTasks.filter((task) => {
        const sessionTask = sessionTasksByTaskId.get(task.id);
        return activeTask?.taskId !== task.id &&
          Boolean(sessionTask) &&
          !isRevealedSessionTask(sessionTask) &&
          !hasPickedRecommendation(sessionTask);
      }),
    },
    {
      label: "Backlog",
      tasks: unratedBacklogTasks.filter((task) => !sessionTasksByTaskId.has(task.id)),
    },
  ].filter((group) => group.tasks.length > 0);

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
              {unratedBacklogTasks.length} unrated backlog {unratedBacklogTasks.length === 1 ? "task" : "tasks"}
            </p>
          </div>
        </div>
      </div>

      <CustomScrollArea className="min-h-0 flex-1" viewportClassName="h-full min-h-0 px-4 py-4 pr-5">
        <div className="space-y-5">
          <section aria-labelledby="planning-poker-rail-tasks">
            <h3 id="planning-poker-rail-tasks" className="sr-only">
              Task queue
            </h3>
            {taskGroups.length > 0 ? (
              <div className="space-y-4">
                {taskGroups.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.textMuted}`}>
                        {group.label}
                      </h4>
                      <span className={`font-due-date text-[11px] font-semibold ${currentTheme.textMuted}`}>
                        {group.tasks.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.tasks.map((task) => {
                        const sessionTask = sessionTasksByTaskId.get(task.id);
                        const isActiveTask = activeTask?.taskId === task.id;
                        const canSelectTask =
                          isHost && !isActiveTask && !isSelectingTask;
                        const taskContent = (
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`line-clamp-2 text-sm font-semibold ${currentTheme.text}`}>{task.title}</p>
                              <p className={`font-due-date mt-2 text-xs font-semibold ${isActiveTask ? currentTheme.primaryText : currentTheme.textMuted}`}>
                                {getTaskStateLabel(sessionTask, isActiveTask)}
                              </p>
                            </div>
                          </div>
                        );

                        if (!isHost) {
                          return (
                            <div
                              key={task.id}
                              className={`rounded-2xl border px-3 py-3 text-left ${isActiveTask ? currentTheme.primaryBorder : currentTheme.border} ${
                                isActiveTask
                                  ? isDarkMode ? "bg-white/[0.05]" : "bg-white"
                                  : isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/78"
                              }`}
                              aria-current={isActiveTask ? "true" : undefined}
                            >
                              {taskContent}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={task.id}
                            type="button"
                            disabled={!canSelectTask}
                            onClick={() => void onSelectTask(task.id)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus} ${
                              isActiveTask
                                ? `${currentTheme.primaryBorder} ${isDarkMode ? "bg-white/[0.05]" : "bg-white"}`
                                : `${currentTheme.border} ${isDarkMode ? "bg-white/[0.025] hover:bg-white/[0.055]" : "bg-slate-50/78 hover:bg-white"}`
                            } ${!canSelectTask && !isActiveTask ? "cursor-not-allowed opacity-60" : ""}`}
                            aria-current={isActiveTask ? "true" : undefined}
                            aria-label={
                              isActiveTask
                                ? `${task.title}, current task`
                                : `Switch to ${task.title}`
                            }
                          >
                            {taskContent}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className={`rounded-2xl border px-3 py-4 text-sm ${currentTheme.border} ${currentTheme.textMuted} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/78"}`}>
                  No unrated backlog tasks
                </div>
              )}
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
