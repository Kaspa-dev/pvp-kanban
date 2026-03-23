import { Trash2, Zap, Edit, FileText, Bug, Lightbulb, CheckSquare } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { Label } from "../utils/labels";
import { Tooltip } from "./Tooltip";
import { getPriorityColor, getPriorityIndicator } from "../utils/priorityColors";
import { Card, Priority, TaskType } from "../utils/cards";

type ListCard = Card & {
  priority?: Priority;
  taskType?: TaskType;
};

interface ListViewProps {
  cards: ListCard[];
  onAssigneeChange: (cardId: string, assignee: { name: string; color: string } | null) => void;
  onDelete: (cardId: string, title: string) => void;
  onEdit?: (cardId: string) => void;
  availableAssignees: { name: string; color: string }[];
  labels: Label[];
}

export function ListView({ cards, onAssigneeChange, onDelete, onEdit, availableAssignees, labels }: ListViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; class: string } } = {
      todo: { label: "To Do", class: currentTheme.badge.todo },
      inProgress: { label: "In Progress", class: currentTheme.badge.inProgress },
      inReview: { label: "In Review", class: currentTheme.badge.inReview },
      done: { label: "Done", class: currentTheme.badge.done },
      backlog: { label: "Backlog", class: currentTheme.badge.backlog },
    };
    const statusInfo = statusMap[status] || statusMap.todo;
    return (
      <span className={`px-3 py-1 ${statusInfo.class} text-white rounded-full text-xs font-bold`}>
        {statusInfo.label}
      </span>
    );
  };

  const getCardLabels = (labelIds: string[]) => {
    return labelIds
      .map(labelId => labels.find(l => l.id === labelId))
      .filter((label): label is Label => label !== undefined);
  };

  // Get task type display
  const getTaskTypeDisplay = (taskType?: TaskType) => {
    switch (taskType) {
      case 'story':
        return { emoji: '📖', label: 'Story' };
      case 'bug':
        return { emoji: '🐞', label: 'Bug' };
      case 'task':
        return { emoji: '✓', label: 'Task' };
      case 'spike':
        return { emoji: '⚡', label: 'Spike' };
      default:
        return null;
    }
  };

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
        <div className={`${currentTheme.cardBg} rounded-2xl border-2 ${currentTheme.border} shadow-sm overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={`${currentTheme.bgSecondary} border-b-2 ${currentTheme.border}`}>
              <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider w-12`}>
                Priority
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider`}>
                Title
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider`}>
                Status
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider`}>
                Labels
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider`}>
                Assignee
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider`}>
                Story Points
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${currentTheme.border}`}>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={7} className={`px-6 py-12 text-center ${currentTheme.textMuted}`}>
                  No tasks found
                </td>
              </tr>
            ) : (
              cards.map((card) => {
                const cardLabels = getCardLabels(card.labelIds);
                const taskTypeDisplay = getTaskTypeDisplay(card.taskType);
                const priorityIndicator = getPriorityIndicator(card.priority);
                return (
                  <tr key={card.id} className={`hover:${currentTheme.bgSecondary} transition-colors ${currentTheme.border} border-b`}>
                    <td className="px-6 py-4">
                      {card.priority ? (
                        <Tooltip content={priorityIndicator?.tooltip || card.priority} position="right">
                          <div 
                            className="w-1.5 h-10 rounded-full cursor-help"
                            style={{ backgroundColor: getPriorityColor(card.priority, isDarkMode) }}
                          />
                        </Tooltip>
                      ) : (
                        <div className="w-1.5 h-10" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {(taskTypeDisplay || priorityIndicator) && (
                          <div className={`flex items-center gap-2 ${currentTheme.textMuted} flex-wrap`}>
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
                        <div className={`font-bold text-[15px] ${currentTheme.text}`}>{card.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(card.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {cardLabels.length > 0 ? (
                          cardLabels.map((label) => (
                            <span
                              key={label.id}
                              className="px-2 py-0.5 rounded-md text-xs font-medium text-white"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                          ))
                        ) : (
                          <span className={`${currentTheme.textMuted} text-sm`}>-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <AssigneePopover
                        currentAssignee={card.assignee}
                        onAssigneeChange={(newAssignee) => onAssigneeChange(card.id, newAssignee)}
                        availableAssignees={availableAssignees}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {card.storyPoints ? (
                        <div className={`flex items-center gap-1.5 font-medium ${currentTheme.textSecondary}`}>
                          <Zap className="w-4 h-4" />
                          <span className="text-sm">{card.storyPoints}</span>
                        </div>
                      ) : (
                        <span className={`${currentTheme.textMuted} text-sm`}>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(card.id)}
                            className={`${currentTheme.textMuted} hover:${currentTheme.primaryText} p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Edit task"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(card.id, card.title)}
                          className={`text-red-500 hover:text-red-700 p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-red-950' : 'hover:bg-red-50'}`}
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
