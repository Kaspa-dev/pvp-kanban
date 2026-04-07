import { KanbanCard } from "./KanbanCard";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Plus, Play, Calendar, CheckSquare, Target, Archive, Zap, Check } from "lucide-react";
import { Label } from "../utils/labels";
import { Sprint } from "../utils/sprints";
import { Card, TaskAssignee } from "../utils/cards";

interface BacklogViewProps {
  backlogCards: Card[];
  sprintCards: Card[];
  activeSprint: Sprint | null;
  plannedSprint: Sprint | null;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onAddToSprint: (cardId: number) => void;
  onRemoveFromSprint: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
  onCreateSprint: () => void;
  onStartSprint: () => void;
  onCompleteSprint?: () => void;
  onCreateTask: () => void;
}

export function BacklogView2({
  backlogCards,
  sprintCards,
  activeSprint,
  plannedSprint,
  onAssigneeChange,
  onDelete,
  onEdit,
  onAddToSprint,
  onRemoveFromSprint,
  availableAssignees,
  labels,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint,
  onCreateTask,
}: BacklogViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const sprintPoints = sprintCards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className="w-full max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Backlog</h1>
            <button
              onClick={onCreateTask}
              className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all`}
            >
              <Plus className="w-5 h-5" />
              New Task
            </button>
          </div>
          <p className={`text-base ${currentTheme.textMuted}`}>
            Plan and organize unscheduled tasks. Create a sprint and add tasks to begin work.
          </p>
        </div>

        {!activeSprint && (
          <div
            className={`${currentTheme.cardBg} rounded-xl border-2 ${
              plannedSprint ? currentTheme.primaryBorder : currentTheme.border
            } overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${currentTheme.border} ${
              plannedSprint ? `bg-gradient-to-r ${currentTheme.primarySoft}` : currentTheme.bgSecondary
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${
                    plannedSprint ? `bg-gradient-to-br ${currentTheme.primary}` : currentTheme.bgTertiary
                  } flex items-center justify-center`}>
                    <Target className={`w-5 h-5 ${plannedSprint ? 'text-white' : currentTheme.textMuted}`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${currentTheme.text}`}>
                      {plannedSprint ? plannedSprint.name : "Sprint Planning"}
                    </h2>
                    <p className={`text-sm ${currentTheme.textMuted}`}>
                      {plannedSprint
                        ? `${sprintCards.length} tasks - ${sprintPoints} story points`
                        : "No sprint created yet"}
                    </p>
                  </div>
                </div>
                {plannedSprint ? (
                  <button
                    onClick={onStartSprint}
                    disabled={sprintCards.length === 0}
                    className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Play className="w-5 h-5" />
                    Start Sprint
                  </button>
                ) : (
                  <button
                    onClick={onCreateSprint}
                    className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all`}
                  >
                    <Plus className="w-5 h-5" />
                    Create Sprint
                  </button>
                )}
              </div>
            </div>

            {plannedSprint && (
              <div className={`px-6 py-4 border-b ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${currentTheme.textMuted}`} />
                    <span className={`text-sm ${currentTheme.textSecondary}`}>
                      {new Date(plannedSprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" - "}
                      {new Date(plannedSprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className={`w-4 h-4 ${currentTheme.textMuted}`} />
                    <span className={`text-sm ${currentTheme.textSecondary}`}>
                      {sprintCards.length} {sprintCards.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${currentTheme.textMuted}`} />
                    <span className={`text-sm ${currentTheme.textSecondary}`}>
                      {sprintPoints} story points
                    </span>
                  </div>
                </div>
              </div>
            )}

            {plannedSprint && (
              <div className="p-6">
                {sprintCards.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className={`w-12 h-12 ${currentTheme.textMuted} mx-auto mb-3`} />
                    <p className={`text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                      No tasks in sprint
                    </p>
                    <p className={`text-xs ${currentTheme.textMuted}`}>
                      Drag tasks from backlog below to add them to this sprint
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sprintCards.map((card) => (
                      <div key={card.id} className="relative group">
                        <KanbanCard
                          id={card.id}
                          title={card.title}
                          labelIds={card.labelIds}
                          assignee={card.assignee}
                          columnId="sprint"
                          onAssigneeChange={onAssigneeChange}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          availableAssignees={availableAssignees}
                          labels={labels}
                          storyPoints={card.storyPoints}
                          dueDate={card.dueDate}
                          priority={card.priority}
                          taskType={card.taskType}
                        />
                        <button
                          onClick={() => onRemoveFromSprint(card.id)}
                          className={`absolute -right-2 -top-2 px-3 py-1.5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border rounded-lg text-xs font-medium ${currentTheme.textSecondary} opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow-md`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSprint && (
          <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.border} p-6`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center`}>
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>
                  Sprint "{activeSprint.name}" is Active
                </h3>
                <p className={`text-sm ${currentTheme.textMuted}`}>
                  View and manage tasks in Board or List view. Create a new sprint after completing the current one.
                </p>
              </div>
              {onCompleteSprint && (
                <button
                  onClick={onCompleteSprint}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Complete Sprint
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.border} overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${currentTheme.border} ${currentTheme.bgSecondary}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${currentTheme.bgTertiary} flex items-center justify-center`}>
                  <Archive className={`w-5 h-5 ${currentTheme.textMuted}`} />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${currentTheme.text}`}>Backlog</h2>
                  <p className={`text-sm ${currentTheme.textMuted}`}>
                    {backlogCards.length} unscheduled {backlogCards.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {backlogCards.length === 0 ? (
              <div className="text-center py-16">
                <Archive className={`w-16 h-16 ${currentTheme.textMuted} mx-auto mb-4`} />
                <h3 className={`text-lg font-semibold ${currentTheme.textSecondary} mb-2`}>
                  No tasks in backlog
                </h3>
                <p className={`text-sm ${currentTheme.textMuted} mb-6`}>
                  Create tasks to populate your backlog and start planning
                </p>
                <button
                  onClick={onCreateTask}
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all`}
                >
                  <Plus className="w-5 h-5" />
                  Create First Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {backlogCards.map((card) => (
                  <div key={card.id} className="relative group">
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
                      dueDate={card.dueDate}
                      priority={card.priority}
                      taskType={card.taskType}
                    />
                    {plannedSprint && !activeSprint && (
                      <button
                        onClick={() => onAddToSprint(card.id)}
                        className={`absolute -right-2 -top-2 px-3 py-1.5 bg-gradient-to-r ${currentTheme.primary} text-white rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:shadow-lg hover:scale-105`}
                      >
                        Add to Sprint
                      </button>
                    )}
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
