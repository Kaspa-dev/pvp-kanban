import { ChangeEvent, useEffect, useState } from "react";
import { Label } from "../utils/labels";
import { Priority, TaskAssignee, TaskStatus, TaskType } from "../utils/cards";
import { STORY_POINTS_MAX, STORY_POINTS_MIN } from "../utils/gamification";
import { TaskFormModal } from "./TaskFormModal";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee | null>(null);
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState("");
  const [customStoryPoints, setCustomStoryPoints] = useState("");
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [taskType, setTaskType] = useState<TaskType | undefined>(undefined);
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen || !task) {
      return;
    }

    const initialState = getInitialTaskState(task);
    setTitle(initialState.title);
    setDescription(initialState.description);
    setStatus(initialState.status);
    setSelectedLabelIds(initialState.selectedLabelIds);
    setSelectedAssignee(initialState.selectedAssignee);
    setStoryPoints(initialState.storyPoints);
    setDueDate(initialState.dueDate);
    setCustomStoryPoints(initialState.customStoryPoints);
    setPriority(initialState.priority);
    setTaskType(initialState.taskType);
    setShowError(false);
    setSubmitError("");
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setShowError(true);
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

  const handleStoryPointsPresetClick = (value: number) => {
    const nextValue = storyPoints === value ? undefined : value;
    setStoryPoints(nextValue);
    setCustomStoryPoints(nextValue?.toString() || "");
  };

  const handleCustomStoryPointsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomStoryPoints(value);

    const parsedValue = parseInt(value, 10);
    if (!Number.isNaN(parsedValue) && parsedValue >= STORY_POINTS_MIN && parsedValue <= STORY_POINTS_MAX) {
      setStoryPoints(parsedValue);
    } else if (value === "") {
      setStoryPoints(undefined);
    }
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
      onCreateLabel={onCreateLabel}
      availableAssignees={availableAssignees}
      selectedAssignee={selectedAssignee}
      onSelectedAssigneeChange={setSelectedAssignee}
      status={status}
      onStatusChange={setStatus}
      storyPoints={storyPoints}
      customStoryPoints={customStoryPoints}
      onStoryPointsPresetClick={handleStoryPointsPresetClick}
      onCustomStoryPointsChange={handleCustomStoryPointsChange}
      dueDate={dueDate}
      onDueDateChange={setDueDate}
      priority={priority}
      onPriorityChange={setPriority}
      taskType={taskType}
      onTaskTypeChange={setTaskType}
    />
  );
}
