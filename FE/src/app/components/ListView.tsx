import { Trash2, Zap, Edit, FileText, Bug, Lightbulb, CheckSquare, CalendarDays, Undo2 } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { Label } from "../utils/labels";
import { getPriorityIndicator } from "../utils/priorityColors";
import { Card, Priority, TaskAssignee, TaskType } from "../utils/cards";
import { format, parseISO } from "date-fns";
import { PriorityBadge } from "./PriorityBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ListCard = Card & {
  priority?: Priority;
  taskType?: TaskType;
};

interface ListViewProps {
  cards: ListCard[];
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
}

export function ListView({ cards, onAssigneeChange, onDelete, onEdit, onMoveToBacklog, availableAssignees, labels }: ListViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; class: string } } = {
      todo: { label: "To Do", class: currentTheme.badge.todo },
      inProgress: { label: "In Progress", class: currentTheme.badge.inProgress },
      inReview: { label: "In Review", class: currentTheme.badge.inReview },
      done: { label: "Done", class: currentTheme.badge.done },
      backlog: { label: "Staging", class: currentTheme.badge.backlog },
    };

    const statusInfo = statusMap[status] || statusMap.todo;

    return (
      <span className={`px-3 py-1 ${statusInfo.class} text-white rounded-full text-xs font-bold`}>
        {statusInfo.label}
      </span>
    );
  };

  const getCardLabels = (labelIds: number[]) => {
    return labelIds
      .map((labelId) => labels.find((label) => label.id === labelId))
      .filter((label): label is Label => label !== undefined);
  };

  const getTaskTypeDisplay = (taskType?: TaskType) => {
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

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
        <div className={`${currentTheme.cardBg} rounded-2xl border-2 ${currentTheme.border} shadow-sm overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={`${currentTheme.bgSecondary} border-b-2 ${currentTheme.border}`}>
                <th className={`px-6 py-4 text-left text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider w-32`}>
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
                  const formattedDueDate = card.dueDate ? format(parseISO(card.dueDate), "MMM d") : null;

                  return (
                    <tr key={card.id} className={`hover:${currentTheme.bgSecondary} transition-colors ${currentTheme.border} border-b`}>
                      <td className="px-6 py-4">
                        {card.priority ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <PriorityBadge priority={card.priority} isDarkMode={isDarkMode} compact />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                              {priorityIndicator?.tooltip || card.priority}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className={`${currentTheme.textMuted} text-sm`}>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {(taskTypeDisplay || formattedDueDate) && (
                            <div className={`flex items-center gap-2 ${currentTheme.textMuted} flex-wrap`}>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`flex items-center gap-1.5 font-medium ${currentTheme.textSecondary}`}>
                                <Zap className="w-4 h-4" />
                                <span className="text-sm">{card.storyPoints}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>{card.storyPoints} story points</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className={`${currentTheme.textMuted} text-sm`}>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {onMoveToBacklog && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onMoveToBacklog(card.id)}
                                  className={`${currentTheme.textMuted} hover:${currentTheme.primaryText} p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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
                                  onClick={() => onEdit(card.id)}
                                  className={`${currentTheme.textMuted} hover:${currentTheme.primaryText} p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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
                                onClick={() => onDelete(card.id, card.title)}
                                className={`text-red-500 hover:text-red-700 p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-red-950' : 'hover:bg-red-50'}`}
                                type="button"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Delete task</TooltipContent>
                          </Tooltip>
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
