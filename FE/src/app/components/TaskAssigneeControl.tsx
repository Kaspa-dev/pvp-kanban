import { TaskAssignee } from "../utils/cards";
import { AssigneePopover } from "./AssigneePopover";

interface TaskAssigneeControlProps {
  boardId: number;
  taskId: number;
  assignee: TaskAssignee;
  availableAssignees: TaskAssignee[];
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void | Promise<void>;
}

export function TaskAssigneeControl({
  boardId,
  taskId,
  assignee,
  availableAssignees,
  onAssigneeChange,
}: TaskAssigneeControlProps) {
  return (
    <AssigneePopover
      boardId={boardId}
      currentAssignee={assignee}
      onAssigneeChange={(newAssignee) => onAssigneeChange(taskId, newAssignee)}
      availableAssignees={availableAssignees}
    />
  );
}
