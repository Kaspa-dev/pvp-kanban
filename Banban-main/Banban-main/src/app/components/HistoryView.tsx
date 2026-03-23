import { KanbanCard } from "./KanbanCard";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { Label } from "../utils/labels";
import { getXPForStoryPoints } from "../utils/gamification";

interface Card {
  id: string;
  title: string;
  labelIds: string[];
  assignee: {
    name: string;
    color: string;
  };
  dueDate: string;
  storyPoints?: number;
  status: string;
  priority?: string;
  taskType?: string;
}

interface HistoryViewProps {
  cards: Card[];
  onAssigneeChange: (cardId: string, assignee: { name: string; color: string } | null) => void;
  onDelete: (cardId: string, title: string) => void;
  onEdit?: (cardId: string) => void;
  availableAssignees: { name: string; color: string }[];
  labels: Label[];
}

export function HistoryView({ 
  cards, 
  onAssigneeChange, 
  onDelete,
  onEdit, 
  availableAssignees,
  labels
}: HistoryViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  // Filter to only show completed tasks
  const completedCards = cards.filter(card => card.status === "done");

  // Calculate stats
  const totalXP = completedCards.reduce((sum, card) => sum + (card.storyPoints ? getXPForStoryPoints(card.storyPoints) : 0), 0);
  const totalStoryPoints = completedCards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);

  // Group by assignee
  const cardsByAssignee = completedCards.reduce((acc, card) => {
    const assigneeName = card.assignee.name;
    if (!acc[assigneeName]) {
      acc[assigneeName] = [];
    }
    acc[assigneeName].push(card);
    return acc;
  }, {} as Record<string, Card[]>);

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>History</h1>
          <p className={currentTheme.textSecondary}>Completed tasks and activity summary</p>
        </div>

        {/* Stats Cards - Compact Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {/* Total Completed Card */}
          <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.border} shadow-sm p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-2xl font-bold ${currentTheme.text} leading-none mb-1`}>{completedCards.length}</p>
                <p className={`text-xs font-medium ${currentTheme.textMuted} uppercase tracking-wider`}>Total Completed</p>
              </div>
            </div>
          </div>

          {/* Story Points Card */}
          <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.border} shadow-sm p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-2xl font-bold ${currentTheme.text} leading-none mb-1`}>{totalStoryPoints}</p>
                <p className={`text-xs font-medium ${currentTheme.textMuted} uppercase tracking-wider`}>Story Points</p>
              </div>
            </div>
          </div>

          {/* Total XP Card */}
          <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.border} shadow-sm p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-2xl font-bold ${currentTheme.text} leading-none mb-1`}>{totalXP}</p>
                <p className={`text-xs font-medium ${currentTheme.textMuted} uppercase tracking-wider`}>Total XP Earned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className={`${currentTheme.cardBg} rounded-2xl border-2 ${currentTheme.border} shadow-sm p-6`}>
          <h2 className={`text-xl font-bold ${currentTheme.text} mb-4`}>Completed Tasks</h2>
          
          {completedCards.length === 0 ? (
            <div className={`text-center py-16 ${currentTheme.textMuted}`}>
              <CheckCircle2 className={`w-16 h-16 mx-auto mb-4 opacity-30`} />
              <p className="text-lg mb-2">No completed tasks yet</p>
              <p className="text-sm">Tasks moved to "Done" will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(cardsByAssignee).map(([assigneeName, assigneeCards]) => (
                <div key={assigneeName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: assigneeCards[0].assignee.color }}
                    />
                    <h3 className={`font-semibold ${currentTheme.text}`}>
                      {assigneeName} ({assigneeCards.length})
                    </h3>
                  </div>
                  <div className="space-y-3 ml-5">
                    {assigneeCards.map((card) => (
                      <KanbanCard
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        labelIds={card.labelIds}
                        assignee={card.assignee}
                        columnId="done"
                        onAssigneeChange={onAssigneeChange}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        availableAssignees={availableAssignees}
                        labels={labels}
                        storyPoints={card.storyPoints}
                        priority={card.priority}
                        taskType={card.taskType}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}