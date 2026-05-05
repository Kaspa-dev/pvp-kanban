import { ChangeEvent, FormEvent } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import {
  Priority,
  TaskAssignee,
  TaskType,
} from "../utils/cards";
import { Label } from "../utils/labels";
import { FormModalFrame } from "./FormModalFrame";
import { TaskFormFields } from "./TaskFormFields";
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
  const cancelButtonClassName = isDarkMode
    ? "border-zinc-700 text-zinc-100 hover:bg-zinc-800"
    : "border-gray-300 text-gray-700 hover:bg-gray-50";
  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg ${currentTheme.focus} ${currentTheme.primary}`;
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
      contentClassName="px-1 py-1"
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
      <TaskFormFields
        boardId={boardId}
        formIdPrefix={formIdPrefix}
        taskTitle={taskTitle}
        onTaskTitleChange={onTaskTitleChange}
        description={description}
        onDescriptionChange={onDescriptionChange}
        onTaskTitleBlur={onTaskTitleBlur}
        onDescriptionBlur={onDescriptionBlur}
        titleError={titleError}
        descriptionError={descriptionError}
        dueDateError={dueDateError}
        availableLabels={availableLabels}
        selectedLabelIds={selectedLabelIds}
        onSelectedLabelIdsChange={onSelectedLabelIdsChange}
        availableAssignees={availableAssignees}
        selectedAssignee={selectedAssignee}
        onSelectedAssigneeChange={onSelectedAssigneeChange}
        storyPoints={storyPoints}
        customStoryPoints={customStoryPoints}
        onStoryPointsPresetClick={onStoryPointsPresetClick}
        onCustomStoryPointsChange={onCustomStoryPointsChange}
        onStoryPointsBlur={onStoryPointsBlur}
        onClearStoryPoints={onClearStoryPoints}
        storyPointsError={storyPointsError}
        dueDate={dueDate}
        onDueDateChange={onDueDateChange}
        onDueDateBlur={onDueDateBlur}
        priority={priority}
        onPriorityChange={onPriorityChange}
        taskType={taskType}
        onTaskTypeChange={onTaskTypeChange}
      />
    </FormModalFrame>
  );
}
