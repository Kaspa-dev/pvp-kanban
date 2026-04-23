import { HelpCircle, Zap } from "lucide-react";
import { ChangeEvent, FormEvent } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import {
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
  availableAssignees: TaskAssignee[];
  selectedAssignee: TaskAssignee | null;
  onSelectedAssigneeChange: (assignee: TaskAssignee | null) => void;
  storyPoints?: number | null;
  customStoryPoints: string;
  onStoryPointsPresetClick: (points: number) => void;
  onCustomStoryPointsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearStoryPoints: () => void;
  storyPointsError?: string;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  priority?: Priority | null;
  onPriorityChange: (priority: Priority | undefined | null) => void;
  taskType?: TaskType | null;
  onTaskTypeChange: (taskType: TaskType | undefined | null) => void;
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
  availableAssignees,
  selectedAssignee,
  onSelectedAssigneeChange,
  storyPoints,
  customStoryPoints,
  onStoryPointsPresetClick,
  onCustomStoryPointsChange,
  onClearStoryPoints,
  storyPointsError = "",
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
  const formFieldSurfaceClassName = "bg-input-background dark:bg-input/30";
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
  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;
  const secondaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl border-2 px-5 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${cancelButtonClassName}`;

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
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 ${secondaryActionButtonClassName}`}
          >
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_10%,rgba(255,255,255,0.14)_50%,transparent_90%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10">Cancel</span>
          </button>
          <button
            type="submit"
            className={`flex-1 ${primaryActionButtonClassName}`}
          >
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_12%,rgba(255,255,255,0.24)_50%,transparent_88%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">
              {submitLabel}
            </span>
          </button>
        </>
      )}
    >
      <div className="md:col-span-2">
        <label htmlFor={`${formIdPrefix}-title`} className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
          Task title <span className="text-red-500">*</span>
        </label>
        <input
          id={`${formIdPrefix}-title`}
          type="text"
          value={taskTitle}
          onChange={(event) => onTaskTitleChange(event.target.value)}
          maxLength={MAX_TASK_TITLE_LENGTH}
          placeholder="Enter task title..."
          className={`w-full px-4 py-3 border-2 rounded-xl placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${formFieldSurfaceClassName} ${currentTheme.text} ${
            showTitleError ? "border-red-500" : currentTheme.inputBorder
          }`}
          autoFocus
        />
        <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
          Up to {MAX_TASK_TITLE_LENGTH} characters.
        </p>
        {showTitleError && (
          <p className="text-red-500 text-sm mt-1">Title is required</p>
        )}
      </div>

      <div className="md:col-span-2">
        <label htmlFor={`${formIdPrefix}-description`} className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
          Description <span className={`${currentTheme.textMuted} font-normal`}>(optional)</span>
        </label>
        <textarea
          id={`${formIdPrefix}-description`}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          maxLength={MAX_TASK_DESCRIPTION_LENGTH}
          placeholder="Describe the task in detail... (supports multiple lines)"
          rows={6}
          className={`w-full min-h-24 max-h-48 px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-y transition-all ${formFieldSurfaceClassName} ${currentTheme.text}`}
        />
        <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
          Up to {MAX_TASK_DESCRIPTION_LENGTH} characters.
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
        />
      </div>

      <LabelSelector
        availableLabels={availableLabels}
        selectedLabelIds={selectedLabelIds}
        onLabelsChange={onSelectedLabelIdsChange}
      />

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
            type="text"
            inputMode="numeric"
            value={customStoryPoints}
            onChange={onCustomStoryPointsChange}
            aria-invalid={Boolean(storyPointsError)}
            className={`min-h-[52px] w-full rounded-xl border-2 ${formFieldSurfaceClassName} ${currentTheme.text} placeholder:${currentTheme.textMuted} py-3 pl-11 ${hasStoryPointsValue ? "pr-20" : "pr-4"} transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} ${
              storyPointsError ? "border-red-500" : currentTheme.inputBorder
            }`}
            placeholder={`Enter ${STORY_POINTS_MIN}-${STORY_POINTS_MAX} or use a preset`}
          />
          {hasStoryPointsValue && (
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
          )}
        </div>
        <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
          Optional. Use a whole number between {STORY_POINTS_MIN} and {STORY_POINTS_MAX}.
        </p>
        {storyPointsError && (
          <p className="mt-1 text-sm text-red-500">{storyPointsError}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {STORY_POINTS_OPTIONS.map((points) => {
            const isSelected = storyPoints === points;
            const selectedChipTextClassName = isDarkMode ? "text-gray-900" : "text-white";
            return (
              <button
                key={points}
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

            return (
              <button
                key={value}
                type="button"
                onClick={() => onTaskTypeChange(isSelected ? undefined : value)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium ${
                  isSelected
                    ? `border border-transparent bg-gradient-to-r ${currentTheme.primary} ${selectedChipTextClassName} shadow-md ${chipTransitionClassName}`
                    : neutralChipClassName
                }`}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
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
                  colorOverride={isSelected ? selectedIconColor : undefined}
                />
                <span>{priorityConfig.label}</span>
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
    </FormModalFrame>
  );
}
