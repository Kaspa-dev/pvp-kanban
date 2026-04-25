import { Inbox, Play, Plus } from "lucide-react";
import { useDrop } from "react-dnd";
import { KanbanCard } from "./KanbanCard";
import { CustomScrollArea } from "./CustomScrollArea";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { Card, TaskAssignee } from "../utils/cards";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PlanningPokerLaunchCard } from "./planning-poker/PlanningPokerLaunchCard";
import type { PlanningPokerSession } from "../utils/planningPoker";

interface BacklogViewProps {
  boardId: number;
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
  planningPokerSession: PlanningPokerSession | null;
  planningPokerEligibleTaskCount: number;
  isPlanningPokerLoading: boolean;
  isPlanningPokerCreating: boolean;
  isPlanningPokerDeleting: boolean;
  onCreatePlanningPokerSession: () => void;
  onRefreshPlanningPokerSession: () => void;
  onDeletePlanningPokerSession: () => void;
}

interface DragCardItem {
  id: number;
  columnId: string;
}

export function BacklogView2({
  boardId,
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
  planningPokerSession,
  planningPokerEligibleTaskCount,
  isPlanningPokerLoading,
  isPlanningPokerCreating,
  isPlanningPokerDeleting,
  onCreatePlanningPokerSession,
  onRefreshPlanningPokerSession,
  onDeletePlanningPokerSession,
}: BacklogViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceWidthClassName = "mx-auto w-full max-w-[1850px]";

  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;
  const queueActionButtonClassName = `${primaryActionButtonClassName} gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg`;
  const inlineActionButtonClassName = `group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${currentTheme.focus} ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"} hover:${currentTheme.primaryText}`;
  const regionDividerClassName = currentTheme.border;
  const activeDropRegionClassName = isDarkMode ? "bg-white/[0.03]" : "bg-black/[0.02]";
  const emptyStateContainerClassName = `${isDarkMode ? "border-white/12 bg-white/[0.03]" : "border-slate-300/70 bg-slate-100/80"} rounded-xl border border-dashed`;
  const emptyStateIconClassName = `${currentTheme.textMuted} h-5 w-5`;

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
    <div className={`${currentTheme.bgSecondary} h-full min-h-0 overflow-visible`}>
      <div className={`${workspaceWidthClassName} flex h-full min-h-0 flex-col gap-6 overflow-visible px-8 py-6 lg:px-10 xl:px-12`}>
        <div className="shrink-0">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h1 className={`font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              Staging
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onCreateTask}
                  data-coachmark="staging-new-task"
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

        <div className="shrink-0">
          <PlanningPokerLaunchCard
            session={planningPokerSession}
            eligibleTaskCount={planningPokerEligibleTaskCount}
            isLoading={isPlanningPokerLoading}
            isCreating={isPlanningPokerCreating}
            isDeleting={isPlanningPokerDeleting}
            onCreateSession={onCreatePlanningPokerSession}
            onRefreshSession={onRefreshPlanningPokerSession}
            onDeleteSession={onDeletePlanningPokerSession}
          />
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-0 overflow-visible lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section
            ref={backlogDrop}
            className={`flex min-h-0 flex-col ${isOverBacklog ? activeDropRegionClassName : ""}`}
            data-coachmark="staging-list"
          >
            <div className={`min-w-0 border-b pb-5 pr-0 ${regionDividerClassName} lg:pr-8`}>
              <h2 className={`text-lg font-bold ${currentTheme.text}`}>Staging Tasks</h2>
              <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                Keep upcoming work grounded here until each task is ready to be staged forward.
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-visible py-5 pr-0 lg:pr-8">
              <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 pr-4">
                {backlogCards.length === 0 ? (
                  <div className="flex h-full min-h-[18rem] items-stretch px-1 py-1">
                    <div className={`${emptyStateContainerClassName} flex min-h-full w-full flex-1 flex-col items-center justify-center gap-3 px-8 py-10 text-center`}>
                      <Inbox className={emptyStateIconClassName} aria-hidden="true" />
                      <h3 className={`text-base font-semibold ${currentTheme.textSecondary}`}>
                        {queuedCards.length > 0 ? "Everything is staged in the queue" : "No tasks in staging"}
                      </h3>
                      <p className={`mt-2 text-sm ${currentTheme.textMuted}`}>
                        {queuedCards.length > 0
                          ? "Start the queued batch or pull work back here if something is not ready yet."
                          : "Create tasks here so your team always has clear work waiting to be staged next."}
                      </p>
                      {queuedCards.length === 0 && (
                        <button
                          onClick={onCreateTask}
                          className={`mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"} hover:${currentTheme.primaryText}`}
                        >
                          <Plus className="h-4 w-4" />
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
                        boardId={boardId}
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
                                className={inlineActionButtonClassName}
                              >
                                <span className="leading-none">Add to Queue</span>
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

          <section
            ref={queueDrop}
            data-coachmark="staging-overview"
            className={`flex min-h-0 flex-col border-t pt-6 ${regionDividerClassName} ${isOverQueue ? activeDropRegionClassName : ""} lg:border-l lg:border-t-0 lg:pt-0`}
          >
            <div className={`min-w-0 border-b pb-5 ${regionDividerClassName}`}>
              <div className="flex flex-wrap items-start justify-between gap-4 lg:pl-8">
                <div className="min-w-0">
                  <h2 className={`text-lg font-bold ${currentTheme.text}`}>Queue Batch</h2>
                  <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                    Stage ready tasks here, then launch the whole batch forward together.
                  </p>
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

            <div className="flex-1 min-h-0 overflow-visible py-5 lg:pl-8">
              <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 pr-4">
                {queuedCards.length === 0 ? (
                  <div className="flex h-full min-h-[18rem] items-stretch px-1 py-1">
                    <div className={`${emptyStateContainerClassName} flex min-h-full w-full flex-1 flex-col items-center justify-center gap-3 px-8 py-10 text-center`}>
                      <Inbox className={emptyStateIconClassName} aria-hidden="true" />
                      <h3 className={`text-base font-semibold ${currentTheme.textSecondary}`}>
                        Queue is empty
                      </h3>
                      <p className={`mt-2 text-sm ${currentTheme.textMuted}`}>
                        Pull a few ready tasks out of staging, stage them here, then start the batch when your team is ready.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-1">
                    {queuedCards.map((card) => (
                      <KanbanCard
                        key={card.id}
                        boardId={boardId}
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
                                className={inlineActionButtonClassName}
                              >
                                <span className="leading-none">Back to Staging</span>
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

        <div className={`shrink-0 border-t ${currentTheme.border}`} />
      </div>
    </div>
  );
}
