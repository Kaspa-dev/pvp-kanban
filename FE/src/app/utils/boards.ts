// Board/Project management utilities
import { migrateBoardCardsStorage } from "./cards";
import { migrateBoardLabelsStorage } from "./labels";
import { migrateSprintBoardId } from "./sprints";

export interface BoardMember {
  name: string;
  color: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  members: BoardMember[];
  theme?: string;
  sprint?: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

const BOARDS_STORAGE_KEY = 'banban_boards';
export const SHARED_DEMO_BOARD_ID = "board_demo_shared";
const DEFAULT_DEMO_BOARD_NAME = "Shared Demo Board";
const DEFAULT_DEMO_BOARD_DESCRIPTION = "Shared mock board for realtime collaboration demos.";

function getSharedDemoBoard(): Board {
  return {
    id: SHARED_DEMO_BOARD_ID,
    name: DEFAULT_DEMO_BOARD_NAME,
    description: DEFAULT_DEMO_BOARD_DESCRIPTION,
    createdAt: new Date(0).toISOString(),
    createdBy: "system",
    members: [
      { name: "You", color: "#3b82f6" },
      { name: "Jonas", color: "#10b981" },
      { name: "Marius", color: "#8b5cf6" },
      { name: "Laura", color: "#f59e0b" },
    ],
  };
}

function normalizeDefaultBoard(boards: Board[]): { boards: Board[]; changed: boolean } {
  const legacyDefaultBoard = boards.find((board) =>
    board.id === SHARED_DEMO_BOARD_ID ||
    (
      board.name === "My First Project" &&
      board.description === "Welcome to BanBan! This is your first project board."
    )
  );

  if (!legacyDefaultBoard) {
    return { boards, changed: false };
  }

  if (legacyDefaultBoard.id !== SHARED_DEMO_BOARD_ID) {
    migrateBoardCardsStorage(legacyDefaultBoard.id, SHARED_DEMO_BOARD_ID);
    migrateBoardLabelsStorage(legacyDefaultBoard.id, SHARED_DEMO_BOARD_ID);
    migrateSprintBoardId(legacyDefaultBoard.id, SHARED_DEMO_BOARD_ID);
  }

  return {
    boards: boards.filter((board) => board.id !== legacyDefaultBoard.id && board.id !== SHARED_DEMO_BOARD_ID),
    changed: true,
  };
}

// Get all boards for a user
export function getUserBoards(userId: string): Board[] {
  const boardsData = localStorage.getItem(`${BOARDS_STORAGE_KEY}_${userId}`);
  if (!boardsData) {
    return [getSharedDemoBoard()];
  }
  try {
    const parsedBoards = JSON.parse(boardsData) as Board[];
    const normalizedBoards = normalizeDefaultBoard(parsedBoards);

    if (normalizedBoards.changed) {
      saveUserBoards(userId, normalizedBoards.boards);
    }

    return [getSharedDemoBoard(), ...normalizedBoards.boards];
  } catch {
    return [getSharedDemoBoard()];
  }
}

// Save boards for a user
export function saveUserBoards(userId: string, boards: Board[]): void {
  localStorage.setItem(`${BOARDS_STORAGE_KEY}_${userId}`, JSON.stringify(boards));
}

// Create a new board
export function createBoard(
  userId: string,
  name: string,
  description: string,
  members: BoardMember[]
): Board {
  const newBoard: Board = {
    id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    members,
  };

  const boards = getUserBoards(userId);
  boards.push(newBoard);
  saveUserBoards(userId, boards);

  return newBoard;
}

// Get a specific board
export function getBoard(userId: string, boardId: string): Board | null {
  if (boardId === SHARED_DEMO_BOARD_ID) {
    return getSharedDemoBoard();
  }

  const boards = getUserBoards(userId);
  return boards.find(b => b.id === boardId) || null;
}

// Update a board
export function updateBoard(userId: string, boardId: string, updates: Partial<Board>): boolean {
  if (boardId === SHARED_DEMO_BOARD_ID) {
    return false;
  }

  const boards = getUserBoards(userId);
  const index = boards.findIndex(b => b.id === boardId);
  
  if (index === -1) {
    return false;
  }

  boards[index] = { ...boards[index], ...updates };
  saveUserBoards(userId, boards);
  return true;
}

// Delete a board
export function deleteBoard(userId: string, boardId: string): boolean {
  if (boardId === SHARED_DEMO_BOARD_ID) {
    return false;
  }

  const boards = getUserBoards(userId);
  const filtered = boards.filter(b => b.id !== boardId);
  
  if (filtered.length === boards.length) {
    return false; // Board not found
  }

  saveUserBoards(userId, filtered);
  
  // Also delete board's cards
  localStorage.removeItem(`banban_cards_${boardId}`);
  
  return true;
}

// Create default demo boards for new users
export function createDefaultBoards(userId: string, userName: string): Board[] {
  return getUserBoards(userId);
}

export function ensureSharedDemoBoard(_userId: string, _userName: string): Board {
  return getSharedDemoBoard();
}
