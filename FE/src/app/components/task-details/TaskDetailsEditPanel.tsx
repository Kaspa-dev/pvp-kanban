import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Board } from "../../utils/boards";
import {
  getStoryPointsValidationError,
  getTaskDescriptionValidationError,
  getTaskDueDateValidationError,
  getTaskTitleValidationError,
  type Priority,
  type TaskAssignee,
  type TaskDetails,
  type TaskType,
} from "../../utils/cards";
import type { Label } from "../../utils/labels";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { TaskFormFields } from "../TaskFormFields";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export type TaskDetailsEditUpdates = {
  title: string;
  description: string;
  labelIds: number[];
  assignee: TaskAssignee | null;
  storyPoints?: number | null;
  dueDate?: string | null;
  priority?: Priority | null;
  taskType?: TaskType | null;
};

interface TaskDetailsEditPanelProps {
  board: Board;
  boardId: number;
  task: TaskDetails;
  availableLabels: Label[];
  availableAssignees: TaskAssignee[];
  onCancel: () => void;
  onSave: (cardId: number, updates: TaskDetailsEditUpdates) => Promise<void>;
}

function getInitialTaskState(task: TaskDetails) {
  return {
    title: task.title,
    description: task.description || "",
    selectedLabelIds: task.labelIds,
    selectedAssignee: task.assigneeUserId ? task.assignee : null,
    storyPoints: task.storyPoints,
    dueDate: task.dueDate || "",
    customStoryPoints: task.storyPoints?.toString() || "",
    priority: task.priority,
    taskType: task.taskType,
  };
}

export function TaskDetailsEditPanel({
  board,
  boardId,
  task,
  availableLabels,
  availableAssignees,
  onCancel,
  onSave,
}: TaskDetailsEditPanelProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const formIdPrefix = `task-details-edit-${task.id}`;
  const initialState = getInitialTaskState(task);
  const [title, setTitle] = useState(initialState.title);
  const [description, setDescription] = useState(initialState.description);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(initialState.selectedLabelIds);
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee | null>(initialState.selectedAssignee);
  const [storyPoints, setStoryPoints] = useState<number | null | undefined>(initialState.storyPoints);
  const [dueDate, setDueDate] = useState(initialState.dueDate);
  const [customStoryPoints, setCustomStoryPoints] = useState(initialState.customStoryPoints);
  const [priority, setPriority] = useState<Priority | null | undefined>(initialState.priority);
  const [taskType, setTaskType] = useState<TaskType | null | undefined>(initialState.taskType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    title: false,
    description: false,
    storyPoints: false,
    dueDate: false,
  });

  const dividerClassName = isDarkMode ? "border-white/10" : "border-slate-200/80";
  const isDueDateChanged = dueDate !== initialState.dueDate;
  const titleError = getTaskTitleValidationError(title) ?? "";
  const descriptionError = getTaskDescriptionValidationError(description) ?? "";
  const dueDateError = isDueDateChanged ? getTaskDueDateValidationError(dueDate) ?? "" : "";
  const storyPointsError = getStoryPointsValidationError(customStoryPoints) ?? "";
  const canSubmit = !titleError && !descriptionError && !dueDateError && !storyPointsError;
  const displayTitleError = (hasTriedSubmit || touchedFields.title) ? titleError : "";
  const displayDescriptionError = (hasTriedSubmit || touchedFields.description) ? descriptionError : "";
  const displayDueDateError = (hasTriedSubmit || touchedFields.dueDate) ? dueDateError : "";
  const displayStoryPointsError = (hasTriedSubmit || touchedFields.storyPoints) ? storyPointsError : "";
  const cancelButtonClassName = `group inline-flex h-10 items-center justify-center rounded-xl border-2 px-4 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.inputBorder} ${currentTheme.textSecondary} ${
    isDarkMode ? "bg-zinc-900/70 hover:bg-zinc-800/85" : "bg-white/90 hover:bg-slate-50"
  } hover:${currentTheme.text}`;
  const saveButtonClassName = `group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r px-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg ${currentTheme.focus} ${currentTheme.primary}`;

  const markFieldTouched = (field: keyof typeof touchedFields) => {
    setTouchedFields((previous) => ({
      ...previous,
      [field]: true,
    }));
  };

  const focusFirstInvalidField = () => {
    const firstInvalidFieldId =
      titleError ? `${formIdPrefix}-title`
      : descriptionError ? `${formIdPrefix}-description`
      : dueDateError ? `${formIdPrefix}-due-date`
      : storyPointsError ? `${formIdPrefix}-story-points`
      : null;

    if (!firstInvalidFieldId) {
      return;
    }

    window.requestAnimationFrame(() => {
      const field = document.getElementById(firstInvalidFieldId);
      if (field instanceof HTMLElement) {
        field.focus();
      }
    });
  };

  const handleStoryPointsPresetClick = (value: number) => {
    const nextValue = storyPoints === value ? null : value;
    setStoryPoints(nextValue);
    setCustomStoryPoints(nextValue?.toString() || "");
  };

  const handleCustomStoryPointsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomStoryPoints(value);

    const validationError = getStoryPointsValidationError(value);
    if (validationError) {
      setStoryPoints(undefined);
      return;
    }

    if (value.trim() === "") {
      setStoryPoints(null);
      return;
    }

    setStoryPoints(parseInt(value, 10));
  };

  const handleClearStoryPoints = () => {
    setStoryPoints(null);
    setCustomStoryPoints("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasTriedSubmit(true);

    if (!canSubmit) {
      focusFirstInvalidField();
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        labelIds: selectedLabelIds,
        assignee: selectedAssignee,
        storyPoints,
        dueDate: dueDate || null,
        priority,
        taskType,
      });
    } catch {
      // Parent handlers own toast feedback. Keep the page form open for corrections or retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`overflow-hidden rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} shadow-[0_24px_70px_-46px_rgba(15,23,42,0.48)]`}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={`border-b px-5 py-5 sm:px-6 ${dividerClassName}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link
                to={Number.isFinite(boardId) ? `/app/${boardId}` : "/app"}
                aria-label={`Back to ${board.name}`}
                className={`group inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r px-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to board
              </Link>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:pt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className={cancelButtonClassName}
                  >
                    Cancel
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Discard task changes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={saveButtonClassName}
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_12%,rgba(255,255,255,0.24)_50%,transparent_88%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative z-10">Save changes</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Save task changes</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <TaskFormFields
            boardId={boardId}
            formIdPrefix={formIdPrefix}
            taskTitle={title}
            onTaskTitleChange={setTitle}
            onTaskTitleBlur={() => markFieldTouched("title")}
            description={description}
            onDescriptionChange={setDescription}
            onDescriptionBlur={() => markFieldTouched("description")}
            titleError={displayTitleError}
            descriptionError={displayDescriptionError}
            dueDateError={displayDueDateError}
            availableLabels={availableLabels}
            selectedLabelIds={selectedLabelIds}
            onSelectedLabelIdsChange={setSelectedLabelIds}
            availableAssignees={availableAssignees}
            selectedAssignee={selectedAssignee}
            onSelectedAssigneeChange={setSelectedAssignee}
            storyPoints={storyPoints}
            customStoryPoints={customStoryPoints}
            onStoryPointsPresetClick={handleStoryPointsPresetClick}
            onCustomStoryPointsChange={handleCustomStoryPointsChange}
            onStoryPointsBlur={() => markFieldTouched("storyPoints")}
            onClearStoryPoints={handleClearStoryPoints}
            storyPointsError={displayStoryPointsError}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            onDueDateBlur={() => markFieldTouched("dueDate")}
            priority={priority}
            onPriorityChange={(value) => setPriority(value ?? null)}
            taskType={taskType}
            onTaskTypeChange={(value) => setTaskType(value ?? null)}
            layoutClassName="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]"
          />
        </div>
      </form>
    </section>
  );
}
