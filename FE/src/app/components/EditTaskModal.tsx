import { ChangeEvent, useState } from "react";
import { Label } from "../utils/labels";
import { getStoryPointsValidationError, Priority, TaskAssignee, TaskStatus, TaskType } from "../utils/cards";
import { TaskFormModal } from "./TaskFormModal";

interface EditTaskModalProps {
  isOpen: boolean;
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
  onClose,
  onSave,
  task,
  availableLabels,
  availableAssignees,
}: EditTaskModalProps) {
  const initialState = getInitialTaskState(task);
  const [title, setTitle] = useState(initialState.title);
  const [description, setDescription] = useState(initialState.description);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(initialState.selectedLabelIds);
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee | null>(initialState.selectedAssignee);
  const [storyPoints, setStoryPoints] = useState<number | null | undefined>(initialState.storyPoints);
  const [dueDate, setDueDate] = useState(initialState.dueDate);
  const [customStoryPoints, setCustomStoryPoints] = useState(initialState.customStoryPoints);
  const [storyPointsError, setStoryPointsError] = useState("");
  const [priority, setPriority] = useState<Priority | null | undefined>(initialState.priority);
  const [taskType, setTaskType] = useState<TaskType | null | undefined>(initialState.taskType);
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen || !task) return null;

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
    }
  };

  const handleStoryPointsPresetClick = (value: number) => {
    const nextValue = storyPoints === value ? null : value;
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
      setStoryPoints(null);
      return;
    }

    setStoryPoints(parseInt(value, 10));
  };

  const handleClearStoryPoints = () => {
    setStoryPoints(null);
    setCustomStoryPoints("");
    setStoryPointsError("");
  };

  return (
    <TaskFormModal
      isOpen={isOpen}
      title="Edit task"
      submitLabel="Save changes"
      onClose={onClose}
      onSubmit={handleSubmit}
      formIdPrefix="edit-task"
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
      availableAssignees={availableAssignees}
      selectedAssignee={selectedAssignee}
      onSelectedAssigneeChange={setSelectedAssignee}
      storyPoints={storyPoints}
      customStoryPoints={customStoryPoints}
      onStoryPointsPresetClick={handleStoryPointsPresetClick}
      onCustomStoryPointsChange={handleCustomStoryPointsChange}
      onClearStoryPoints={handleClearStoryPoints}
      storyPointsError={storyPointsError}
      dueDate={dueDate}
      onDueDateChange={setDueDate}
      priority={priority}
      onPriorityChange={(value) => setPriority(value ?? null)}
      taskType={taskType}
      onTaskTypeChange={(value) => setTaskType(value ?? null)}
    />
  );
}
