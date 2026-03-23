import { KanbanCard } from "./KanbanCard";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { MoveRight, MoveDown, MoveUp, Zap, Calendar, Edit2, HelpCircle } from "lucide-react";
import { Label } from "../utils/labels";
import { Card, Priority, TaskType } from "../utils/cards";
import { useDrop } from "react-dnd";
import { Tooltip } from "./Tooltip";

type BacklogCard = Card & {
  inSprint?: boolean;
  status?: string;
  priority?: Priority;
  taskType?: TaskType;
};

interface BacklogViewProps {
  cards: BacklogCard[];
  onAssigneeChange: (cardId: string, assignee: { name: string; color: string } | null) => void;
  onDelete: (cardId: string, title: string) => void;
  onEdit?: (cardId: string) => void;
  onMoveToTodo: (cardId: string) => void;
  onMoveToSprint: (cardId: string) => void;
  onMoveToBacklog: (cardId: string) => void;
  availableAssignees: { name: string; color: string }[];
  labels: Label[];
  sprint?: {
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  onEditSprint?: () => void;
}

export function BacklogView({ 
  cards, 
  onAssigneeChange, 
  onDelete,
  onEdit, 
  onMoveToTodo,
  onMoveToSprint,
  onMoveToBacklog,
  availableAssignees,
  labels,
  sprint,
  onEditSprint
}: BacklogViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  // Separate cards into sprint and backlog
  const sprintCards = cards.filter(card => card.inSprint);
  const backlogCards = cards.filter(card => !card.inSprint);

  // Calculate sprint stats
  const sprintPoints = sprintCards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);

  // Drop zone for Sprint section
  const [{ isOverSprint }, dropSprint] = useDrop({
    accept: "CARD",
    drop: (item: { id: string; columnId: string }) => {
      const card = cards.find(c => c.id === item.id);
      if (card && !card.inSprint) {
        onMoveToSprint(item.id);
      }
    },
    collect: (monitor) => ({
      isOverSprint: monitor.isOver(),
    }),
  });

  // Drop zone for Backlog section
  const [{ isOverBacklog }, dropBacklog] = useDrop({
    accept: "CARD",
    drop: (item: { id: string; columnId: string }) => {
      const card = cards.find(c => c.id === item.id);
      if (card && card.inSprint) {
        onMoveToBacklog(item.id);
      }
    },
    collect: (monitor) => ({
      isOverBacklog: monitor.isOver(),
    }),
  });

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className="w-full max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        
        {/* Sprint Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Zap className={`w-6 h-6 ${currentTheme.primaryText}`} />
                <h2 className={`text-2xl font-bold ${currentTheme.text}`}>
                  {sprint ? sprint.name : "Active Sprint"}
                </h2>
                <Tooltip content="Sprint contains tasks to complete within the sprint timeline. Drag tasks here to plan your sprint." position="right">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </div>
              <p className={currentTheme.textSecondary}>
                {sprintCards.length} tasks • {sprintPoints} story points
              </p>
              {sprint && (
                <div className={`flex items-center gap-4 mt-2 ${currentTheme.textMuted} text-sm`}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Started: {new Date(sprint.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Ends: {new Date(sprint.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md ${currentTheme.bgTertiary}`}>
                    {Math.ceil((new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                  </div>
                </div>
              )}
            </div>
            {onEditSprint && (
              <button
                onClick={onEditSprint}
                className={`px-4 py-2 ${currentTheme.bgTertiary} ${currentTheme.text} font-medium rounded-xl hover:scale-105 transition-all shadow-sm flex items-center gap-2`}
                title="Edit Sprint"
              >
                <Edit2 className="w-4 h-4" />
                <span className="text-sm">Edit Sprint</span>
              </button>
            )}
          </div>

          <div 
            ref={dropSprint}
            className={`${currentTheme.cardBg} rounded-2xl border-2 shadow-sm p-6 transition-all ${
              isOverSprint 
                ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring} scale-[1.01]` 
                : currentTheme.border
            }`}
          >
            {sprintCards.length === 0 ? (
              <div className={`text-center py-12 ${currentTheme.textMuted}`}>
                <Zap className={`w-12 h-12 mx-auto mb-3 opacity-30`} />
                <p className="text-lg mb-1">No tasks in sprint</p>
                <p className="text-sm">Drag tasks from backlog to sprint to start planning.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sprintCards.map((card) => (
                  <div key={card.id} className="flex items-start gap-3 group">
                    <div className="flex-1">
                      <KanbanCard
                        id={card.id}
                        title={card.title}
                        labelIds={card.labelIds}
                        assignee={card.assignee}
                        columnId={card.status}
                        onAssigneeChange={onAssigneeChange}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        availableAssignees={availableAssignees}
                        labels={labels}
                        storyPoints={card.storyPoints}
                        priority={card.priority}
                        taskType={card.taskType}
                      />
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onMoveToTodo(card.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`mt-2 px-4 py-2 bg-gradient-to-r ${currentTheme.primary} text-white font-medium rounded-xl hover:scale-105 transition-all shadow-md flex items-center gap-2`}
                        title="Start Task"
                      >
                        <span className="text-sm">Start</span>
                        <MoveRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onMoveToBacklog(card.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`px-4 py-2 ${currentTheme.bgTertiary} ${currentTheme.text} font-medium rounded-xl hover:scale-105 transition-all shadow-sm flex items-center gap-2`}
                        title="Move to Backlog"
                      >
                        <MoveDown className="w-4 h-4" />
                        <span className="text-sm">Backlog</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Backlog Section */}
        <div>
          <div className="mb-4">
            <h2 className={`text-2xl font-bold ${currentTheme.text} mb-1`}>Backlog</h2>
            <p className={currentTheme.textSecondary}>
              {backlogCards.length} tasks waiting to be planned
            </p>
          </div>

          <div 
            ref={dropBacklog}
            className={`${currentTheme.cardBg} rounded-2xl border-2 shadow-sm p-6 transition-all ${
              isOverBacklog 
                ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring} scale-[1.01]` 
                : currentTheme.border
            }`}
          >
            {backlogCards.length === 0 ? (
              <div className={`text-center py-12 ${currentTheme.textMuted}`}>
                <p className="text-lg mb-1">No tasks in backlog</p>
                <p className="text-sm">Create a new task to add it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {backlogCards.map((card) => (
                  <div key={card.id} className="flex items-start gap-3 group">
                    <div className="flex-1">
                      <KanbanCard
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
                        priority={card.priority}
                        taskType={card.taskType}
                      />
                    </div>
                    <button
                      onClick={() => onMoveToSprint(card.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`mt-2 px-4 py-2 ${currentTheme.bgTertiary} ${currentTheme.text} font-medium rounded-xl hover:scale-105 transition-all shadow-sm flex items-center gap-2 opacity-0 group-hover:opacity-100`}
                      title="Add to Sprint"
                    >
                      <MoveUp className="w-4 h-4" />
                      <span className="text-sm">Add to Sprint</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
