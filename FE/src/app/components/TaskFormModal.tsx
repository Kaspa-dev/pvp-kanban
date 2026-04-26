import { Bug, CheckSquare, FileText, HelpCircle, Lightbulb, Zap } from "lucide-react";
import { ChangeEvent, FormEvent } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import {
  MAX_TASK_DUE_DATE_MONTHS,
  MAX_TASK_LABELS,
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASK_TITLE_LENGTH,
  Priority,
  TaskAssignee,
  TaskType,
} from "../utils/cards";
import { PRIORITY_COLORS, getPriorityColor } from "../utils/priorityColors";
import { STORY_POINTS_MAX, STORY_POINTS_MIN, STORY_POINTS_OPTIONS } from "../utils/gamification";
import { Label } from "../utils/labels";
import { FormModalFrame } from "./FormModalFrame";
import { LabelSelector } from "./LabelSelector";
import { PriorityIcon } from "./PriorityIcon";
import { TaskAssigneePicker } from "./TaskAssigneePicker";
import { TaskDueDatePicker } from "./TaskDueDatePicker";
import { UtilityIconButton } from "./UtilityIconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface TaskFormModalProps {
  isOpen: boolean;
  boardId: number;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  formIdPrefix: string;
  taskTitle: string;
  onTaskTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  onTaskTitleBlur?: () => void;
  onDescriptionBlur?: () => void;
  titleError?: string;
  descriptionError?: string;
  dueDateError?: string;
  isSubmitting?: boolean;
  submitError: string;
  availableLabels: Label[];
  selectedLabelIds: number[];
  onSelectedLabelIdsChange: (labelIds: number[]) => void;
  availableAssignees: TaskAssignee[];
  selectedAssignee: TaskAssignee | null;
  onSelectedAssigneeChange: (assignee: TaskAssignee | null) => void;
  storyPoints?: number | null;
  customStoryPoints: string;
  onStoryPointsPresetClick: (points: number) => void;
  onCustomStoryPointsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onStoryPointsBlur?: () => void;
  onClearStoryPoints: () => void;
  storyPointsError?: string;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onDueDateBlur?: () => void;
  priority?: Priority | null;
  onPriorityChange: (priority: Priority | undefined | null) => void;
  taskType?: TaskType | null;
  onTaskTypeChange: (taskType: TaskType | undefined | null) => void;
}

export function TaskFormModal({
  isOpen,
  boardId,
  title,
  submitLabel,
  onClose,
  onSubmit,
  formIdPrefix,
  taskTitle,
  onTaskTitleChange,
  description,
  onDescriptionChange,
  onTaskTitleBlur,
  onDescriptionBlur,
  titleError = "",
  descriptionError = "",
  dueDateError = "",
  isSubmitting = false,
  submitError,
  availableLabels,
  selectedLabelIds,
  onSelectedLabelIdsChange,
  availableAssignees,
  selectedAssignee,
  onSelectedAssigneeChange,
  storyPoints,
  customStoryPoints,
  onStoryPointsPresetClick,
  onCustomStoryPointsChange,
  onStoryPointsBlur,
  onClearStoryPoints,
  storyPointsError = "",
  dueDate,
  onDueDateChange,
  onDueDateBlur,
  priority,
  onPriorityChange,
  taskType,
  onTaskTypeChange,
}: TaskFormModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const priorityOptions: Priority[] = ["low", "medium", "high", "critical"];
  const taskTypeOptions: TaskType[] = ["story", "task", "bug", "spike"];
  const formFieldSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-input-background";
  const hasStoryPointsValue =
    customStoryPoints.trim().length > 0 || storyPoints !== null && storyPoints !== undefined;
  const chipSurfaceClassName = formFieldSurfaceClassName;
  const chipHoverHaloClassName = "hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10";
  const chipTransitionClassName = `transition-[color,box-shadow,border-color] duration-300 ease-out ${chipHoverHaloClassName}`;
  const neutralChipClassName = `border ${currentTheme.inputBorder} ${chipSurfaceClassName} ${currentTheme.textSecondary} hover:${currentTheme.borderHover} ${chipTransitionClassName}`;
  const subtleIconClassName = isDarkMode ? "text-zinc-500" : "text-gray-400";
  const subtleActionButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none ${currentTheme.inputBorder} ${formFieldSurfaceClassName} ${currentTheme.textSecondary}`;
  const cancelButtonClassName = isDarkMode
    ? "border-zinc-700 text-zinc-100 hover:bg-zinc-800"
    : "border-gray-300 text-gray-700 hover:bg-gray-50";
  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg ${currentTheme.focus} ${currentTheme.primary}`;
  const secondaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl border-2 px-5 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${cancelButtonClassName}`;
  const getTaskTypeDisplay = (value: TaskType) => {
    switch (value) {
      case "story":
        return { icon: <FileText className="h-4 w-4" />, label: "Story" };
      case "bug":
        return { icon: <Bug className="h-4 w-4" />, label: "Bug" };
      case "task":
        return { icon: <CheckSquare className="h-4 w-4" />, label: "Task" };
      case "spike":
        return { icon: <Lightbulb className="h-4 w-4" />, label: "Spike" };
      default:
        return { icon: null, label: value };
    }
  };

  return (
    <FormModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeAriaLabel={`Close ${title.toLowerCase()}`}
      onSubmit={onSubmit}
      noValidate
      maxWidthClassName="max-w-4xl"
      height="min(68rem, calc(100dvh - 2rem))"
      viewportClassName="h-full min-h-0 pr-4"
      contentClassName="grid items-start gap-5 px-1 py-1 md:grid-cols-2"
      footer={(
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 ${secondaryActionButtonClassName}`}
              >
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_10%,rgba(255,255,255,0.14)_50%,transparent_90%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10">Cancel</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Close without saving task changes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 ${primaryActionButtonClassName}`}
              >
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_12%,rgba(255,255,255,0.24)_50%,transparent_88%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">
                  {submitLabel}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>{submitLabel}</TooltipContent>
          </Tooltip>
        </>
      )}
    >
      <div className="md:col-span-2">
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor={`${formIdPrefix}-title`} className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
            Task title <span className="text-red-500">*</span>
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className={`h-3.5 w-3.5 cursor-help ${subtleIconClassName}`} />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Add a short task title so the card stays easy to scan in board and list views.
            </TooltipContent>
          </Tooltip>
        </div>
        <input
          id={`${formIdPrefix}-title`}
          type="text"
          value={taskTitle}
          onChange={(event) => onTaskTitleChange(event.target.value)}
          onBlur={onTaskTitleBlur}
          maxLength={MAX_TASK_TITLE_LENGTH}
          aria-invalid={Boolean(titleError)}
          placeholder="Enter task title..."
          className={`w-full px-4 py-3 border-2 rounded-xl placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${formFieldSurfaceClassName} ${currentTheme.text} ${
            titleError ? "border-red-500" : currentTheme.inputBorder
          }`}
          autoFocus
        />
        <p className={`mt-2 text-xs ${titleError ? "text-red-500" : currentTheme.textMuted}`}>
          {titleError || `Up to ${MAX_TASK_TITLE_LENGTH} characters.`}
        </p>
      </div>

      <div className="md:col-span-2">
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor={`${formIdPrefix}-description`} className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
            Description
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className={`h-3.5 w-3.5 cursor-help ${subtleIconClassName}`} />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Add extra implementation details, context, or expectations when the title alone is not enough.
            </TooltipContent>
          </Tooltip>
        </div>
        <textarea
          id={`${formIdPrefix}-description`}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          onBlur={onDescriptionBlur}
          maxLength={MAX_TASK_DESCRIPTION_LENGTH}
          aria-invalid={Boolean(descriptionError)}
          placeholder="Describe the task in detail... (supports multiple lines)"
          rows={6}
          className={`w-full min-h-24 max-h-48 px-4 py-3 border-2 rounded-xl placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-y transition-all ${formFieldSurfaceClassName} ${currentTheme.text} ${
            descriptionError ? "border-red-500" : currentTheme.inputBorder
          }`}
        />
        <p className={`mt-2 text-xs ${descriptionError ? "text-red-500" : currentTheme.textMuted}`}>
          {descriptionError || `Up to ${MAX_TASK_DESCRIPTION_LENGTH} characters.`}
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor={`${formIdPrefix}-assignee`} className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
            Assignee
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className={`h-3.5 w-3.5 cursor-help ${subtleIconClassName}`} />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Search board members and pick one assignee, or clear the field to keep the task unassigned.
            </TooltipContent>
          </Tooltip>
        </div>
        <TaskAssigneePicker
          id={`${formIdPrefix}-assignee`}
          boardId={boardId}
          availableAssignees={availableAssignees}
          selectedAssignee={selectedAssignee}
          onSelectedAssigneeChange={onSelectedAssigneeChange}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor={`${formIdPrefix}-due-date`} className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
            Due date
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className={`h-3.5 w-3.5 cursor-help ${subtleIconClassName}`} />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Add a deadline for this task, or clear it if the work does not need one.
            </TooltipContent>
          </Tooltip>
        </div>
        <TaskDueDatePicker
          id={`${formIdPrefix}-due-date`}
          value={dueDate}
          onChange={onDueDateChange}
          onBlur={onDueDateBlur}
          hasError={Boolean(dueDateError)}
        />
        <p className={`mt-2 text-xs ${dueDateError ? "text-red-500" : currentTheme.textMuted}`}>
          {dueDateError || `Must be between today and ${MAX_TASK_DUE_DATE_MONTHS} months from today.`}
        </p>
      </div>

      <div>
        <LabelSelector
          availableLabels={availableLabels}
          selectedLabelIds={selectedLabelIds}
          onLabelsChange={onSelectedLabelIdsChange}
          maxSelectedLabels={MAX_TASK_LABELS}
        />
        <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
          {`Up to ${MAX_TASK_LABELS} labels.`}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
            Story Points
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className={`h-3.5 w-3.5 cursor-help ${subtleIconClassName}`} />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Estimate the complexity of the task. Higher points mean more complex work.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="relative">
          <Zap className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${hasStoryPointsValue ? currentTheme.primaryText : currentTheme.textMuted}`} />
          <input
            id={`${formIdPrefix}-story-points`}
            type="text"
            inputMode="numeric"
            value={customStoryPoints}
            onChange={onCustomStoryPointsChange}
            onBlur={onStoryPointsBlur}
            aria-invalid={Boolean(storyPointsError)}
            className={`min-h-[52px] w-full rounded-xl border-2 ${formFieldSurfaceClassName} ${currentTheme.text} placeholder:${currentTheme.textMuted} py-3 pl-11 ${hasStoryPointsValue ? "pr-20" : "pr-4"} transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} ${
              storyPointsError ? "border-red-500" : currentTheme.inputBorder
            }`}
            placeholder={`Enter ${STORY_POINTS_MIN}-${STORY_POINTS_MAX} or use a preset`}
          />
          {hasStoryPointsValue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <UtilityIconButton
                  type="button"
                  size="sm"
                  emphasis="default"
                  onClick={onClearStoryPoints}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${subtleActionButtonClassName}`}
                  aria-label="Clear story points"
                >
                  Clear
                </UtilityIconButton>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>Clear story points</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
          Whole number between {STORY_POINTS_MIN} and {STORY_POINTS_MAX}.
        </p>
        {storyPointsError && (
          <p className="mt-1 text-sm text-red-500">{storyPointsError}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {STORY_POINTS_OPTIONS.map((points) => {
            const isSelected = storyPoints === points;
            const selectedChipTextClassName = isDarkMode ? "text-gray-900" : "text-white";
            return (
              <Tooltip key={points}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onStoryPointsPresetClick(points)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium ${
                      isSelected
                        ? `border border-transparent bg-gradient-to-r ${currentTheme.primary} ${selectedChipTextClassName} shadow-md ${chipTransitionClassName}`
                        : neutralChipClassName
                    }`}
                  >
                    {points}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {isSelected ? `Story points set to ${points}` : `Set story points to ${points}`}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
            Task Type
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className={`h-3.5 w-3.5 cursor-help ${subtleIconClassName}`} />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Defines the nature of the work: Story, Task, Bug, or Spike.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-2">
          {taskTypeOptions.map((value) => {
            const isSelected = taskType === value;
            const selectedChipTextClassName = isDarkMode ? "text-gray-900" : "text-white";
            const taskTypeDisplay = getTaskTypeDisplay(value);

            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onTaskTypeChange(isSelected ? undefined : value)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                      isSelected
                        ? `border border-transparent bg-gradient-to-r ${currentTheme.primary} ${selectedChipTextClassName} shadow-md ${chipTransitionClassName}`
                        : neutralChipClassName
                    }`}
                  >
                    {taskTypeDisplay.icon}
                    <span>{taskTypeDisplay.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {isSelected ? `${taskTypeDisplay.label} selected` : `Set task type to ${taskTypeDisplay.label}`}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
            Priority
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className={`h-3.5 w-3.5 cursor-help ${subtleIconClassName}`} />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Indicates how urgent the task is. Critical tasks should be completed first.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((value) => {
            const isSelected = priority === value;
            const priorityConfig = PRIORITY_COLORS[value];
            const textColor = isSelected
              ? (isDarkMode ? "text-gray-900" : "text-white")
              : "";
            const selectedIconColor = isSelected
              ? (isDarkMode ? "#111827" : "#ffffff")
              : undefined;

            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onPriorityChange(isSelected ? undefined : value)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                      isSelected
                        ? `border border-transparent ${textColor} shadow-md ${chipTransitionClassName}`
                        : neutralChipClassName
                    }`}
                    style={isSelected ? { backgroundColor: getPriorityColor(value, isDarkMode) } : undefined}
                  >
                    <PriorityIcon
                      priority={value}
                      isDarkMode={isDarkMode}
                      className="h-4 w-4"
                      colorOverride={selectedIconColor}
                    />
                    <span>{priorityConfig.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {isSelected ? `${priorityConfig.label} priority selected` : `Set priority to ${priorityConfig.label}`}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
          {submitError}
        </div>
      )}
    </FormModalFrame>
  );
}
