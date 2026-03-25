import { X, User, Zap, CalendarDays, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { STORY_POINTS_OPTIONS } from "../utils/gamification";
import { LabelSelector } from "./LabelSelector";
import { Label } from "../utils/labels";
import { Priority, TaskType } from "../utils/cards";
import { Tooltip } from "./Tooltip";
import { getPriorityColor, PRIORITY_COLORS } from "../utils/priorityColors";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: {
    title: string;
    description: string;
    status: "todo" | "inProgress" | "inReview" | "done" | "backlog";
    labelIds: string[];
    assignee: {
      name: string;
      color: string;
    };
    storyPoints?: number;
    dueDate?: string | null;
    priority?: Priority;
    taskType?: TaskType;
  }) => void;
  availableLabels: Label[];
  onCreateLabel: (name: string, color: string) => void;
  availableAssignees: { name: string; color: string }[];
}

export function AddCardModal({
  isOpen,
  onClose,
  onAdd,
  availableLabels,
  onCreateLabel,
  availableAssignees,
}: AddCardModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState(availableAssignees[0]);
  const [showError, setShowError] = useState(false);
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [taskType, setTaskType] = useState<TaskType | undefined>(undefined);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedLabelIds([]);
    setSelectedAssignee(availableAssignees[0]);
    setShowError(false);
    setStoryPoints(undefined);
    setDueDate("");
    setPriority(undefined);
    setTaskType(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setShowError(true);
      return;
    }

    onAdd({
      title,
      description,
      status: "backlog",
      labelIds: selectedLabelIds,
      assignee: selectedAssignee,
      storyPoints,
      dueDate: dueDate || null,
      priority,
      taskType,
    });

    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const priorityOptions: Priority[] = ["low", "medium", "high", "critical"];
  const taskTypeOptions: TaskType[] = ["story", "task", "bug", "spike"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCancel}
      />

      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-lg p-8 mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Add new task</h2>
          <button
            onClick={handleCancel}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Task title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (showError && e.target.value.trim()) {
                  setShowError(false);
                }
              }}
              placeholder="Enter task title..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text} ${
                showError ? "border-red-500" : currentTheme.inputBorder
              }`}
              autoFocus
            />
            {showError && (
              <p className="text-red-500 text-sm mt-1">Title is required</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Description <span className={`${currentTheme.textMuted} font-normal`}>(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in detail... (supports multiple lines)"
              rows={6}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-y transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
            />
          </div>

          <LabelSelector
            availableLabels={availableLabels}
            selectedLabelIds={selectedLabelIds}
            onLabelsChange={setSelectedLabelIds}
            onCreateLabel={onCreateLabel}
          />

          <div>
            <label htmlFor="assignee" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Assignee
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.textMuted}`} />
              <select
                id="assignee"
                value={selectedAssignee.name}
                onChange={(e) => {
                  const assignee = availableAssignees.find((a) => a.name === e.target.value);
                  if (assignee) setSelectedAssignee(assignee);
                }}
                className={`w-full pl-10 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all font-medium appearance-none`}
              >
                {availableAssignees.map((assignee) => (
                  <option key={assignee.name} value={assignee.name}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label htmlFor="dueDate" className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                Due date
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className={`text-xs font-medium ${currentTheme.primaryText} hover:underline`}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <CalendarDays className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.textMuted}`} />
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Story Points
              </label>
              <Tooltip content="Estimate the complexity of the task. Higher points mean more complex work.">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2">
              {STORY_POINTS_OPTIONS.map((points) => {
                const isSelected = storyPoints === points;
                return (
                  <button
                    key={points}
                    type="button"
                    onClick={() => setStoryPoints(isSelected ? undefined : points)}
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

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(isSelected ? undefined : value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? `${textColor} shadow-md`
                        : `${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                    style={isSelected ? { backgroundColor: getPriorityColor(value, isDarkMode) } : undefined}
                  >
                    <span>{priorityConfig.emoji}</span>
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
                    onClick={() => setTaskType(isSelected ? undefined : value)}
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

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg`}
            >
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
