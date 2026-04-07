import { ApiError, apiJson, apiVoid } from "./auth";

export type BoardRole = "owner" | "member";

interface ApiBoardMember {
  userId: number;
  username: string;
  displayName: string;
  email: string;
  color: string;
  role: BoardRole;
}

interface ApiBoard {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  creatorUserId: number;
  members: ApiBoardMember[];
}

export interface BoardMember {
  userId: number;
  username: string;
  displayName: string;
  email: string;
  color: string;
  role: BoardRole;
  name: string;
}

export interface Board {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  creatorUserId: number;
  members: BoardMember[];
}

export type BoardFetchResult =
  | { status: "success"; board: Board }
  | { status: "forbidden" }
  | { status: "notFound" }
  | { status: "error"; error: string };

function normalizeMember(member: ApiBoardMember): BoardMember {
  return {
    ...member,
    name: member.displayName,
  };
}

function normalizeBoard(board: ApiBoard): Board {
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    createdAt: board.createdAt,
    creatorUserId: board.creatorUserId,
    members: board.members.map(normalizeMember),
  };
}

export function isBoardOwner(board: Board, userId: string | number): boolean {
  return board.members.some(
    (member) => member.userId === Number(userId) && member.role === "owner",
  );
}

export async function getUserBoards(): Promise<Board[]> {
  const boards = await apiJson<ApiBoard[]>(
    "/api/boards",
    { method: "GET" },
    "Unable to load projects right now.",
  );

  return boards.map(normalizeBoard);
}

export async function createBoard(
  name: string,
  description: string,
  memberUserIds: number[],
): Promise<Board> {
  const board = await apiJson<ApiBoard>(
    "/api/boards",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        memberUserIds,
      }),
    },
    "Unable to create the project right now.",
  );

  return normalizeBoard(board);
}

export async function getBoard(boardId: number | string): Promise<BoardFetchResult> {
  try {
    const board = await apiJson<ApiBoard>(
      `/api/boards/${Number(boardId)}`,
      { method: "GET" },
      "Unable to load this project right now.",
    );

    return {
      status: "success",
      board: normalizeBoard(board),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { status: "forbidden" };
      }

      if (error.status === 404) {
        return { status: "notFound" };
      }
    }

    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unable to load this project right now.",
    };
  }
}

export async function updateBoard(
  boardId: number | string,
  updates: { name: string; description: string; memberUserIds: number[] },
): Promise<Board> {
  const board = await apiJson<ApiBoard>(
    `/api/boards/${Number(boardId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
    "Unable to save project changes right now.",
  );

  return normalizeBoard(board);
}

export async function deleteBoard(boardId: number | string): Promise<void> {
  await apiVoid(
    `/api/boards/${Number(boardId)}`,
    { method: "DELETE" },
    "Unable to delete the project right now.",
  );
}
