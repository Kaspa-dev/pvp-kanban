import { apiJson } from "./auth";
import type { BoardMember, BoardRole } from "./boards";
import type { Card, Priority, TaskType, TaskStatus } from "./cards";

export interface PlanningPokerParticipant {
  participantId: number;
  displayName: string;
  isHost: boolean;
  isGuest: boolean;
  hasVoted: boolean;
}

export interface PlanningPokerSessionTask {
  sessionTaskId: number;
  taskId: number;
  title: string;
  description: string;
  position: number;
  roundState: string;
  recommendedStoryPoints: number | null;
  appliedStoryPoints: number | null;
}

export interface PlanningPokerSession {
  sessionId: number;
  boardId: number;
  joinToken: string;
  joinUrl: string;
  status: string;
  activeTask: PlanningPokerSessionTask;
  queue: PlanningPokerSessionTask[];
  participants: PlanningPokerParticipant[];
  isRevealed: boolean;
}

interface ApiPlanningPokerTaskAssignee {
  userId: number;
  username: string;
  displayName: string;
  email: string;
  color: string;
  role: BoardRole;
}

interface ApiPlanningPokerBoardTask {
  id: number;
  title: string;
  description: string;
  statusKey: TaskStatus;
  isQueued: boolean;
  labelIds: number[];
  assigneeUserId: number | null;
  assignee: ApiPlanningPokerTaskAssignee | null;
  reporterUserId: number;
  storyPoints?: number;
  dueDate?: string | null;
  priority?: Priority;
  taskType?: TaskType;
}

const UNASSIGNED_PLANNING_POKER_ASSIGNEE: BoardMember = {
  userId: 0,
  username: "",
  displayName: "Unassigned",
  email: "",
  color: "#9ca3af",
  role: "member",
  name: "Unassigned",
};

function normalizePlanningPokerTask(task: ApiPlanningPokerBoardTask): Card {
  const assignee = task.assignee
    ? {
        userId: task.assignee.userId,
        username: task.assignee.username,
        displayName: task.assignee.displayName,
        email: task.assignee.email,
        color: task.assignee.color,
        role: task.assignee.role,
        name: task.assignee.displayName,
      }
    : UNASSIGNED_PLANNING_POKER_ASSIGNEE;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    labelIds: task.labelIds ?? [],
    assignee,
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

export async function createPlanningPokerSession(
  boardId: number | string,
): Promise<PlanningPokerSession> {
  return apiJson<PlanningPokerSession>(
    `/api/boards/${Number(boardId)}/planning-poker/session`,
    { method: "POST" },
    "Unable to create the planning poker session right now.",
  );
}

export async function getPlanningPokerSession(
  boardId: number | string,
): Promise<PlanningPokerSession> {
  return apiJson<PlanningPokerSession>(
    `/api/boards/${Number(boardId)}/planning-poker/session`,
    { method: "GET" },
    "Unable to load the planning poker session right now.",
  );
}

export async function applyPlanningPokerRecommendation(
  boardId: number | string,
  sessionTaskId: number,
): Promise<Card> {
  const task = await apiJson<ApiPlanningPokerBoardTask>(
    `/api/boards/${Number(boardId)}/planning-poker/apply`,
    {
      method: "POST",
      body: JSON.stringify({ sessionTaskId }),
    },
    "Unable to apply the planning poker recommendation right now.",
  );

  return normalizePlanningPokerTask(task);
}
