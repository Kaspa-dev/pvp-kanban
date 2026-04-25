import { ChangeEvent, useState } from "react";
import { Label } from "../utils/labels";
import {
  getStoryPointsValidationError,
  getTaskDueDateValidationError,
  getTaskDescriptionValidationError,
  getTaskTitleValidationError,
  Priority,
  TaskAssignee,
  TaskStatus,
  TaskType,
} from "../utils/cards";
import { TaskFormModal } from "./TaskFormModal";

interface EditTaskModalProps {
  isOpen: boolean;
  boardId: number;
  onClose: () => void;
  onSave: (cardId: number, updates: {
    title: string;
    description: string;
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number | null;
    dueDate?: string | null;
    priority?: Priority | null;
    taskType?: TaskType | null;
  }) => Promise<void>;
  task: {
    id: number;
    title: string;
    description?: string;
    acceptanceCriteria?: string;
    status: TaskStatus;
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number | null;
    dueDate?: string | null;
    priority?: Priority | null;
    taskType?: TaskType | null;
  } | null;
  availableLabels: Label[];
  availableAssignees: TaskAssignee[];
}

function getInitialTaskState(task: EditTaskModalProps["task"]) {
  return {
    title: task?.title || "",
    description: task?.description || "",
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
  boardId,
  onClose,
  onSave,
  task,
  availableLabels,
  availableAssignees,
}: EditTaskModalProps) {
  const formIdPrefix = "edit-task";
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
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    title: false,
    description: false,
    storyPoints: false,
    dueDate: false,
  });
  const titleError = getTaskTitleValidationError(title) ?? "";
  const descriptionError = getTaskDescriptionValidationError(description) ?? "";
  const dueDateError = getTaskDueDateValidationError(dueDate) ?? "";
  const storyPointsError = getStoryPointsValidationError(customStoryPoints) ?? "";
  const canSubmit = !titleError && !descriptionError && !dueDateError && !storyPointsError;
  const displayTitleError = (hasTriedSubmit || touchedFields.title) ? titleError : "";
  const displayDescriptionError = (hasTriedSubmit || touchedFields.description) ? descriptionError : "";
  const displayDueDateError = (hasTriedSubmit || touchedFields.dueDate) ? dueDateError : "";
  const displayStoryPointsError = (hasTriedSubmit || touchedFields.storyPoints) ? storyPointsError : "";

  if (!isOpen || !task) return null;

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasTriedSubmit(true);

    if (!canSubmit) {
      focusFirstInvalidField();
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
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

      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save the task right now.");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <TaskFormModal
      isOpen={isOpen}
      boardId={boardId}
      title="Edit task"
      submitLabel="Save changes"
      onClose={onClose}
      onSubmit={handleSubmit}
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
      isSubmitting={isSubmitting}
      submitError={submitError}
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
    />
  );
}
