import { apiJson } from "./auth";
import { normalizeTask } from "./cards";
import type { ApiTask, Card } from "./cards";

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
  const task = await apiJson<ApiTask>(
    `/api/boards/${Number(boardId)}/planning-poker/apply`,
    {
      method: "POST",
      body: JSON.stringify({ sessionTaskId }),
    },
    "Unable to apply the planning poker recommendation right now.",
  );

  return normalizeTask(task);
}
