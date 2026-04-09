import { HelpCircle, User, X, Zap } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { Priority, TaskAssignee, TaskStatus, TaskType } from "../utils/cards";
import { PRIORITY_COLORS, getPriorityColor } from "../utils/priorityColors";
import { STORY_POINTS_MAX, STORY_POINTS_MIN, STORY_POINTS_OPTIONS } from "../utils/gamification";
import { Label } from "../utils/labels";
import { LabelSelector } from "./LabelSelector";
import { PriorityIcon } from "./PriorityIcon";
import { TaskDueDatePicker } from "./TaskDueDatePicker";
import { Tooltip } from "./Tooltip";

interface TaskFormModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  formIdPrefix: string;
  taskTitle: string;
  onTaskTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  showTitleError: boolean;
  submitError: string;
  availableLabels: Label[];
  selectedLabelIds: number[];
  onSelectedLabelIdsChange: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => Promise<void>;
  availableAssignees: TaskAssignee[];
  selectedAssignee: TaskAssignee | null;
  onSelectedAssigneeChange: (assignee: TaskAssignee | null) => void;
  status?: TaskStatus;
  onStatusChange?: (status: TaskStatus) => void;
  storyPoints?: number;
  customStoryPoints: string;
  onStoryPointsPresetClick: (points: number) => void;
  onCustomStoryPointsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  priority?: Priority;
  onPriorityChange: (priority: Priority | undefined) => void;
  taskType?: TaskType;
  onTaskTypeChange: (taskType: TaskType | undefined) => void;
}

export function TaskFormModal({
  isOpen,
  title,
  submitLabel,
  onClose,
  onSubmit,
  formIdPrefix,
  taskTitle,
  onTaskTitleChange,
  description,
  onDescriptionChange,
  showTitleError,
  submitError,
  availableLabels,
  selectedLabelIds,
  onSelectedLabelIdsChange,
  onCreateLabel,
  availableAssignees,
  selectedAssignee,
  onSelectedAssigneeChange,
  status,
  onStatusChange,
  storyPoints,
  customStoryPoints,
  onStoryPointsPresetClick,
  onCustomStoryPointsChange,
  dueDate,
  onDueDateChange,
  priority,
  onPriorityChange,
  taskType,
  onTaskTypeChange,
}: TaskFormModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const priorityOptions: Priority[] = ["low", "medium", "high", "critical"];
  const taskTypeOptions: TaskType[] = ["story", "task", "bug", "spike"];
  const selectedAssigneeOption =
    selectedAssignee && availableAssignees.some((assignee) => assignee.userId === selectedAssignee.userId)
      ? selectedAssignee
      : null;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-4xl p-8 mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor={`${formIdPrefix}-title`} className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Task title <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formIdPrefix}-title`}
              type="text"
              value={taskTitle}
              onChange={(event) => onTaskTitleChange(event.target.value)}
              placeholder="Enter task title..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text} ${
                showTitleError ? "border-red-500" : currentTheme.inputBorder
              }`}
              autoFocus
            />
            {showTitleError && (
              <p className="text-red-500 text-sm mt-1">Title is required</p>
            )}
          </div>

          {status && onStatusChange && (
            <div>
              <label htmlFor={`${formIdPrefix}-status`} className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                Status
              </label>
              <select
                id={`${formIdPrefix}-status`}
                value={status}
                onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
                className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all font-medium appearance-none`}
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="inProgress">In Progress</option>
                <option value="inReview">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor={`${formIdPrefix}-assignee`} className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Assignee
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.textMuted}`} />
              <select
                id={`${formIdPrefix}-assignee`}
                value={selectedAssigneeOption?.userId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  const assignee =
                    availableAssignees.find((candidate) => candidate.userId === Number(value)) ?? null;
                  onSelectedAssigneeChange(assignee);
                }}
                className={`w-full pl-10 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all font-medium appearance-none`}
              >
                <option value="">Unassigned</option>
                {availableAssignees.map((assignee) => (
                  <option key={assignee.userId} value={assignee.userId}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label htmlFor={`${formIdPrefix}-due-date`} className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                Due date
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => onDueDateChange("")}
                  className={`text-xs font-medium ${currentTheme.primaryText} hover:underline`}
                >
                  Clear
                </button>
              )}
            </div>
            <TaskDueDatePicker
              id={`${formIdPrefix}-due-date`}
              value={dueDate}
              onChange={onDueDateChange}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor={`${formIdPrefix}-description`} className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Description <span className={`${currentTheme.textMuted} font-normal`}>(optional)</span>
            </label>
            <textarea
              id={`${formIdPrefix}-description`}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Describe the task in detail... (supports multiple lines)"
              rows={6}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-y transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
            />
          </div>

          <LabelSelector
            availableLabels={availableLabels}
            selectedLabelIds={selectedLabelIds}
            onLabelsChange={onSelectedLabelIdsChange}
            onCreateLabel={onCreateLabel}
          />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Story Points
              </label>
              <Tooltip content="Estimate the complexity of the task. Higher points mean more complex work.">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="relative">
              <Zap className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
              <input
                type="number"
                min={STORY_POINTS_MIN}
                max={STORY_POINTS_MAX}
                value={customStoryPoints}
                onChange={onCustomStoryPointsChange}
                className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
                placeholder="Or enter custom value (1-100)"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STORY_POINTS_OPTIONS.map((points) => {
                const isSelected = storyPoints === points;
                return (
                  <button
                    key={points}
                    type="button"
                    onClick={() => onStoryPointsPresetClick(points)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {points}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                Priority
              </label>
              <Tooltip content="Indicates how urgent the task is. Critical tasks should be completed first.">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((value) => {
                const isSelected = priority === value;
                const priorityConfig = PRIORITY_COLORS[value];
                const textColor = isSelected && value === "critical"
                  ? (isDarkMode ? "text-gray-900" : "text-white")
                  : isSelected
                    ? "text-white"
                    : "";
                const selectedIconColor = value === "critical" && isDarkMode ? "#111827" : "#ffffff";

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onPriorityChange(isSelected ? undefined : value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? `${textColor} shadow-md`
                        : `${isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`
                    }`}
                    style={isSelected ? { backgroundColor: getPriorityColor(value, isDarkMode) } : undefined}
                  >
                    <PriorityIcon
                      priority={value}
                      isDarkMode={isDarkMode}
                      className="w-3.5 h-3.5"
                      colorOverride={isSelected ? selectedIconColor : undefined}
                    />
                    <span>{priorityConfig.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Task Type
              </label>
              <Tooltip content="Defines the nature of the work: Story, Task, Bug, or Spike.">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2">
              {taskTypeOptions.map((value) => {
                const isSelected = taskType === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onTaskTypeChange(isSelected ? undefined : value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg`}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
