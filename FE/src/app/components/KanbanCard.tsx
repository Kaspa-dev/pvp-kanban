import { Trash2, Zap, Edit, FileText, Bug, Lightbulb, CheckSquare, Undo2 } from "lucide-react";
import { useDrag } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { Label } from "../utils/labels";
import { ReactNode } from "react";
import { Priority, TaskAssignee, TaskType } from "../utils/cards";
import { getPriorityIndicator } from "../utils/priorityColors";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TaskLabelSummary } from "./TaskLabelSummary";
import { UtilityIconButton } from "./UtilityIconButton";
import { PriorityAccent } from "./PriorityAccent";
import { getTaskDueDateDisplay, TaskDueDateBadge } from "./TaskDueDateBadge";

interface KanbanCardProps {
  boardId: number;
  id: number;
  title: string;
  labelIds: number[];
  assignee: TaskAssignee;
  columnId: string;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  suggestedAssignees?: TaskAssignee[];
  labels: Label[];
  storyPoints?: number;
  dueDate?: string | null;
  priority?: Priority;
  taskType?: TaskType;
  footerAction?: ReactNode;
}

export function KanbanCard({
  boardId,
  id,
  title,
  labelIds,
  assignee,
  columnId,
  onAssigneeChange,
  onDelete,
  onEdit,
  onMoveToBacklog,
  availableAssignees,
  suggestedAssignees,
  labels,
  storyPoints,
  dueDate,
  priority,
  taskType,
  footerAction,
}: KanbanCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const taskSurfaceClassName = isDarkMode ? "bg-zinc-900/90" : "bg-white/95";
  const taskHoverShadowClassName = isDarkMode
    ? "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_44px_rgba(0,0,0,0.46),0_0_34px_rgba(255,255,255,0.08)]"
    : "group-hover:shadow-[0_14px_28px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.08)]";

  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { id, columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const cardLabels = labelIds
    .map((labelId) => labels.find((label) => label.id === labelId))
    .filter((label): label is Label => label !== undefined);

  const priorityIndicator = getPriorityIndicator(priority);
  const dueDateDisplay = getTaskDueDateDisplay(dueDate);

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
  const hasStoryPoints = storyPoints !== undefined && storyPoints > 0;
  const hasTopMeta = Boolean(cardLabels.length > 0 || taskTypeDisplay || showDueDateInTopMeta || priorityIndicator);
  const canMoveToBacklog = columnId !== "backlog" && columnId !== "queue" && Boolean(onMoveToBacklog);
  const revealActionsClassName = "flex max-w-0 shrink-0 translate-y-1 items-center gap-2 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover:max-w-[9rem] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:max-w-[9rem] group-focus-within:translate-y-0 group-focus-within:opacity-100";
  return (
    <div
      ref={drag}
      className={`relative z-0 isolate group overflow-visible p-1 transition-transform duration-200 hover:-translate-y-1 ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      }`}
      style={{
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <div
        className={`relative overflow-hidden rounded-lg border-2 ${currentTheme.border} ${taskSurfaceClassName} shadow-none transition-[box-shadow] duration-200 ${taskHoverShadowClassName}`}
      >
        <div className="px-4 py-4 pl-7">
          <div className="relative min-w-0">
            {hasStoryPoints && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`absolute right-0 top-0 flex shrink-0 items-center gap-1 font-medium ${currentTheme.textMuted}`}>
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">{storyPoints}</span>
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
                      <span className="text-xs font-medium">{taskTypeDisplay.label}</span>
                    </div>
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

              <h3
                title={title}
                className={`mb-4 truncate font-bold text-[15px] leading-tight ${currentTheme.text}`}
              >
                {priorityIndicator && (
                  <span className="sr-only">{priorityIndicator.label} priority. </span>
                )}
                {title}
              </h3>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div onMouseDown={(e) => e.stopPropagation()}>
                  <AssigneePopover
                    boardId={boardId}
                    currentAssignee={assignee}
                    onAssigneeChange={(newAssignee) => onAssigneeChange(id, newAssignee)}
                    availableAssignees={availableAssignees}
                    suggestedAssignees={suggestedAssignees}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className={revealActionsClassName}>
                  {canMoveToBacklog && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UtilityIconButton
                          onClick={() => onMoveToBacklog?.(id)}
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
                          onClick={() => onEdit(id)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-4 h-4" />
                        </UtilityIconButton>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>Edit task</TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <UtilityIconButton
                        onClick={() => onDelete(id, title)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </UtilityIconButton>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>Delete task</TooltipContent>
                  </Tooltip>
                </div>

                {footerAction}
              </div>
            </div>

            {showRestingDueDate && (
              <TaskDueDateBadge
                dueDate={dueDate}
                className="absolute bottom-0 right-0 px-1 py-1 transition-[opacity,transform] duration-200 ease-out group-hover:pointer-events-none group-hover:translate-y-1 group-hover:opacity-0 group-focus-within:pointer-events-none group-focus-within:translate-y-1 group-focus-within:opacity-0"
              />
            )}
          </div>
        </div>
        {priority ? <PriorityAccent priority={priority} isDarkMode={isDarkMode} /> : null}
      </div>
    </div>
  );
}
