import { apiJson } from "./auth";

export interface Sprint {
  id: number;
  boardId: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
  createdAt: string;
  completedAt?: string | null;
}

export async function getBoardSprints(boardId: number | string): Promise<Sprint[]> {
  return apiJson<Sprint[]>(
    `/api/boards/${Number(boardId)}/sprints`,
    { method: "GET" },
    "Unable to load sprints right now.",
  );
}

export async function createSprint(
  boardId: number | string,
  name: string,
  startDate: string,
  endDate: string,
): Promise<Sprint> {
  return apiJson<Sprint>(
    `/api/boards/${Number(boardId)}/sprints`,
    {
      method: "POST",
      body: JSON.stringify({ name, startDate, endDate }),
    },
    "Unable to create the sprint right now.",
  );
}

export async function updateSprint(
  boardId: number | string,
  sprintId: number | string,
  updates: Pick<Sprint, "name" | "startDate" | "endDate">,
): Promise<Sprint> {
  return apiJson<Sprint>(
    `/api/boards/${Number(boardId)}/sprints/${Number(sprintId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
    "Unable to update the sprint right now.",
  );
}

export async function startSprint(boardId: number | string, sprintId: number | string): Promise<Sprint> {
  return apiJson<Sprint>(
    `/api/boards/${Number(boardId)}/sprints/${Number(sprintId)}/start`,
    { method: "POST" },
    "Unable to start the sprint right now.",
  );
}

export async function completeSprint(boardId: number | string, sprintId: number | string): Promise<Sprint> {
  return apiJson<Sprint>(
    `/api/boards/${Number(boardId)}/sprints/${Number(sprintId)}/complete`,
    { method: "POST" },
    "Unable to complete the sprint right now.",
  );
}

export function getActiveSprint(sprints: Sprint[]): Sprint | null {
  return sprints.find((sprint) => sprint.status === "active") ?? null;
}

export function getPlannedSprint(sprints: Sprint[]): Sprint | null {
  return sprints.find((sprint) => sprint.status === "planned") ?? null;
}

export function getCompletedSprints(sprints: Sprint[]): Sprint[] {
  return sprints
    .filter((sprint) => sprint.status === "completed")
    .sort((a, b) => new Date(b.completedAt || b.endDate).getTime() - new Date(a.completedAt || a.endDate).getTime());
}

export function getSprintStats(sprintId: number, cards: Array<{ sprintId?: number | null; status: string; storyPoints?: number }>) {
  const sprintTasks = cards.filter((card) => card.sprintId === sprintId);
  const completedTasks = sprintTasks.filter((card) => card.status === "done");

  return {
    totalTasks: sprintTasks.length,
    completedTasks: completedTasks.length,
    totalStoryPoints: sprintTasks.reduce((sum, card) => sum + (card.storyPoints || 0), 0),
    completedStoryPoints: completedTasks.reduce((sum, card) => sum + (card.storyPoints || 0), 0),
    tasksByStatus: {
      todo: sprintTasks.filter((card) => card.status === "todo").length,
      inProgress: sprintTasks.filter((card) => card.status === "inProgress").length,
      inReview: sprintTasks.filter((card) => card.status === "inReview").length,
      done: sprintTasks.filter((card) => card.status === "done").length,
    },
  };
}
