import { CheckCircle2, Copy, Crown, UsersRound } from "lucide-react";

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
        "flex items-center gap-3 border-b px-1 py-3 last:border-b-0",
        currentTheme.border,
        isCurrentUser ? (isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/54") : "",
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
      <span className={`font-due-date shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${participant.hasVoted ? currentTheme.primaryText : currentTheme.textMuted} ${isDarkMode ? "bg-white/[0.04]" : "bg-slate-100/80"}`}>
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
  const unratedBacklogTasks = backlogTasks
    .filter((task) => task.status === "backlog" && task.storyPoints == null)
    .sort((firstTask, secondTask) => {
      if (firstTask.id === activeTask?.taskId) {
        return -1;
      }

      if (secondTask.id === activeTask?.taskId) {
        return 1;
      }

      return firstTask.columnPosition - secondTask.columnPosition;
    });
  const concludedBacklogTasks = backlogTasks
    .filter((task) => task.status === "backlog" && task.storyPoints != null)
    .sort((firstTask, secondTask) => firstTask.columnPosition - secondTask.columnPosition);

  return (
    <aside
      className={`flex min-h-[32rem] flex-col overflow-hidden border-t xl:h-full xl:min-h-0 xl:border-l xl:border-t-0 ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/18" : "bg-white/30"}`}
      aria-label="Planning poker room side panel"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 px-1 py-5 sm:px-4 xl:pl-5 xl:pr-1">
          <section
            aria-labelledby="planning-poker-rail-tasks"
            className="flex h-[24rem] min-h-[18rem] shrink-0 flex-col overflow-hidden"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="planning-poker-rail-tasks" className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Tasks
              </h3>
              <span className={`font-due-date inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${currentTheme.textMuted} ${isDarkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                {unratedBacklogTasks.length + concludedBacklogTasks.length}
              </span>
            </div>
            <CustomScrollArea className="min-h-0 flex-1" viewportClassName="h-full min-h-0 pr-4">
              <div className="space-y-4">
                <div>
                  <div className={`mb-2 flex items-center justify-between gap-2 border-b pb-2 ${currentTheme.border}`}>
                    <h4 className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.textMuted}`}>
                      Remaining
                    </h4>
                    <span className={`font-due-date text-[11px] font-semibold ${currentTheme.textMuted}`}>
                      {unratedBacklogTasks.length}
                    </span>
                  </div>
                  {unratedBacklogTasks.length > 0 ? (
                    <div>
                      {unratedBacklogTasks.map((task) => {
                        const isActiveTask = activeTask?.taskId === task.id;
                        const canSelectTask = isHost && !isActiveTask && !isSelectingTask;
                        const taskClassName = cn(
                          "w-full border-b px-1 py-3 text-left transition-all duration-200 last:border-b-0",
                          currentTheme.border,
                          isActiveTask
                            ? `pl-3 shadow-[inset_3px_0_0_currentColor] ${currentTheme.primaryText} ${isDarkMode ? "bg-white/[0.035]" : "bg-slate-50/72"}`
                            : currentTheme.text,
                        );
                        const taskContent = (
                          <p className={`line-clamp-2 text-sm font-semibold ${isActiveTask ? currentTheme.text : currentTheme.text}`}>
                            {task.title}
                          </p>
                        );

                        if (!isHost) {
                          return (
                            <div
                              key={task.id}
                              className={taskClassName}
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
                            className={cn(
                              taskClassName,
                              currentTheme.focus,
                              "focus-visible:outline-none focus-visible:ring-2",
                              !isActiveTask && canSelectTask
                                ? isDarkMode ? "hover:bg-white/[0.035]" : "hover:bg-slate-50/72"
                                : "",
                              !canSelectTask && !isActiveTask ? "cursor-not-allowed opacity-60" : "",
                            )}
                            aria-current={isActiveTask ? "true" : undefined}
                            aria-label={isActiveTask ? `${task.title}, current task` : `Select ${task.title}`}
                          >
                            {taskContent}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`px-1 py-4 text-sm ${currentTheme.textMuted}`}>
                      No remaining tasks
                    </div>
                  )}
                </div>

                {concludedBacklogTasks.length > 0 ? (
                  <section aria-labelledby="planning-poker-rail-rated-tasks">
                    <div className={`mb-2 flex items-center justify-between gap-2 border-t pt-4 ${currentTheme.border}`}>
                      <h3
                        id="planning-poker-rail-rated-tasks"
                        className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.textMuted}`}
                      >
                        Rated
                      </h3>
                      <span className={`font-due-date text-[11px] font-semibold ${currentTheme.textMuted}`}>
                        {concludedBacklogTasks.length}
                      </span>
                    </div>

                    <div>
                      {concludedBacklogTasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "border-b px-1 py-3 text-left opacity-75 grayscale last:border-b-0",
                            currentTheme.border,
                          )}
                          aria-label={`${task.title}, concluded with ${task.storyPoints} story points`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className={`line-clamp-2 min-w-0 text-sm font-semibold ${currentTheme.textMuted}`}>
                              {task.title}
                            </p>
                            <span
                              className={cn(
                                "font-due-date inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                isDarkMode ? "bg-zinc-950/62 text-zinc-400" : "bg-white/78 text-slate-500",
                              )}
                            >
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              {task.storyPoints} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </CustomScrollArea>
          </section>

        <div className={`mt-auto flex min-h-[15rem] flex-1 flex-col overflow-hidden border-t pt-4 ${currentTheme.border}`}>
          <section
            aria-labelledby="planning-poker-rail-participants"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="planning-poker-rail-participants" className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Players
              </h3>
              <span className={`font-due-date inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${currentTheme.textMuted} ${isDarkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                {session.participants.length}
              </span>
            </div>
            <CustomScrollArea className="min-h-0 flex-1" viewportClassName="h-full min-h-0 pr-1">
              <ul>
                {session.participants.map((participant) => (
                  <ParticipantRow
                    key={participant.participantId}
                    participant={participant}
                    isCurrentUser={participant.participantId === currentParticipantId}
                    isRevealed={session.isRevealed}
                  />
                ))}
              </ul>
            </CustomScrollArea>
          </section>

          {isHost ? (
            <section className={`mt-4 shrink-0 border-t pt-4 ${currentTheme.border}`} aria-labelledby="planning-poker-share-room">
              <div className="flex min-h-10 items-center justify-between gap-3">
                <h3 id="planning-poker-share-room" className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  Invite
                </h3>
                <Button
                  type="button"
                  onClick={() => void onCopyLink()}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r ${currentTheme.primary} px-3.5 text-sm font-semibold leading-none text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:brightness-105 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`}
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
      </div>
    </aside>
  );
}
