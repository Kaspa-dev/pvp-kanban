import { ChangeEvent, useState } from "react";
import { Label } from "../utils/labels";
import {
  getStoryPointsValidationError,
  getTaskDueDateValidationError,
  getTaskDescriptionValidationError,
  getTaskTitleValidationError,
  Priority,
  TaskAssignee,
  TaskType,
} from "../utils/cards";
import { TaskFormModal } from "./TaskFormModal";

interface AddCardModalProps {
  isOpen: boolean;
  boardId: number;
  onClose: () => void;
  onAdd: (card: {
    title: string;
    description: string;
    status: "todo" | "inProgress" | "inReview" | "done" | "backlog";
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number;
    dueDate?: string | null;
    priority?: Priority;
    taskType?: TaskType;
  }) => Promise<void>;
  availableLabels: Label[];
  availableAssignees: TaskAssignee[];
}

export function AddCardModal({
  isOpen,
  boardId,
  onClose,
  onAdd,
  availableLabels,
  availableAssignees,
}: AddCardModalProps) {
  const formIdPrefix = "add-task";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [customStoryPoints, setCustomStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [taskType, setTaskType] = useState<TaskType | undefined>(undefined);
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

  if (!isOpen) return null;

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedLabelIds([]);
    setSelectedAssignee(null);
    setSubmitError("");
    setStoryPoints(undefined);
    setCustomStoryPoints("");
    setDueDate("");
    setPriority(undefined);
    setTaskType(undefined);
    setIsSubmitting(false);
    setHasTriedSubmit(false);
    setTouchedFields({
      title: false,
      description: false,
      storyPoints: false,
      dueDate: false,
    });
  };

  const handleCancel = () => {
    resetForm();
    onClose();
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
      await onAdd({
        title: title.trim(),
        description: description.trim(),
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
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create the task right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoryPointsPresetClick = (value: number) => {
    const nextValue = storyPoints === value ? undefined : value;
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
      setStoryPoints(undefined);
      return;
    }

    setStoryPoints(parseInt(value, 10));
  };

  const handleClearStoryPoints = () => {
    setStoryPoints(undefined);
    setCustomStoryPoints("");
  };

  return (
    <TaskFormModal
      isOpen={isOpen}
      boardId={boardId}
      title="Add new task"
      submitLabel="Create task"
      onClose={handleCancel}
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
      onPriorityChange={(value) => setPriority(value ?? undefined)}
      taskType={taskType}
      onTaskTypeChange={(value) => setTaskType(value ?? undefined)}
    />
  );
}
