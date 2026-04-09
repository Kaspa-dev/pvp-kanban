import { apiJson, apiVoid } from "./auth";
import type { BoardMember, BoardRole } from "./boards";

export type TaskStatus = "todo" | "inProgress" | "inReview" | "done" | "backlog";
export type Priority = "low" | "medium" | "high" | "critical";
export type TaskType = "story" | "task" | "bug" | "spike";

interface ApiTask {
  id: number;
  title: string;
  description: string;
  statusKey: TaskStatus;
  isQueued: boolean;
  labelIds: number[];
  assigneeUserId: number | null;
  assignee: ApiAssignee | null;
  reporterUserId: number;
  storyPoints?: number;
  dueDate?: string | null;
  priority?: Priority;
  taskType?: TaskType;
}

interface ApiAssignee {
  userId: number;
  username: string;
  displayName: string;
  email: string;
  color: string;
  role: BoardRole;
}

export type TaskAssignee = BoardMember;

export interface Card {
  id: number;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  labelIds: number[];
  assignee: TaskAssignee;
  assigneeUserId: number | null;
  status: TaskStatus;
  isQueued?: boolean;
  storyPoints?: number;
  dueDate?: string | null;
  priority?: Priority;
  taskType?: TaskType;
  reporterUserId?: number;
}

export interface Cards {
  todo: Card[];
  inProgress: Card[];
  inReview: Card[];
  done: Card[];
  backlog: Card[];
}

export const UNASSIGNED_ASSIGNEE: TaskAssignee = {
  userId: 0,
  username: "",
  displayName: "Unassigned",
  email: "",
  color: "#9ca3af",
  role: "member",
  name: "Unassigned",
};

function normalizeAssignee(assignee: ApiAssignee | null): TaskAssignee {
  if (!assignee) {
    return UNASSIGNED_ASSIGNEE;
  }

  return {
    userId: assignee.userId,
    username: assignee.username,
    displayName: assignee.displayName,
    email: assignee.email,
    color: assignee.color,
    role: assignee.role,
    name: assignee.displayName,
  };
}

function normalizeTask(task: ApiTask): Card {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    labelIds: task.labelIds ?? [],
    assignee: normalizeAssignee(task.assignee),
    assigneeUserId: task.assigneeUserId,
    status: task.statusKey,
    isQueued: task.isQueued ?? false,
    storyPoints: task.storyPoints,
    dueDate: task.dueDate ?? null,
    priority: task.priority,
    taskType: task.taskType,
    reporterUserId: task.reporterUserId,
  };
}

export function createEmptyCards(): Cards {
  return {
    todo: [],
    inProgress: [],
    inReview: [],
    done: [],
    backlog: [],
  };
}

export function groupCards(tasks: Card[]): Cards {
  return tasks.reduce<Cards>((acc, task) => {
    acc[task.status].push(task);
    return acc;
  }, createEmptyCards());
}

export function flattenCards(cards: Cards): Card[] {
  return [
    ...cards.todo,
    ...cards.inProgress,
    ...cards.inReview,
    ...cards.done,
    ...cards.backlog,
  ];
}

export async function getBoardCards(boardId: number | string): Promise<Cards> {
  const tasks = await apiJson<ApiTask[]>(
    `/api/boards/${Number(boardId)}/tasks`,
    { method: "GET" },
    "Unable to load tasks right now.",
  );

  return groupCards(tasks.map(normalizeTask));
}

export async function createBoardTask(
  boardId: number | string,
  input: {
    title: string;
    description: string;
    status: TaskStatus;
    labelIds: number[];
    assigneeUserId: number | null;
    storyPoints?: number;
    dueDate?: string | null;
    priority?: Priority;
    taskType?: TaskType;
  },
): Promise<Card> {
  const task = await apiJson<ApiTask>(
    `/api/boards/${Number(boardId)}/tasks`,
    {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        statusKey: input.status,
        labelIds: input.labelIds,
        assigneeUserId: input.assigneeUserId,
        storyPoints: input.storyPoints,
        dueDate: input.dueDate ?? null,
        priority: input.priority,
        taskType: input.taskType,
      }),
    },
    "Unable to create the task right now.",
  );

  return normalizeTask(task);
}

export async function updateBoardTask(
  boardId: number | string,
  taskId: number | string,
  input: {
    title: string;
    description: string;
    status: TaskStatus;
    labelIds: number[];
    assigneeUserId: number | null;
    storyPoints?: number;
    dueDate?: string | null;
    priority?: Priority;
    taskType?: TaskType;
  },
): Promise<Card> {
  const task = await apiJson<ApiTask>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        statusKey: input.status,
        labelIds: input.labelIds,
        assigneeUserId: input.assigneeUserId,
        storyPoints: input.storyPoints,
        dueDate: input.dueDate ?? null,
        priority: input.priority,
        taskType: input.taskType,
      }),
    },
    "Unable to save the task right now.",
  );

  return normalizeTask(task);
}

export async function deleteBoardTask(
  boardId: number | string,
  taskId: number | string,
): Promise<void> {
  await apiVoid(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}`,
    { method: "DELETE" },
    "Unable to delete the task right now.",
  );
}

export async function addTaskToQueue(
  boardId: number | string,
  taskId: number | string,
): Promise<Card> {
  const task = await apiJson<ApiTask>(
    `/api/boards/${Number(boardId)}/queue/tasks/${Number(taskId)}`,
    { method: "POST" },
    "Unable to add the task to the queue right now.",
  );

  return normalizeTask(task);
}

export async function removeTaskFromQueue(
  boardId: number | string,
  taskId: number | string,
): Promise<Card> {
  const task = await apiJson<ApiTask>(
    `/api/boards/${Number(boardId)}/queue/tasks/${Number(taskId)}`,
    { method: "DELETE" },
    "Unable to remove the task from the queue right now.",
  );

  return normalizeTask(task);
}

export async function startBoardQueue(
  boardId: number | string,
): Promise<Card[]> {
  const tasks = await apiJson<ApiTask[]>(
    `/api/boards/${Number(boardId)}/queue/start`,
    { method: "POST" },
    "Unable to start the queue right now.",
  );

  return tasks.map(normalizeTask);
}
