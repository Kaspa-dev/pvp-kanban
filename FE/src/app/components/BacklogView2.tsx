import { Archive, CircleDot, ClipboardList, Play, Plus, Rows4, Zap } from "lucide-react";
import { useDrop } from "react-dnd";
import { KanbanCard } from "./KanbanCard";
import { CustomScrollArea } from "./CustomScrollArea";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { Card, TaskAssignee } from "../utils/cards";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface BacklogViewProps {
  backlogCards: Card[];
  queuedCards: Card[];
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onAddToQueue: (cardId: number) => void;
  onRemoveFromQueue: (cardId: number) => void;
  onStartQueue: () => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
  onCreateTask: () => void;
}

interface DragCardItem {
  id: number;
  columnId: string;
}

function FlowArrowIcon({
  className = "",
  direction = "right",
}: {
  className?: string;
  direction?: "left" | "right";
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      className={direction === "left" ? `${className} rotate-180` : className}
    >
      <path fill="currentColor" d="M8 6l6 4.03L8 14V6z" />
    </svg>
  );
}

function FlowLaneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="currentColor"
        d="M14.7055 18.9112C14.2784 18.7306 14 18.3052 14 17.8333V15H3C2.44772 15 2 14.5523 2 14V10C2 9.44772 2.44772 9 3 9H14V6.1667C14 5.69483 14.2784 5.26942 14.7055 5.08884C15.1326 4.90826 15.6241 5.00808 15.951 5.34174L21.6653 11.175C22.1116 11.6307 22.1116 12.3693 21.6653 12.825L15.951 18.6583C15.6241 18.9919 15.1326 19.0917 14.7055 18.9112Z"
      />
    </svg>
  );
}

export function BacklogView2({
  backlogCards,
  queuedCards,
  onAssigneeChange,
  onDelete,
  onEdit,
  onAddToQueue,
  onRemoveFromQueue,
  onStartQueue,
  availableAssignees,
  labels,
  onCreateTask,
}: BacklogViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const queuedPoints = queuedCards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);
  const backlogPoints = backlogCards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);
  const sectionCardClassName = `${currentTheme.cardBg} overflow-hidden rounded-[28px] border-2 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.55)] transition-all`;
  const sectionStatClassName = `rounded-2xl border px-4 py-3 ${currentTheme.border} ${isDarkMode ? "bg-black/20" : "bg-white/75"} backdrop-blur-sm`;
  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;
  const queueActionButtonClassName = `${primaryActionButtonClassName} gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg`;
  const [{ isOverQueue }, queueDrop] = useDrop<DragCardItem, void, { isOverQueue: boolean }>({
    accept: "CARD",
    drop: (item) => {
      if (item.columnId === "backlog") {
        onAddToQueue(item.id);
      }
    },
    canDrop: (item) => item.columnId === "backlog",
    collect: (monitor) => ({
      isOverQueue: monitor.isOver(),
    }),
  });

  const [{ isOverBacklog }, backlogDrop] = useDrop<DragCardItem, void, { isOverBacklog: boolean }>({
    accept: "CARD",
    drop: (item) => {
      if (item.columnId === "queue") {
        onRemoveFromQueue(item.id);
      }
    },
    canDrop: (item) => item.columnId === "queue",
    collect: (monitor) => ({
      isOverBacklog: monitor.isOver(),
    }),
  });

  return (
    <div className={`${currentTheme.bgSecondary} h-full min-h-0 overflow-hidden`}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[2000px] flex-col gap-8 overflow-hidden px-6 py-8">
        <div className="shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Staging</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onCreateTask}
                  data-coachmark="backlog-new-task"
                  className={`${primaryActionButtonClassName} gap-2 px-5 py-3 text-[15px] font-semibold`}
                >
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                    <span>New Task</span>
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>Create a new task in staging</TooltipContent>
            </Tooltip>
          </div>
          <p className={`text-base ${currentTheme.textMuted}`}>
            Stage upcoming work in the queue, then batch-start it into To Do when the team is ready.
          </p>
        </div>

        <div className="grid flex-1 min-h-0 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch">
          <section
            ref={backlogDrop}
            className={`flex h-full min-h-0 flex-col ${sectionCardClassName} ${
              isOverBacklog ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring}` : currentTheme.border
            }`}
            data-coachmark="backlog-list"
          >
            <div className={`relative overflow-hidden border-b px-6 py-6 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              <div className={`pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} />
              <div className="relative flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentTheme.primary}`}>
                    <Archive className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className={`text-lg font-bold ${currentTheme.text}`}>Staging Tasks</h2>
                    <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                      Keep upcoming work grounded here until each task is ready to be staged forward.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={sectionStatClassName}>
                    <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      <CircleDot className="h-3.5 w-3.5" />
                      <span>Staging tasks</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-bold leading-none ${currentTheme.text}`}>{backlogCards.length}</span>
                      <span className={`pb-1 text-xs ${currentTheme.textMuted}`}>
                        {backlogCards.length === 1 ? "task waiting" : "tasks waiting"}
                      </span>
                    </div>
                  </div>
                  <div className={sectionStatClassName}>
                    <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Story points</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-bold leading-none ${currentTheme.text}`}>{backlogPoints}</span>
                      <span className={`pb-1 text-xs ${currentTheme.textMuted}`}>total effort</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden p-6">
              <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 px-2 py-2 pr-5">
                {backlogCards.length === 0 ? (
                  <div className="flex min-h-[18rem] items-center justify-center">
                    <div className={`w-full rounded-[24px] border border-dashed px-6 py-12 text-center ${currentTheme.border}`}>
                      <Archive className={`mx-auto mb-4 h-14 w-14 ${currentTheme.textMuted}`} />
                      <h3 className={`mb-2 text-lg font-semibold ${currentTheme.textSecondary}`}>
                        {queuedCards.length > 0 ? "Everything is staged in the queue" : "No tasks in staging"}
                      </h3>
                      <p className={`mx-auto mb-6 max-w-md text-sm ${currentTheme.textMuted}`}>
                        {queuedCards.length > 0
                          ? "Start the queued batch or pull work back here if something is not ready yet."
                          : "Create tasks here so your team always has clear work waiting to be staged next."}
                      </p>
                      {queuedCards.length === 0 && (
                        <button
                          onClick={onCreateTask}
                          className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg ${currentTheme.primary}`}
                        >
                          <Plus className="h-5 w-5" />
                          Create First Task
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-1">
                    {backlogCards.map((card) => (
                      <KanbanCard
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        labelIds={card.labelIds}
                        assignee={card.assignee}
                        columnId="backlog"
                        onAssigneeChange={onAssigneeChange}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        availableAssignees={availableAssignees}
                        labels={labels}
                        storyPoints={card.storyPoints}
                        dueDate={card.dueDate}
                        priority={card.priority}
                        taskType={card.taskType}
                        footerAction={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onAddToQueue(card.id)}
                                onMouseDown={(event) => event.stopPropagation()}
                                className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-zinc-950/70 hover:bg-zinc-900/80" : "bg-white/90 hover:bg-slate-50"} hover:${currentTheme.primaryText} backdrop-blur-sm`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isDarkMode ? "bg-white/[0.06]" : "bg-slate-100"} transition-colors group-hover:${currentTheme.primaryBg}`}>
                                  <FlowArrowIcon className={`h-3.5 w-3.5 ${currentTheme.primaryText}`} />
                                </span>
                                <span>Queue</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Stage task in the queue batch</TooltipContent>
                          </Tooltip>
                        }
                      />
                    ))}
                  </div>
                )}
              </CustomScrollArea>
            </div>
          </section>

          <div className="order-2 mx-auto w-full max-w-3xl lg:order-none lg:h-full lg:max-w-none">
            <div className={`relative h-28 overflow-hidden rounded-[28px] border px-4 py-4 ${currentTheme.border} ${currentTheme.cardBg} lg:h-full`}>
              <div className={`pointer-events-none absolute left-[10%] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} opacity-75 blur-3xl lg:left-[18%] lg:top-[14%] lg:h-24 lg:w-24 lg:translate-y-0`} />
              <div className={`pointer-events-none absolute right-[12%] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} opacity-65 blur-[60px] lg:right-[14%] lg:top-[28%] lg:h-32 lg:w-32 lg:translate-y-0 lg:blur-[72px]`} />
              <div className={`pointer-events-none absolute left-[32%] top-[52%] hidden h-20 w-20 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} opacity-75 blur-3xl lg:block`} />
              <div className={`pointer-events-none absolute right-[26%] bottom-[22%] hidden h-28 w-28 rounded-full bg-gradient-to-bl ${currentTheme.primarySoft} opacity-75 blur-[64px] lg:block`} />
              <div className={`pointer-events-none absolute left-[12%] bottom-[12%] hidden h-16 w-16 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} opacity-70 blur-2xl lg:block`} />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                  backgroundImage: `linear-gradient(${isDarkMode ? "#fff" : "#000"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "#fff" : "#000"} 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative flex h-full items-center justify-center lg:min-h-0 lg:flex-col lg:py-16">
                <div
                  className="relative z-10 flex items-center justify-center gap-10 animate-pulse lg:flex-col lg:gap-[6.75rem]"
                  style={{ animationDuration: "3.9s", animationTimingFunction: "cubic-bezier(0.32, 0, 0.2, 1)" }}
                >
                  <FlowLaneIcon className={`h-14 w-14 rotate-90 ${currentTheme.primaryText} lg:h-[4.5rem] lg:w-[4.5rem] lg:rotate-0`} />
                  <FlowLaneIcon className={`h-14 w-14 rotate-90 ${currentTheme.primaryText} lg:h-[4.5rem] lg:w-[4.5rem] lg:rotate-0`} />
                  <FlowLaneIcon className={`h-14 w-14 rotate-90 ${currentTheme.primaryText} lg:h-[4.5rem] lg:w-[4.5rem] lg:rotate-0`} />
                </div>
              </div>
            </div>
          </div>

          <section
            ref={queueDrop}
            data-coachmark="backlog-overview"
            className={`order-3 flex h-full min-h-0 flex-col ${sectionCardClassName} ${
              isOverQueue ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring}` : currentTheme.border
            }`}
          >
            <div className={`relative overflow-hidden border-b px-6 py-6 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              <div className={`pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
              <div className="relative flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentTheme.primary}`}>
                    <Rows4 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className={`text-lg font-bold ${currentTheme.text}`}>Queue Batch</h2>
                    <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                      Stage ready tasks here, then launch the whole batch forward together.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={sectionStatClassName}>
                      <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                        <CircleDot className="h-3.5 w-3.5" />
                        <span>Queued tasks</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold leading-none ${currentTheme.text}`}>{queuedCards.length}</span>
                        <span className={`pb-1 text-xs ${currentTheme.textMuted}`}>
                          {queuedCards.length === 1 ? "task staged" : "tasks staged"}
                        </span>
                      </div>
                    </div>
                    <div className={sectionStatClassName}>
                      <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                        <Zap className="h-3.5 w-3.5" />
                        <span>Story points</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold leading-none ${currentTheme.text}`}>{queuedPoints}</span>
                        <span className={`pb-1 text-xs ${currentTheme.textMuted}`}>total effort</span>
                      </div>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={onStartQueue}
                        disabled={queuedCards.length === 0}
                        className={queueActionButtonClassName}
                      >
                        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <Play className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110" />
                          <span>Start Queue</span>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>Move all queued tasks into To Do</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden p-6">
              <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 px-2 py-2 pr-5">
                {queuedCards.length === 0 ? (
                  <div className="flex min-h-[18rem] items-center justify-center">
                    <div className={`w-full rounded-[24px] border border-dashed px-6 py-12 text-center ${currentTheme.border}`}>
                      <ClipboardList className={`mx-auto mb-4 h-14 w-14 ${currentTheme.textMuted}`} />
                      <h3 className={`mb-2 text-lg font-semibold ${currentTheme.textSecondary}`}>
                        Queue is empty
                      </h3>
                      <p className={`mx-auto max-w-md text-sm ${currentTheme.textMuted}`}>
                        Pull a few ready tasks out of staging, stage them here, then start the batch when your team is ready.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-1">
                    {queuedCards.map((card) => (
                      <KanbanCard
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        labelIds={card.labelIds}
                        assignee={card.assignee}
                        columnId="queue"
                        onAssigneeChange={onAssigneeChange}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        availableAssignees={availableAssignees}
                        labels={labels}
                        storyPoints={card.storyPoints}
                        dueDate={card.dueDate}
                        priority={card.priority}
                        taskType={card.taskType}
                        footerAction={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onRemoveFromQueue(card.id)}
                                onMouseDown={(event) => event.stopPropagation()}
                                className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-zinc-950/70 hover:bg-zinc-900/80" : "bg-white/90 hover:bg-slate-50"} hover:${currentTheme.primaryText} backdrop-blur-sm`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isDarkMode ? "bg-white/[0.06]" : "bg-slate-100"} transition-colors group-hover:${currentTheme.primaryBg}`}>
                                  <FlowArrowIcon className={`h-3.5 w-3.5 ${currentTheme.primaryText}`} direction="left" />
                                </span>
                                <span>Staging</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Return task to staging</TooltipContent>
                          </Tooltip>
                        }
                      />
                    ))}
                  </div>
                )}
              </CustomScrollArea>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
