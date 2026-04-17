import { Archive, ClipboardList, Play, Plus } from "lucide-react";
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
  isPlanningPokerApplying: boolean;
  isPlanningPokerDeleting: boolean;
  onCreatePlanningPokerSession: () => void;
  onRefreshPlanningPokerSession: () => void;
  onApplyPlanningPokerRecommendation: (sessionTaskId: number) => void;
  onDeletePlanningPokerSession: () => void;
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
  planningPokerSession,
  planningPokerEligibleTaskCount,
  isPlanningPokerLoading,
  isPlanningPokerCreating,
  isPlanningPokerApplying,
  isPlanningPokerDeleting,
  onCreatePlanningPokerSession,
  onRefreshPlanningPokerSession,
  onApplyPlanningPokerRecommendation,
  onDeletePlanningPokerSession,
}: BacklogViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceWidthClassName = "mx-auto w-full max-w-[1850px]";

  const sectionCardClassName = `${currentTheme.cardBg} overflow-hidden rounded-[28px] border-2 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.55)] transition-all`;
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
    <div className={`${currentTheme.bgSecondary} h-full min-h-0 overflow-visible`}>
      <div className={`${workspaceWidthClassName} flex h-full min-h-0 flex-col gap-8 overflow-visible px-8 py-8 lg:px-10 xl:px-12`}>
        <div className="shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Staging</h1>
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
            isApplyingRecommendation={isPlanningPokerApplying}
            isDeleting={isPlanningPokerDeleting}
            onCreateSession={onCreatePlanningPokerSession}
            onRefreshSession={onRefreshPlanningPokerSession}
            onApplyRecommendation={onApplyPlanningPokerRecommendation}
            onDeleteSession={onDeletePlanningPokerSession}
          />
        </div>

        <div className="grid flex-1 min-h-0 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-5 overflow-visible lg:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch">
          <section
            ref={backlogDrop}
            className={`flex h-full min-h-0 flex-col ${sectionCardClassName} ${
              isOverBacklog ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring}` : currentTheme.border
            }`}
            data-coachmark="staging-list"
          >
            <div className={`relative overflow-hidden border-b px-6 py-6 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              <div className="relative min-w-0">
                <h2 className={`text-lg font-bold ${currentTheme.text}`}>Staging Tasks</h2>
                <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                  Keep upcoming work grounded here until each task is ready to be staged forward.
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-visible p-6">
              <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 px-4 py-3 pr-6">
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
                                className={`group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"} hover:${currentTheme.primaryText} ${currentTheme.focus}`}
                              >
                                <span className="leading-none">Add to Queue</span>
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                  <FlowArrowIcon className="block h-3.5 w-3.5 translate-y-px text-current" />
                                </span>
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
            <div className="flex h-24 items-center justify-center lg:h-full">
              <div className="flex items-center justify-center gap-4 lg:flex-col lg:gap-5" aria-hidden="true">
                <div className={`h-px w-14 ${isDarkMode ? "bg-white/15" : "bg-slate-300"} lg:h-14 lg:w-px`} />
                <FlowLaneIcon className={`h-7 w-7 rotate-90 ${currentTheme.textMuted} lg:h-8 lg:w-8 lg:rotate-0`} />
                <div className={`h-px w-14 ${isDarkMode ? "bg-white/15" : "bg-slate-300"} lg:h-14 lg:w-px`} />
              </div>
              <span className="sr-only">Tasks move from staging into the queue batch.</span>
            </div>
          </div>

          <section
            ref={queueDrop}
            data-coachmark="staging-overview"
            className={`order-3 flex h-full min-h-0 flex-col ${sectionCardClassName} ${
              isOverQueue ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring}` : currentTheme.border
            }`}
          >
            <div className={`relative overflow-hidden border-b px-6 py-6 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              <div className="relative flex flex-col gap-5">
                <div className="min-w-0">
                  <h2 className={`text-lg font-bold ${currentTheme.text}`}>Queue Batch</h2>
                  <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                    Stage ready tasks here, then launch the whole batch forward together.
                  </p>
                </div>

                <div className="grid gap-3">
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

            <div className="flex-1 min-h-0 overflow-visible p-6">
              <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 px-4 py-3 pr-6">
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
                                className={`group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"} hover:${currentTheme.primaryText} ${currentTheme.focus}`}
                              >
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                  <FlowArrowIcon className="block h-3.5 w-3.5 translate-y-px text-current" direction="left" />
                                </span>
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
      </div>
    </div>
  );
}
