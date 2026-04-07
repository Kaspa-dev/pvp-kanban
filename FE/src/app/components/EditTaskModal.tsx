import { X, User, Zap, CalendarDays } from "lucide-react";
import { useState } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import * as Popover from "@radix-ui/react-popover";
import { STORY_POINTS_OPTIONS, STORY_POINTS_MIN, STORY_POINTS_MAX } from "../utils/gamification";
import { LabelSelector } from "./LabelSelector";
import { Label } from "../utils/labels";
import { Priority, TaskAssignee, TaskStatus, TaskType } from "../utils/cards";
import { getPriorityColor } from "../utils/priorityColors";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: number, updates: {
    title: string;
    description: string;
    status: TaskStatus;
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number;
    dueDate?: string | null;
    priority?: Priority;
    taskType?: TaskType;
  }) => Promise<void>;
  task: {
    id: number;
    title: string;
    description?: string;
    acceptanceCriteria?: string;
    status: TaskStatus;
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number;
    dueDate?: string | null;
    priority?: Priority;
    taskType?: TaskType;
  } | null;
  availableLabels: Label[];
  onCreateLabel: (name: string, color: string) => Promise<void>;
  availableAssignees: TaskAssignee[];
}

function getInitialTaskState(task: EditTaskModalProps["task"]) {
  return {
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    selectedLabelIds: task?.labelIds || [],
    selectedAssignee: task?.assignee || null,
    storyPoints: task?.storyPoints,
    dueDate: task?.dueDate || "",
    customStoryPoints: task?.storyPoints?.toString() || "",
    priority: task?.priority,
    taskType: task?.taskType,
  };
}

export function EditTaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  availableLabels,
  onCreateLabel,
  availableAssignees,
}: EditTaskModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const initialState = getInitialTaskState(task);

  const [title, setTitle] = useState(initialState.title);
  const [description, setDescription] = useState(initialState.description);
  const [status, setStatus] = useState<TaskStatus>(initialState.status);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(initialState.selectedLabelIds);
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee | null>(initialState.selectedAssignee);
  const [storyPoints, setStoryPoints] = useState<number | undefined>(initialState.storyPoints);
  const [dueDate, setDueDate] = useState(initialState.dueDate);
  const [customStoryPoints, setCustomStoryPoints] = useState(initialState.customStoryPoints);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [priority, setPriority] = useState<Priority | undefined>(initialState.priority);
  const [taskType, setTaskType] = useState<TaskType | undefined>(initialState.taskType);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setSubmitError("Title is required");
      return;
    }

    try {
      setSubmitError("");
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        labelIds: selectedLabelIds,
        assignee: selectedAssignee,
        storyPoints,
        dueDate: dueDate || null,
        priority,
        taskType,
      });

      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save the task right now.");
    }
  };

  const handleStoryPointsChange = (value: number) => {
    setStoryPoints(value);
    setCustomStoryPoints(value.toString());
  };

  const handleCustomStoryPointsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomStoryPoints(value);
    const parsedValue = parseInt(value, 10);
    if (!Number.isNaN(parsedValue) && parsedValue >= STORY_POINTS_MIN && parsedValue <= STORY_POINTS_MAX) {
      setStoryPoints(parsedValue);
    } else if (value === "") {
      setStoryPoints(undefined);
    }
  };

  const priorityOptions: Priority[] = ["low", "medium", "high", "critical"];
  const taskTypeOptions: TaskType[] = ["story", "task", "bug", "spike"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-3xl p-8 mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Edit Task</h2>
          <button
            onClick={onClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              placeholder="Task title"
            />
          </div>

          <div>
            <label htmlFor="description" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all resize-y ${currentTheme.inputBg} ${currentTheme.text}`}
              placeholder="Describe the task in detail... (supports multiple lines)"
            />
          </div>

          <div>
            <label htmlFor="status" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Status *
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="inReview">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <LabelSelector
            availableLabels={availableLabels}
            selectedLabelIds={selectedLabelIds}
            onLabelsChange={setSelectedLabelIds}
            onCreateLabel={onCreateLabel}
          />

          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Assignee
            </label>
            <Popover.Root open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
              <Popover.Trigger asChild>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl hover:${currentTheme.borderHover} transition-colors text-left ${currentTheme.inputBg}`}
                >
                  {selectedAssignee ? (
                    <>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: selectedAssignee.color }}
                      >
                        {selectedAssignee.name.charAt(0)}
                      </div>
                      <span className={`font-medium ${currentTheme.textSecondary}`}>{selectedAssignee.name}</span>
                    </>
                  ) : (
                    <>
                      <User className={`w-5 h-5 ${currentTheme.textMuted}`} />
                      <span className={currentTheme.textMuted}>Select assignee</span>
                    </>
                  )}
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  className={`${currentTheme.cardBg} rounded-xl shadow-xl border-2 ${currentTheme.border} p-3 w-64 z-50`}
                  sideOffset={5}
                >
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedAssignee(null);
                        setIsAssigneeOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:${currentTheme.bgSecondary} transition-colors text-left`}
                    >
                      <User className={`w-5 h-5 ${currentTheme.textMuted}`} />
                      <span className={`font-medium ${currentTheme.textSecondary}`}>Unassigned</span>
                    </button>
                    {availableAssignees.map((assignee) => (
                      <button
                        key={assignee.userId}
                        onClick={() => {
                          setSelectedAssignee(assignee);
                          setIsAssigneeOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                          selectedAssignee?.userId === assignee.userId
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white`
                            : `hover:${currentTheme.bgSecondary} ${currentTheme.text}`
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: assignee.color }}
                        >
                          {assignee.name.charAt(0)}
                        </div>
                        <span className="font-medium">{assignee.name}</span>
                      </button>
                    ))}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
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
                onChange={(event) => setDueDate(event.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Story Points (1-100)
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {STORY_POINTS_OPTIONS.map((points) => (
                <button
                  key={points}
                  onClick={() => handleStoryPointsChange(points)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    storyPoints === points
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                      : `${currentTheme.bgTertiary} ${currentTheme.textSecondary} hover:${currentTheme.bgSecondary}`
                  }`}
                >
                  {points}
                </button>
              ))}
            </div>

            <div className="relative">
              <Zap className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
              <input
                type="number"
                min={STORY_POINTS_MIN}
                max={STORY_POINTS_MAX}
                value={customStoryPoints}
                onChange={handleCustomStoryPointsChange}
                className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
                placeholder="Or enter custom value (1-100)"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(event) => setPriority((event.target.value || undefined) as Priority | undefined)}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
            >
              <option value="">Select priority</option>
              {priorityOptions.map((option) => (
                <option key={option} value={option} style={{ color: getPriorityColor(option) }}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Task Type
            </label>
            <select
              value={taskType}
              onChange={(event) => setTaskType((event.target.value || undefined) as TaskType | undefined)}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
            >
              <option value="">Select task type</option>
              {taskTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className={`flex-1 px-5 py-3 border-2 ${currentTheme.border} ${currentTheme.textSecondary} font-semibold rounded-xl hover:${currentTheme.bgSecondary} transition-all`}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              className={`flex-1 px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
