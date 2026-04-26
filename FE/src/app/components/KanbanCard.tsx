import { GripVertical, Trash2, Zap, Edit, FileText, Bug, Lightbulb, CheckSquare, CalendarDays, Undo2 } from "lucide-react";
import { useDrag } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { Label } from "../utils/labels";
import { ReactNode } from "react";
import { Priority, TaskAssignee, TaskType } from "../utils/cards";
import { getPriorityIndicator } from "../utils/priorityColors";
import { format, parseISO } from "date-fns";
import { PriorityBadge } from "./PriorityBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TaskLabelSummary } from "./TaskLabelSummary";
import { UtilityIconButton } from "./UtilityIconButton";

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
  const formattedDueDate = dueDate ? format(parseISO(dueDate), "MMM d") : null;

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
  const hasTopMeta = Boolean(storyPoints || cardLabels.length > 0 || taskTypeDisplay || formattedDueDate || priorityIndicator);
  const canMoveToBacklog = columnId !== "backlog" && columnId !== "queue" && Boolean(onMoveToBacklog);
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
        <div className="flex items-start gap-2 p-4">
          <div
            className={`${currentTheme.textMuted} group-hover:${currentTheme.primaryText} pt-1 transition-colors pointer-events-none flex-shrink-0`}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="relative flex-1 min-w-0">
            <div>
              {hasTopMeta && (
                <div className={`mb-2 flex min-w-0 items-center gap-2 overflow-hidden ${currentTheme.textMuted}`}>
                  {storyPoints !== undefined && storyPoints > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`flex shrink-0 items-center gap-1 font-medium ${currentTheme.textMuted}`}>
                          <Zap className="h-4 w-4" />
                          <span className="text-sm">{storyPoints}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>{storyPoints} story points</TooltipContent>
                    </Tooltip>
                  )}
                  {taskTypeDisplay && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {taskTypeDisplay.icon}
                      <span className="text-xs font-medium">{taskTypeDisplay.label}</span>
                    </div>
                  )}
                  {formattedDueDate && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{formattedDueDate}</span>
                    </div>
                  )}
                  {priorityIndicator && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="shrink-0 cursor-help">
                          <PriorityBadge priority={priority!} isDarkMode={isDarkMode} variant="card" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>{priorityIndicator.tooltip}</TooltipContent>
                    </Tooltip>
                  )}
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
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
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

                {footerAction}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
