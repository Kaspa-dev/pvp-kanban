import { KanbanCard } from "./KanbanCard";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { CheckCircle2, HelpCircle, TrendingUp } from "lucide-react";
import { Label } from "../utils/labels";
import { getXPForStoryPoints } from "../utils/gamification";
import { Card, Priority, TaskAssignee, TaskType } from "../utils/cards";
import { AppAvatar } from "./AppAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type HistoryCard = Card & {
  status: string;
  priority?: Priority;
  taskType?: TaskType;
};

interface HistoryViewProps {
  boardId: number;
  cards: HistoryCard[];
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
}

export function HistoryView({ 
  boardId,
  cards, 
  onAssigneeChange, 
  onDelete,
  onEdit, 
  onMoveToBacklog,
  availableAssignees,
  labels
}: HistoryViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceWidthClassName = "mx-auto w-full max-w-[1850px]";
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;

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
  }, {} as Record<string, HistoryCard[]>);

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className={`${workspaceWidthClassName} px-8 py-6 lg:px-10 xl:px-12`}>
        <div className="mb-6" data-coachmark="history-header">
          <div className="mb-2 flex items-center gap-2">
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>History</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="History overview help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Review finished work, scan delivery totals, and revisit completed tasks without affecting active workflow.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className={currentTheme.textSecondary}>Completed tasks and activity summary</p>
        </div>

        {/* Stats Cards - Compact Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {/* Total Completed Card */}
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Count of tasks currently marked as done on this board.
            </TooltipContent>
          </Tooltip>

          {/* Story Points Card */}
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Sum of story points across completed tasks.
            </TooltipContent>
          </Tooltip>

          {/* Total XP Card */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.border} shadow-sm p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-2xl font-bold ${currentTheme.text} leading-none mb-1`}>{totalXP}</p>
                    <p className={`text-xs font-medium ${currentTheme.textMuted} uppercase tracking-wider`}>Base XP Estimate</p>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Estimated XP earned from the completed work shown here.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Completed Tasks */}
        <div className={`${currentTheme.cardBg} rounded-2xl border-2 ${currentTheme.border} shadow-sm p-6`} data-coachmark="history-list">
          <div className="mb-4 flex items-center gap-2">
            <h2 className={`text-xl font-bold ${currentTheme.text}`}>Completed Tasks</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="Completed tasks help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Completed tasks are grouped by assignee so you can review who finished what most recently.
              </TooltipContent>
            </Tooltip>
          </div>
          
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
                    <AppAvatar
                      username={assigneeCards[0].assignee.username || assigneeCards[0].assignee.name}
                      fullName={assigneeCards[0].assignee.displayName || assigneeCards[0].assignee.name}
                      size={28}
                      className="shadow-sm"
                      interactive={false}
                      enableBlink={false}
                      aria-hidden="true"
                    />
                    <h3 className={`font-semibold ${currentTheme.text}`}>
                      {assigneeName} ({assigneeCards.length})
                    </h3>
                  </div>
                  <div className="space-y-3 ml-5">
                    {assigneeCards.map((card) => (
                      <KanbanCard
                        key={card.id}
                        boardId={boardId}
                        id={card.id}
                        title={card.title}
                        labelIds={card.labelIds}
                        assignee={card.assignee}
                        columnId="done"
                        onAssigneeChange={onAssigneeChange}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onMoveToBacklog={onMoveToBacklog}
                        availableAssignees={availableAssignees}
                        labels={labels}
                        storyPoints={card.storyPoints}
                        dueDate={card.dueDate}
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
