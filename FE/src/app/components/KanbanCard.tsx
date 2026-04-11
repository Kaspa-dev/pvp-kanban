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

interface KanbanCardProps {
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
  const hasTopMeta = Boolean(taskTypeDisplay || formattedDueDate || priorityIndicator);
  const canMoveToBacklog = columnId !== "backlog" && columnId !== "queue" && Boolean(onMoveToBacklog);
  const actionButtonClassName = `${currentTheme.textMuted} hover:${currentTheme.primaryText} cursor-pointer transition-colors p-1 rounded hover:${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`;
  const deleteButtonClassName = actionButtonClassName;

  return (
    <div
      ref={drag}
      className={`relative group overflow-visible ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      }`}
      style={{
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <div
        className={`overflow-hidden rounded-lg border-2 ${currentTheme.border} ${currentTheme.cardBg} shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:${currentTheme.primaryBorder}`}
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
                <div className={`mb-2 flex min-w-0 items-center gap-2 flex-wrap ${currentTheme.textMuted}`}>
                  {taskTypeDisplay && (
                    <div className="flex items-center gap-1.5">
                      {taskTypeDisplay.icon}
                      <span className="text-xs font-medium">{taskTypeDisplay.label}</span>
                    </div>
                  )}
                  {formattedDueDate && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{formattedDueDate}</span>
                    </div>
                  )}
                  {priorityIndicator && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <PriorityBadge priority={priority!} isDarkMode={isDarkMode} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>{priorityIndicator.tooltip}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}

              <h3
                title={title}
                className={`${cardLabels.length > 0 ? "mb-3" : "mb-4"} truncate font-bold text-[15px] leading-tight ${currentTheme.text}`}
              >
                {title}
              </h3>

              {cardLabels.length > 0 && (
                <div className="mb-4 flex gap-1.5 flex-wrap">
                  {cardLabels.map((label) => (
                    <span
                      key={label.id}
                      className="px-2 py-0.5 rounded-md text-xs font-medium text-white pointer-events-none"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div onMouseDown={(e) => e.stopPropagation()}>
                  <AssigneePopover
                    currentAssignee={assignee}
                    onAssigneeChange={(newAssignee) => onAssigneeChange(id, newAssignee)}
                    availableAssignees={availableAssignees}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {storyPoints !== undefined && storyPoints > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center gap-1 font-medium ${currentTheme.textSecondary}`}>
                        <Zap className="w-4 h-4" />
                        <span className="text-sm">{storyPoints}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>{storyPoints} story points</TooltipContent>
                  </Tooltip>
                )}

                {canMoveToBacklog && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onMoveToBacklog?.(id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={actionButtonClassName}
                        type="button"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>Move to staging</TooltipContent>
                  </Tooltip>
                )}

                {onEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={actionButtonClassName}
                        type="button"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>Edit task</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDelete(id, title)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={deleteButtonClassName}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
