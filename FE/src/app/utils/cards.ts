import { apiJson, apiVoid } from "./auth";
import type { BoardMember, BoardRole } from "./boards";
import type { BoardLogoColorKey, BoardLogoIconKey } from "./boardIdentity";
import { STORY_POINTS_MAX, STORY_POINTS_MIN } from "./gamification";

export type TaskStatus = "todo" | "inProgress" | "inReview" | "done" | "backlog";
export type Priority = "low" | "medium" | "high" | "critical";
export type TaskType = "story" | "task" | "bug" | "spike";
export type PriorityFilterValue = Priority | "none";
export type TaskTypeFilterValue = TaskType | "none";

export const MAX_TASK_TITLE_LENGTH = 128;
export const MAX_TASK_DESCRIPTION_LENGTH = 2000;
export const MAX_TASK_LABELS = 5;
export const MAX_TASK_DUE_DATE_MONTHS = 6;

export function getTaskTitleValidationError(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Task title is required.";
  }

  if (trimmedValue.length > MAX_TASK_TITLE_LENGTH) {
    return `Task title can be up to ${MAX_TASK_TITLE_LENGTH} characters.`;
  }

  return null;
}

export function getTaskDescriptionValidationError(value: string): string | null {
  if (value.trim().length > MAX_TASK_DESCRIPTION_LENGTH) {
    return `Description can be up to ${MAX_TASK_DESCRIPTION_LENGTH} characters.`;
  }

  return null;
}

export function getTaskLabelsValidationError(labelIds: number[]): string | null {
  if (new Set(labelIds).size > MAX_TASK_LABELS) {
    return `Tasks can have up to ${MAX_TASK_LABELS} labels.`;
  }

  return null;
}

export function getTaskDueDateValidationError(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDate = new Date(`${trimmedValue}T00:00:00`);
  const maxAllowedDate = new Date(localToday);
  maxAllowedDate.setMonth(maxAllowedDate.getMonth() + MAX_TASK_DUE_DATE_MONTHS);

  if (Number.isNaN(selectedDate.getTime())) {
    return "Due date is invalid.";
  }

  if (selectedDate < localToday) {
    return "Due date cannot be before today.";
  }

  if (selectedDate > maxAllowedDate) {
    return `Due date cannot be later than ${MAX_TASK_DUE_DATE_MONTHS} months from today.`;
  }

  return null;
}

export function getStoryPointsValidationError(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (!/^-?\d+$/.test(trimmedValue)) {
    return "Story points must be a whole number.";
  }

  const parsedValue = Number(trimmedValue);
  if (parsedValue < STORY_POINTS_MIN || parsedValue > STORY_POINTS_MAX) {
    return `Story points must be between ${STORY_POINTS_MIN} and ${STORY_POINTS_MAX}.`;
  }

  return null;
}

export interface ApiTask {
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

interface ApiAssigneeSearchResult {
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

export type TaskCommentAuthor = TaskAssignee;

interface ApiTaskComment {
  id: number;
  content: string;
  author: ApiAssignee;
  authorUserId: number;
  createdAt: string;
  updatedAt?: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

interface ApiTaskDetails extends ApiTask {
  comments: ApiTaskComment[];
}

export interface TaskComment {
  id: number;
  content: string;
  author: TaskCommentAuthor;
  authorUserId: number;
  createdAt: string;
  updatedAt?: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface TaskDetails extends Card {
  comments: TaskComment[];
}

export interface Cards {
  todo: Card[];
  inProgress: Card[];
  inReview: Card[];
  done: Card[];
  backlog: Card[];
}

export type TaskQuickFilter = "all" | "assigned" | "due" | "overdue";
export type BacklogStageFilter = "all" | "waiting" | "queued";
export type BoardTaskListScope = "active" | "backlog" | "history";
export type BoardTaskSortKey = "priority" | "title" | "status" | "storyPoints" | "dueDate" | "assignee" | "readiness";
export type BoardTaskSortDirection = "asc" | "desc";
export type MyTasksScope = "active" | "all";

interface PagedBoardTaskListResponse {
  items: ApiTask[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface ApiMyTaskItem extends ApiTask {
  boardId: number;
  boardName: string;
  boardLogoIconKey: BoardLogoIconKey;
  boardLogoColorKey: BoardLogoColorKey;
}

type ApiMyTasksResponse =
  | ApiMyTaskItem[]
  | {
      items: ApiMyTaskItem[];
    };

export interface BoardTaskListPage {
  items: Card[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface MyTask extends Card {
  boardId: number;
  boardName: string;
  boardLogoIconKey: BoardLogoIconKey;
  boardLogoColorKey: BoardLogoColorKey;
}

export interface GetBoardTaskPageInput {
  scope: BoardTaskListScope;
  q?: string;
  quickFilter?: TaskQuickFilter;
  labelIds?: number[];
  assigneeUserIds?: number[];
  priorities?: PriorityFilterValue[];
  taskTypes?: TaskTypeFilterValue[];
  stageFilter?: BacklogStageFilter;
  sort?: BoardTaskSortKey;
  direction?: BoardTaskSortDirection;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
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

function normalizeAssigneeSearchResult(assignee: ApiAssigneeSearchResult): TaskAssignee {
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

export function normalizeTask(task: ApiTask): Card {
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

function normalizeTaskComment(comment: ApiTaskComment): TaskComment {
  return {
    id: comment.id,
    content: comment.content,
    author: normalizeAssignee(comment.author),
    authorUserId: comment.authorUserId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt ?? null,
    canEdit: comment.canEdit,
    canDelete: comment.canDelete,
  };
}

export function normalizeTaskDetails(task: ApiTaskDetails): TaskDetails {
  return {
    ...normalizeTask(task),
    comments: (task.comments ?? []).map(normalizeTaskComment),
  };
}

export function normalizeMyTask(task: ApiMyTaskItem): MyTask {
  return {
    ...normalizeTask(task),
    boardId: task.boardId,
    boardName: task.boardName,
    boardLogoIconKey: task.boardLogoIconKey,
    boardLogoColorKey: task.boardLogoColorKey,
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

export async function searchBoardAssignees(
  boardId: number | string,
  query: string,
  limit = 3,
  signal?: AbortSignal,
): Promise<TaskAssignee[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const results = await apiJson<ApiAssigneeSearchResult[]>(
    `/api/boards/${Number(boardId)}/assignees/search?q=${encodeURIComponent(trimmedQuery)}&limit=${limit}`,
    {
      method: "GET",
      signal,
    },
    "Unable to search board members right now.",
  );

  return results.map(normalizeAssigneeSearchResult);
}

const boardAssigneeSuggestionCache = new Map<number, Promise<TaskAssignee[]> | TaskAssignee[]>();

export function invalidateBoardAssigneeSuggestions(boardId: number | string): void {
  const numericBoardId = Number(boardId);
  if (!Number.isFinite(numericBoardId) || numericBoardId <= 0) {
    return;
  }

  boardAssigneeSuggestionCache.delete(numericBoardId);
}

export async function getBoardAssigneeSuggestions(
  boardId: number | string,
  limit = 3,
): Promise<TaskAssignee[]> {
  const numericBoardId = Number(boardId);
  if (!Number.isFinite(numericBoardId) || numericBoardId <= 0) {
    return [];
  }

  const cachedSuggestions = boardAssigneeSuggestionCache.get(numericBoardId);
  if (Array.isArray(cachedSuggestions)) {
    return cachedSuggestions;
  }

  if (cachedSuggestions) {
    return cachedSuggestions;
  }

  const request = apiJson<ApiAssigneeSearchResult[]>(
    `/api/boards/${numericBoardId}/assignees/suggestions?limit=${limit}`,
    { method: "GET" },
    "Unable to load suggested assignees right now.",
  )
    .then((results) => {
      const suggestions = results.map(normalizeAssigneeSearchResult);
      boardAssigneeSuggestionCache.set(numericBoardId, suggestions);
      return suggestions;
    })
    .catch((error) => {
      boardAssigneeSuggestionCache.delete(numericBoardId);
      throw error;
    });

  boardAssigneeSuggestionCache.set(numericBoardId, request);
  return request;
}

export async function getBoardTaskPage(
  boardId: number | string,
  input: GetBoardTaskPageInput,
): Promise<BoardTaskListPage> {
  const params = new URLSearchParams();
  params.set("scope", input.scope);

  if (input.q?.trim()) {
    params.set("q", input.q.trim());
  }

  if (input.quickFilter && input.quickFilter !== "all") {
    params.set("quickFilter", input.quickFilter);
  }

  if (input.stageFilter && input.stageFilter !== "all") {
    params.set("stageFilter", input.stageFilter);
  }

  if (input.sort) {
    params.set("sort", input.sort);
  }

  if (input.direction) {
    params.set("direction", input.direction);
  }

  if (typeof input.page === "number" && input.page > 0) {
    params.set("page", String(input.page));
  }

  if (typeof input.pageSize === "number" && input.pageSize > 0) {
    params.set("pageSize", String(input.pageSize));
  }

  input.labelIds?.forEach((labelId) => {
    params.append("labelIds", String(labelId));
  });

  input.assigneeUserIds?.forEach((assigneeUserId) => {
    params.append("assigneeUserIds", String(assigneeUserId));
  });

  input.priorities?.forEach((priority) => {
    params.append("priorities", priority);
  });

  input.taskTypes?.forEach((taskType) => {
    params.append("taskTypes", taskType);
  });

  const response = await apiJson<PagedBoardTaskListResponse>(
    `/api/boards/${Number(boardId)}/tasks/index?${params.toString()}`,
    {
      method: "GET",
      signal: input.signal,
    },
    "Unable to load tasks right now.",
  );

  return {
    items: response.items.map(normalizeTask),
    page: response.page,
    pageSize: response.pageSize,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
  };
}

export async function getMyTasks(scope: MyTasksScope = "active"): Promise<MyTask[]> {
  const normalizedScope: MyTasksScope = scope === "all" ? "all" : "active";
  const response = await apiJson<ApiMyTasksResponse>(
    `/api/users/me/tasks?scope=${normalizedScope}`,
    {
      method: "GET",
    },
    "Unable to load your tasks right now.",
  );

  const items = Array.isArray(response) ? response : response.items;
  return items.map(normalizeMyTask);
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
    storyPoints?: number | null;
    dueDate?: string | null;
    priority?: Priority | null;
    taskType?: TaskType | null;
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

export async function getBoardTaskDetails(
  boardId: number | string,
  taskId: number | string,
): Promise<TaskDetails> {
  const task = await apiJson<ApiTaskDetails>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}`,
    { method: "GET" },
    "Unable to load task details right now.",
  );

  return normalizeTaskDetails(task);
}

export async function getTaskComments(
  boardId: number | string,
  taskId: number | string,
): Promise<TaskComment[]> {
  const comments = await apiJson<ApiTaskComment[]>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments`,
    { method: "GET" },
    "Unable to load comments right now.",
  );

  return comments.map(normalizeTaskComment);
}

export async function createTaskComment(
  boardId: number | string,
  taskId: number | string,
  content: string,
): Promise<TaskComment> {
  const comment = await apiJson<ApiTaskComment>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
    "Unable to create the comment right now.",
  );

  return normalizeTaskComment(comment);
}

export async function updateTaskComment(
  boardId: number | string,
  taskId: number | string,
  commentId: number | string,
  content: string,
): Promise<TaskComment> {
  const comment = await apiJson<ApiTaskComment>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments/${Number(commentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ content }),
    },
    "Unable to update the comment right now.",
  );

  return normalizeTaskComment(comment);
}

export async function deleteTaskComment(
  boardId: number | string,
  taskId: number | string,
  commentId: number | string,
): Promise<void> {
  await apiVoid(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments/${Number(commentId)}`,
    { method: "DELETE" },
    "Unable to delete the comment right now.",
  );
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
