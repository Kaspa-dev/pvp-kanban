import { GripVertical, Trash2, Zap, Edit, FileText, Bug, Lightbulb, CheckSquare, CalendarDays } from "lucide-react";
import { useDrag } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { Label } from "../utils/labels";
import { useState } from "react";
import { Priority, TaskAssignee, TaskType } from "../utils/cards";
import { Tooltip } from "./Tooltip";
import { getPriorityColor, getPriorityIndicator } from "../utils/priorityColors";
import { format, parseISO } from "date-fns";

interface KanbanCardProps {
  id: number;
  title: string;
  labelIds: number[];
  assignee: TaskAssignee;
  columnId: string;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
  storyPoints?: number;
  dueDate?: string | null;
  priority?: Priority;
  taskType?: TaskType;
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
  availableAssignees,
  labels,
  storyPoints,
  dueDate,
  priority,
  taskType,
}: KanbanCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [showDelete, setShowDelete] = useState(false);

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

  return (
    <div
      ref={drag}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`relative ${currentTheme.cardBg} rounded-lg shadow-md transition-all duration-200 border-2 ${currentTheme.border} group ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      } hover:-translate-y-1 hover:shadow-2xl hover:${currentTheme.primaryBorder} overflow-hidden`}
      style={{
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {priority && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
          style={{ backgroundColor: getPriorityColor(priority, isDarkMode) }}
        />
      )}

      {showDelete && (
        <button
          onClick={() => onDelete(id, title)}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10 cursor-pointer"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-2 p-4 pl-5">
        <div
          className={`${currentTheme.textMuted} group-hover:${currentTheme.primaryText} pt-1 transition-colors pointer-events-none flex-shrink-0`}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          {(taskTypeDisplay || formattedDueDate || priorityIndicator) && (
            <div className={`flex items-center gap-2 mb-2 ${currentTheme.textMuted} flex-wrap`}>
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
                <Tooltip content={priorityIndicator.tooltip} position="top">
                  <div className="flex items-center gap-1 cursor-help">
                    <span className="text-sm">{priorityIndicator.emoji}</span>
                    <span className="text-xs font-medium">{priorityIndicator.label}</span>
                  </div>
                </Tooltip>
              )}
            </div>
          )}

          <h3 className={`${cardLabels.length > 0 ? "mb-3" : "mb-4"} font-bold text-[15px] ${currentTheme.text} line-clamp-2 leading-tight`}>
            {title}
          </h3>

          {cardLabels.length > 0 && (
            <div className="flex gap-1.5 mb-4 flex-wrap">
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

            <div className="flex items-center gap-2">
              {storyPoints !== undefined && storyPoints > 0 && (
                <div className={`flex items-center gap-1 font-medium ${currentTheme.textSecondary}`}>
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">{storyPoints}</span>
                </div>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`flex items-center gap-1 ${currentTheme.textMuted} hover:${currentTheme.primaryText} cursor-pointer transition-colors p-1 rounded hover:${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                  title="Edit task"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
