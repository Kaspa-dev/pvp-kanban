import { apiJson, apiVoid } from "./auth";

interface ApiLabel {
  id: number;
  name: string;
  color: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export const MAX_BOARD_LABELS = 12;
export const MAX_LABEL_NAME_LENGTH = 15;
export const DEFAULT_LABEL_COLOR = "#64748b";

export function normalizeLabelName(name: string): string {
  return name.trim().toLowerCase();
}

export async function getBoardLabels(boardId: number | string): Promise<Label[]> {
  return apiJson<Label[]>(
    `/api/boards/${Number(boardId)}/labels`,
    { method: "GET" },
    "Unable to load labels right now.",
  );
}

export async function createLabel(boardId: number | string, name: string, color: string): Promise<Label> {
  const label = await apiJson<ApiLabel>(
    `/api/boards/${Number(boardId)}/labels`,
    {
      method: "POST",
      body: JSON.stringify({ name, color }),
    },
    "Unable to create the label right now.",
  );

  return label;
}

export async function updateLabel(
  boardId: number | string,
  labelId: number | string,
  updates: Partial<Label>,
): Promise<Label> {
  const label = await apiJson<ApiLabel>(
    `/api/boards/${Number(boardId)}/labels/${Number(labelId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        name: updates.name,
        color: updates.color,
      }),
    },
    "Unable to update the label right now.",
  );

  return label;
}

export async function deleteLabel(boardId: number | string, labelId: number | string): Promise<void> {
  await apiVoid(
    `/api/boards/${Number(boardId)}/labels/${Number(labelId)}`,
    { method: "DELETE" },
    "Unable to delete the label right now.",
  );
}

export const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#78716c",
];
