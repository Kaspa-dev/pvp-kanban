import { Archive, ArrowLeft, ArrowRight, CircleDot, ClipboardList, Play, Plus, Rows4, Zap } from "lucide-react";
import { useDrop } from "react-dnd";
import { KanbanCard } from "./KanbanCard";
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
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-8">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Backlog</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onCreateTask}
                  data-coachmark="backlog-new-task"
                  className={`flex items-center gap-2 rounded-lg bg-gradient-to-r px-5 py-2.5 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg ${currentTheme.primary}`}
                >
                  <Plus className="h-5 w-5" />
                  New Task
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>Create a new backlog task</TooltipContent>
            </Tooltip>
          </div>
          <p className={`text-base ${currentTheme.textMuted}`}>
            Stage upcoming work in the queue, then batch-start it into To Do when the team is ready.
          </p>
        </div>

        <div
          ref={queueDrop}
          data-coachmark="backlog-overview"
          className={`${currentTheme.cardBg} overflow-hidden rounded-2xl border-2 transition-all ${
            isOverQueue ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring}` : currentTheme.border
          }`}
        >
          <div className={`border-b px-6 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${currentTheme.primary}`}>
                  <Rows4 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${currentTheme.text}`}>Queue Batch</h2>
                  <p className={`text-sm ${currentTheme.textMuted}`}>
                    Add ready backlog tasks here, then start them all together into To Do.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex overflow-hidden rounded-2xl border ${currentTheme.border} ${currentTheme.bg}`}>
                  <div className="min-w-[150px] px-4 py-3">
                    <div className={`mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      <CircleDot className="h-3.5 w-3.5" />
                      <span>Queued tasks</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-2xl font-bold leading-none ${currentTheme.text}`}>{queuedCards.length}</span>
                      <span className={`pb-0.5 text-xs ${currentTheme.textMuted}`}>
                        {queuedCards.length === 1 ? "task staged" : "tasks staged"}
                      </span>
                    </div>
                  </div>
                  <div className={`my-3 w-px ${currentTheme.border}`} />
                  <div className="min-w-[150px] px-4 py-3">
                    <div className={`mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Story points</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-2xl font-bold leading-none ${currentTheme.text}`}>{queuedPoints}</span>
                      <span className={`pb-0.5 text-xs ${currentTheme.textMuted}`}>total effort</span>
                    </div>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onStartQueue}
                      disabled={queuedCards.length === 0}
                      className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-5 py-2.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${currentTheme.primary}`}
                    >
                      <Play className="h-4 w-4" />
                      Start Queue
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>Move all queued tasks into To Do</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className={`border-b px-6 py-4 ${currentTheme.border} ${currentTheme.bg}`}>
            <p className={`text-sm ${currentTheme.textSecondary}`}>
              Drag backlog cards here or use the in-card action to batch them. Starting the queue moves every queued task into
              <span className="font-semibold"> To Do</span>.
            </p>
          </div>

          <div className="p-6 pt-4">
            {queuedCards.length === 0 ? (
              <div className={`rounded-2xl border border-dashed px-6 py-12 text-center ${currentTheme.border}`}>
                <ClipboardList className={`mx-auto mb-4 h-14 w-14 ${currentTheme.textMuted}`} />
                <h3 className={`mb-2 text-lg font-semibold ${currentTheme.textSecondary}`}>
                  Queue is empty
                </h3>
                <p className={`text-sm ${currentTheme.textMuted}`}>
                  Add a few backlog tasks, then start the batch when you are ready to push them onto the board.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                    footerTone="neutral"
                    footerAction={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onRemoveFromQueue(card.id)}
                            onMouseDown={(event) => event.stopPropagation()}
                            className="flex w-full items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Remove From Queue</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>Return task to backlog</TooltipContent>
                      </Tooltip>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          ref={backlogDrop}
          className={`${currentTheme.cardBg} overflow-hidden rounded-2xl border-2 transition-all ${
            isOverBacklog ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring}` : currentTheme.border
          }`}
          data-coachmark="backlog-list"
        >
          <div className={`border-b px-6 py-4 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${currentTheme.bgTertiary}`}>
                <Archive className={`h-5 w-5 ${currentTheme.textMuted}`} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${currentTheme.text}`}>Backlog Tasks</h2>
                <p className={`text-sm ${currentTheme.textMuted}`}>
                  {backlogCards.length} {backlogCards.length === 1 ? "task" : "tasks"} waiting to be queued
                </p>
              </div>
            </div>
          </div>

          <div className={`border-b px-6 py-4 ${currentTheme.border} ${currentTheme.bg}`}>
            <p className={`text-sm ${currentTheme.textSecondary}`}>
              Move queued cards back here to unstage them. Current backlog effort:
              <span className="font-semibold"> {backlogPoints} story points</span>.
            </p>
          </div>

          <div className="p-6">
            {backlogCards.length === 0 ? (
              <div className="py-16 text-center">
                <Archive className={`mx-auto mb-4 h-16 w-16 ${currentTheme.textMuted}`} />
                <h3 className={`mb-2 text-lg font-semibold ${currentTheme.textSecondary}`}>
                  {queuedCards.length > 0 ? "Everything is staged in the queue" : "No tasks in backlog"}
                </h3>
                <p className={`mb-6 text-sm ${currentTheme.textMuted}`}>
                  {queuedCards.length > 0
                    ? "Start the queued batch or move tasks back down here if they are not ready yet."
                    : "Create tasks here so your team always has work ready to pull next."}
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
            ) : (
              <div className="space-y-3">
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
                    footerTone="primary"
                    footerAction={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onAddToQueue(card.id)}
                            onMouseDown={(event) => event.stopPropagation()}
                            className="flex w-full items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            <span>Add To Queue</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>Stage task in the queue batch</TooltipContent>
                      </Tooltip>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
