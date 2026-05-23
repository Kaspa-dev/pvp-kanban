import { Archive, Trash2, Zap, Edit, FileText, Bug, Lightbulb, CheckSquare, Undo2 } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { ReactNode, useCallback, useRef, useState } from "react";
import { Priority, TaskAssignee, TaskStatus, TaskType } from "../utils/cards";
import { getPriorityIndicator } from "../utils/priorityColors";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TaskLabelSummary } from "./TaskLabelSummary";
import { UtilityIconButton } from "./UtilityIconButton";
import { PriorityAccent } from "./PriorityAccent";
import { TaskDueDateBadge } from "./TaskDueDateBadge";
import { getTaskDueDateDisplay } from "../utils/taskDueDate";
import { TaskAssigneeControl } from "./TaskAssigneeControl";
import { TaskColumnAgeBadge } from "./TaskColumnAgeBadge";
import { getTaskColumnAgeDisplay } from "../utils/taskColumnAge";

interface KanbanCardProps {
  boardId: number;
  id: number;
  index?: number;
  title: string;
  labelIds: number[];
  assignee: TaskAssignee;
  columnId: string;
  onCardDrop?: (cardId: number, fromColumnId: string, toColumnId: string, targetIndex: number) => void;
  onOpen?: (cardId: number) => void;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void;
  onConclude?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
  storyPoints?: number;
  dueDate?: string | null;
  statusEnteredAtUtc?: string | null;
  priority?: Priority;
  taskType?: TaskType;
  footerAction?: ReactNode;
  showColumnAge?: boolean;
}

type DraggedKanbanCard = {
  id: number;
  columnId: string;
  index: number;
};

type DropEdge = "before" | "after";

export function KanbanCard({
  boardId,
  id,
  index = 0,
  title,
  labelIds,
  assignee,
  columnId,
  onCardDrop,
  onOpen,
  onAssigneeChange,
  onDelete,
  onEdit,
  onMoveToBacklog,
  onConclude,
  availableAssignees,
  labels,
  storyPoints,
  dueDate,
  statusEnteredAtUtc,
  priority,
  taskType,
  footerAction,
  showColumnAge = false,
}: KanbanCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [dropEdge, setDropEdge] = useState<DropEdge | null>(null);
  const taskSurfaceClassName = isDarkMode ? "bg-zinc-900/90" : "bg-white/95";
  const taskHoverShadowClassName = isDarkMode
    ? "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_44px_rgba(0,0,0,0.46),0_0_34px_rgba(255,255,255,0.08)]"
    : "group-hover:shadow-[0_14px_28px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.08)]";
  const dropIndicatorGlowClassName = isDarkMode
    ? "shadow-[0_0_12px_rgba(255,255,255,0.12)]"
    : "shadow-[0_4px_10px_rgba(15,23,42,0.10)]";

  const [{ isDragging }, drag] = useDrag<DraggedKanbanCard, void, { isDragging: boolean }>({
    type: "CARD",
    item: { id, columnId, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isDropOver }, drop] = useDrop<DraggedKanbanCard, { handled: boolean } | void, { isDropOver: boolean }>({
    accept: "CARD",
    canDrop: (item) => Boolean(onCardDrop) && item.id !== id,
    hover: (item, monitor) => {
      if (!cardRef.current || !onCardDrop || item.id === id) {
        setDropEdge(null);
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }

      const hoverRect = cardRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const hoverClientY = clientOffset.y - hoverRect.top;

      setDropEdge(hoverClientY < hoverMiddleY ? "before" : "after");
    },
    drop: (item) => {
      if (!onCardDrop || item.id === id || !dropEdge) {
        setDropEdge(null);
        return;
      }

      let nextTargetIndex = dropEdge === "after" ? index + 1 : index;
      if (item.columnId === columnId && item.index < nextTargetIndex) {
        nextTargetIndex -= 1;
      }

      onCardDrop(item.id, item.columnId, columnId, Math.max(0, nextTargetIndex));
      setDropEdge(null);
      return { handled: true };
    },
    collect: (monitor) => ({
      isDropOver: monitor.isOver({ shallow: true }),
    }),
  });

  const setCardDragDropRef = useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node;
      if (node) {
        drag(drop(node));
      }
    },
    [drag, drop],
  );

  const cardLabels = labelIds
    .map((labelId) => labels.find((label) => label.id === labelId))
    .filter((label): label is Label => label !== undefined);

  const priorityIndicator = getPriorityIndicator(priority);
  const dueDateDisplay = getTaskDueDateDisplay(dueDate);
  const columnAgeDisplay = showColumnAge ? getTaskColumnAgeDisplay(statusEnteredAtUtc, columnId as TaskStatus) : null;
  const hasColumnAgeBadge = Boolean(columnAgeDisplay);

  const getTaskTypeDisplay = () => {
    switch (taskType) {
      case "story":
        return { icon: <FileText className="w-3.5 h-3.5" />, label: "Story" };
      case "bug":
        return { icon: <Bug className="w-3.5 h-3.5" />, label: "Bug" };
      case "task":
        return { icon: <CheckSquare className="w-3.5 h-3.5" />, label: "Task" };
      case "spike":
        return { icon: <Lightbulb className="w-3.5 h-3.5" />, label: "Spike" };
      default:
        return null;
    }
  };

  const taskTypeDisplay = getTaskTypeDisplay();
  const showDueDateInTopMeta = Boolean(dueDateDisplay && footerAction);
  const showRestingDueDate = Boolean(dueDateDisplay && !footerAction);
  const showColumnAgeInTopMeta = Boolean(hasColumnAgeBadge && footerAction);
  const showRestingColumnAge = Boolean(hasColumnAgeBadge && !footerAction);
  const hasStoryPoints = storyPoints !== undefined && storyPoints > 0;
  const hasTopMeta = Boolean(cardLabels.length > 0 || taskTypeDisplay || showDueDateInTopMeta || showColumnAgeInTopMeta || priorityIndicator);
  const canMoveToBacklog = columnId !== "backlog" && columnId !== "queue" && Boolean(onMoveToBacklog);
  const revealActionsClassName = "flex max-w-0 shrink-0 translate-y-1 items-center gap-2 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover:max-w-[12rem] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:max-w-[12rem] group-focus-within:translate-y-0 group-focus-within:opacity-100";
  const isOpenable = Boolean(onOpen);
  const isDropSlotVisible = Boolean(dropEdge && isDropOver && !isDragging);
  const dropSlot = isDropSlotVisible ? (
    <div
      className="pointer-events-none flex h-3 items-center px-3 transition-[height,opacity,transform] duration-150 ease-out"
      aria-hidden="true"
    >
      <span className={`h-px w-full rounded-full bg-gradient-to-r ${currentTheme.primary} ${dropIndicatorGlowClassName}`} />
    </div>
  ) : null;

  const handleOpen = () => {
    onOpen?.(id);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpenable) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.(id);
    }
  };

  return (
    <div
      ref={setCardDragDropRef}
      className={`relative z-0 isolate group overflow-visible p-1 transition-transform duration-200 hover:-translate-y-1 ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      }`}
      style={{
        cursor: isDragging ? "grabbing" : "default",
      }}
      >
      {dropEdge === "before" ? dropSlot : null}
      <div
        className={`relative overflow-hidden rounded-lg border-2 ${currentTheme.border} ${taskSurfaceClassName} shadow-none transition-[box-shadow] duration-200 ${taskHoverShadowClassName} ${isOpenable ? "cursor-pointer" : ""}`}
        onClick={isOpenable ? handleOpen : undefined}
        onKeyDown={handleCardKeyDown}
        role={isOpenable ? "button" : undefined}
        tabIndex={isOpenable ? 0 : undefined}
        aria-label={isOpenable ? `Open task ${title}` : undefined}
      >
        <div className="px-4 py-4 pl-7">
          <div className="relative min-w-0">
            {hasStoryPoints && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`absolute right-0 top-0 flex shrink-0 items-center gap-1 font-medium ${currentTheme.textMuted}`}>
                    <Zap className="h-4 w-4" />
                    <span className="font-due-date text-sm">{storyPoints}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>{storyPoints} story points</TooltipContent>
              </Tooltip>
            )}

            <div>
              {hasTopMeta && (
                <div className={`mb-2 flex min-w-0 items-center gap-2 overflow-hidden ${hasStoryPoints ? "pr-14" : ""} ${currentTheme.textMuted}`}>
                  {taskTypeDisplay && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {taskTypeDisplay.icon}
                      <span className="font-due-date text-xs font-medium">{taskTypeDisplay.label}</span>
                    </div>
                  )}
                  {showColumnAgeInTopMeta && (
                    <TaskColumnAgeBadge statusEnteredAtUtc={statusEnteredAtUtc} status={columnId as TaskStatus} className="shrink-0" />
                  )}
                  {showDueDateInTopMeta && <TaskDueDateBadge dueDate={dueDate} className="shrink-0" />}
                  {cardLabels.length > 0 && (
                    <TaskLabelSummary
                      labels={cardLabels}
                      maxVisible={2}
                      compactMaxVisible={1}
                      collapseToFit
                    />
                  )}
                </div>
              )}

              <div
                title={title}
                className={`mb-4 block max-w-full truncate text-left font-bold text-[15px] leading-tight ${currentTheme.text}`}
              >
                {priorityIndicator && (
                  <span className="sr-only">{priorityIndicator.label} priority. </span>
                )}
                {title}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                  <TaskAssigneeControl
                    boardId={boardId}
                    taskId={id}
                    assignee={assignee}
                    onAssigneeChange={onAssigneeChange}
                    availableAssignees={availableAssignees}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className={revealActionsClassName}>
                  {canMoveToBacklog && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UtilityIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToBacklog?.(id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Undo2 className="w-4 h-4" />
                        </UtilityIconButton>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>Move to staging</TooltipContent>
                    </Tooltip>
                  )}

                  {onEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UtilityIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-4 h-4" />
                        </UtilityIconButton>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>Edit task</TooltipContent>
                    </Tooltip>
                  )}

                  {onConclude && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UtilityIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onConclude(id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Archive className="w-4 h-4" />
                        </UtilityIconButton>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>Conclude task</TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <UtilityIconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(id, title);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </UtilityIconButton>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>Delete task</TooltipContent>
                  </Tooltip>
                </div>

                <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                  {footerAction}
                </div>
              </div>
            </div>

            {(showRestingColumnAge || showRestingDueDate) && (
              <div className="absolute bottom-0 right-0 flex items-center gap-2 px-1 py-1 transition-[opacity,transform] duration-200 ease-out group-hover:pointer-events-none group-hover:translate-y-1 group-hover:opacity-0 group-focus-within:pointer-events-none group-focus-within:translate-y-1 group-focus-within:opacity-0">
                {showRestingColumnAge && (
                  <TaskColumnAgeBadge statusEnteredAtUtc={statusEnteredAtUtc} status={columnId as TaskStatus} />
                )}
                {showRestingDueDate && <TaskDueDateBadge dueDate={dueDate} />}
              </div>
            )}
          </div>
        </div>
        {priority ? <PriorityAccent priority={priority} isDarkMode={isDarkMode} /> : null}
      </div>
      {dropEdge === "after" ? dropSlot : null}
    </div>
  );
}
