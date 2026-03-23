import { GripVertical, Trash2, Zap, Edit, AlertCircle, FileText, Bug, Lightbulb, CheckSquare } from "lucide-react";
import { useDrag } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { Label } from "../utils/labels";
import { useState } from "react";
import { Priority, TaskType } from "../utils/cards";
import { Tooltip } from "./Tooltip";
import { getPriorityColor, getPriorityIndicator } from "../utils/priorityColors";

interface Assignee {
  name: string;
  color: string;
}

interface KanbanCardProps {
  id: string;
  title: string;
  labelIds: string[];
  assignee: Assignee;
  columnId: string;
  onAssigneeChange: (cardId: string, assignee: Assignee | null) => void;
  onDelete: (cardId: string, title: string) => void;
  onEdit?: (cardId: string) => void;
  availableAssignees: Assignee[];
  labels: Label[];
  storyPoints?: number;
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
  priority,
  taskType
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

  // Get label objects from labelIds
  const cardLabels = labelIds
    .map(labelId => labels.find(l => l.id === labelId))
    .filter((label): label is Label => label !== undefined);

  // Get priority indicator
  const priorityIndicator = getPriorityIndicator(priority);

  // Get task type icon and label
  const getTaskTypeDisplay = () => {
    switch (taskType) {
      case 'story':
        return { icon: <FileText className="w-3.5 h-3.5" />, label: 'Story', emoji: '📖' };
      case 'bug':
        return { icon: <Bug className="w-3.5 h-3.5" />, label: 'Bug', emoji: '🐞' };
      case 'task':
        return { icon: <CheckSquare className="w-3.5 h-3.5" />, label: 'Task', emoji: '✓' };
      case 'spike':
        return { icon: <Lightbulb className="w-3.5 h-3.5" />, label: 'Spike', emoji: '⚡' };
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
      } hover:-translate-y-1 hover:shadow-2xl hover:border-purple-400 dark:hover:border-purple-600 overflow-hidden`}
      style={{
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Priority stripe on the left */}
      {priority && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
          style={{ backgroundColor: getPriorityColor(priority, isDarkMode) }}
        />
      )}

      {/* Delete button */}
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
        {/* Drag handle indicator */}
        <div
          className={`${currentTheme.textMuted} group-hover:${currentTheme.primaryText} pt-1 transition-colors pointer-events-none flex-shrink-0`}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Card content */}
        <div className="flex-1 min-w-0">
          {/* Task Type and Priority - subtle display above title */}
          {(taskTypeDisplay || priorityIndicator) && (
            <div className={`flex items-center gap-2 mb-2 ${currentTheme.textMuted} flex-wrap`}>
              {taskTypeDisplay && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{taskTypeDisplay.emoji}</span>
                  <span className="text-xs font-medium">{taskTypeDisplay.label}</span>
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

          {/* Task Title - most prominent */}
          <h3 className={`${cardLabels.length > 0 ? 'mb-3' : 'mb-4'} font-bold text-[15px] ${currentTheme.text} line-clamp-2 leading-tight`}>
            {title}
          </h3>
          
          {/* Labels - smaller pills */}
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
          
          {/* Bottom row: Assignee and Story Points */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Assignee avatar */}
              <div onMouseDown={(e) => e.stopPropagation()}>
                <AssigneePopover
                  currentAssignee={assignee}
                  onAssigneeChange={(newAssignee) => onAssigneeChange(id, newAssignee)}
                  availableAssignees={availableAssignees}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Story Points */}
              {storyPoints !== undefined && storyPoints > 0 && (
                <div className={`flex items-center gap-1 font-medium ${currentTheme.textSecondary}`}>
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">{storyPoints}</span>
                </div>
              )}
              
              {/* Edit button */}
              {onEdit && (
                <button
                  onClick={() => onEdit(id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`flex items-center gap-1 ${currentTheme.textMuted} hover:${currentTheme.primaryText} cursor-pointer transition-colors p-1 rounded hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
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