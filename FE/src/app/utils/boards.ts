import { ApiError, apiJson, apiVoid } from "./auth";
import {
  BoardLogoColorKey,
  BoardLogoIconKey,
  normalizeBoardLogoColorKey,
  normalizeBoardLogoIconKey,
} from "./boardIdentity";

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
  logoIconKey: string;
  logoColorKey: string;
  createdAt: string;
  creatorUserId: number;
  members: ApiBoardMember[];
}

interface ApiBoardListItem extends ApiBoard {
  memberCount: number;
  hasActiveSprint: boolean;
  activeSprintName: string | null;
  remainingActiveSprintTasks: number;
}

interface ApiBoardListSummary {
  activeProjects: number;
  activeSprints: number;
  assignedTasks: number;
  openTasks: number;
  completedTasks: number;
}

interface ApiPagedBoardListResponse {
  items: ApiBoardListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary: ApiBoardListSummary;
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
  logoIconKey: BoardLogoIconKey;
  logoColorKey: BoardLogoColorKey;
  createdAt: string;
  creatorUserId: number;
  members: BoardMember[];
}

export type BoardMembershipFilter = "all" | "owned" | "shared";
export type BoardSort = "newest" | "nameAsc" | "nameDesc";

export interface BoardListQuery {
  q?: string;
  membership?: BoardMembershipFilter;
  activeSprint?: boolean;
  sort?: BoardSort;
  page?: number;
  pageSize?: number;
}

export interface BoardListSummary {
  activeProjects: number;
  activeSprints: number;
  assignedTasks: number;
  openTasks: number;
  completedTasks: number;
}

export interface BoardListItem extends Board {
  memberCount: number;
  hasActiveSprint: boolean;
  activeSprintName: string | null;
  remainingActiveSprintTasks: number;
}

export interface PagedBoardListResponse {
  items: BoardListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary: BoardListSummary;
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
    logoIconKey: normalizeBoardLogoIconKey(board.logoIconKey),
    logoColorKey: normalizeBoardLogoColorKey(board.logoColorKey),
    createdAt: board.createdAt,
    creatorUserId: board.creatorUserId,
    members: board.members.map(normalizeMember),
  };
}

function normalizeBoardListItem(board: ApiBoardListItem): BoardListItem {
  return {
    ...normalizeBoard(board),
    memberCount: board.memberCount,
    hasActiveSprint: board.hasActiveSprint,
    activeSprintName: board.activeSprintName,
    remainingActiveSprintTasks: board.remainingActiveSprintTasks,
  };
}

export function isBoardOwner(board: Board, userId: string | number): boolean {
  return board.members.some(
    (member) => member.userId === Number(userId) && member.role === "owner",
  );
}

export async function getUserBoardsPage(query: BoardListQuery = {}): Promise<PagedBoardListResponse> {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.membership && query.membership !== "all") {
    params.set("membership", query.membership);
  }

  if (query.activeSprint) {
    params.set("activeSprint", "true");
  }

  if (query.sort && query.sort !== "newest") {
    params.set("sort", query.sort);
  }

  if (query.page && query.page > 0) {
    params.set("page", String(query.page));
  }

  if (query.pageSize && query.pageSize > 0) {
    params.set("pageSize", String(query.pageSize));
  }

  const response = await apiJson<ApiPagedBoardListResponse>(
    `/api/boards${params.size > 0 ? `?${params.toString()}` : ""}`,
    { method: "GET" },
    "Unable to load projects right now.",
  );

  return {
    items: response.items.map(normalizeBoardListItem),
    page: response.page,
    pageSize: response.pageSize,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
    summary: response.summary,
  };
}

export async function createBoard(
  name: string,
  description: string,
  logoIconKey: BoardLogoIconKey,
  logoColorKey: BoardLogoColorKey,
  memberUserIds: number[],
): Promise<Board> {
  const board = await apiJson<ApiBoard>(
    "/api/boards",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        logoIconKey,
        logoColorKey,
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
  updates: {
    name: string;
    description: string;
    logoIconKey: BoardLogoIconKey;
    logoColorKey: BoardLogoColorKey;
    memberUserIds: number[];
  },
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
