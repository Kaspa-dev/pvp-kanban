import { ChangeEvent, useState } from "react";
import { Label } from "../utils/labels";
import { getStoryPointsValidationError, Priority, TaskAssignee, TaskType } from "../utils/cards";
import { TaskFormModal } from "./TaskFormModal";

interface AddCardModalProps {
  isOpen: boolean;
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
  onCreateLabel: (name: string, color: string) => Promise<void>;
  availableAssignees: TaskAssignee[];
}

export function AddCardModal({
  isOpen,
  onClose,
  onAdd,
  availableLabels,
  onCreateLabel,
  availableAssignees,
}: AddCardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee | null>(null);
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [customStoryPoints, setCustomStoryPoints] = useState("");
  const [storyPointsError, setStoryPointsError] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [taskType, setTaskType] = useState<TaskType | undefined>(undefined);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedLabelIds([]);
    setSelectedAssignee(null);
    setShowError(false);
    setSubmitError("");
    setStoryPoints(undefined);
    setCustomStoryPoints("");
    setStoryPointsError("");
    setDueDate("");
    setPriority(undefined);
    setTaskType(undefined);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextShowTitleError = !title.trim();
    const nextStoryPointsError = getStoryPointsValidationError(customStoryPoints) ?? "";

    setShowError(nextShowTitleError);
    setStoryPointsError(nextStoryPointsError);

    if (nextShowTitleError || nextStoryPointsError) {
      return;
    }

    try {
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
    }
  };

  const handleStoryPointsPresetClick = (value: number) => {
    const nextValue = storyPoints === value ? undefined : value;
    setStoryPoints(nextValue);
    setCustomStoryPoints(nextValue?.toString() || "");
    setStoryPointsError("");
  };

  const handleCustomStoryPointsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomStoryPoints(value);

    const validationError = getStoryPointsValidationError(value);
    setStoryPointsError(validationError ?? "");

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

  return (
    <TaskFormModal
      isOpen={isOpen}
      title="Add new task"
      submitLabel="Create task"
      onClose={handleCancel}
      onSubmit={handleSubmit}
      formIdPrefix="add-task"
      taskTitle={title}
      onTaskTitleChange={(value) => {
        setTitle(value);
        if (showError && value.trim()) {
          setShowError(false);
        }
      }}
      description={description}
      onDescriptionChange={setDescription}
      showTitleError={showError}
      submitError={submitError}
      availableLabels={availableLabels}
      selectedLabelIds={selectedLabelIds}
      onSelectedLabelIdsChange={setSelectedLabelIds}
      onCreateLabel={onCreateLabel}
      availableAssignees={availableAssignees}
      selectedAssignee={selectedAssignee}
      onSelectedAssigneeChange={setSelectedAssignee}
      storyPoints={storyPoints}
      customStoryPoints={customStoryPoints}
      onStoryPointsPresetClick={handleStoryPointsPresetClick}
      onCustomStoryPointsChange={handleCustomStoryPointsChange}
      storyPointsError={storyPointsError}
      dueDate={dueDate}
      onDueDateChange={setDueDate}
      priority={priority}
      onPriorityChange={(value) => setPriority(value ?? undefined)}
      taskType={taskType}
      onTaskTypeChange={(value) => setTaskType(value ?? undefined)}
    />
  );
}
